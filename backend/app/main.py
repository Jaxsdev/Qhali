"""Punto de entrada principal de la API QHALI."""

import os

# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, incidents, validations, admin

# Registrar modelos ORM y crear tablas al iniciar
import app.models.user_db       # noqa: F401
import app.models.incident_db   # noqa: F401
import app.models.validation_db  # noqa: F401 — Sprint 5: tabla validations
Base.metadata.create_all(bind=engine)

# pyrefly: ignore [missing-import]
from sqlalchemy import text  # noqa: E402

# Sprint 4 — migración idempotente: añadir validation_count si no existe
try:
    with engine.connect() as _conn:
        _conn.execute(text(
            "ALTER TABLE incidents ADD COLUMN validation_count INTEGER NOT NULL DEFAULT 0"
        ))
        _conn.commit()
except Exception:
    pass  # columna ya existe

# Integración de IA — migración de columnas de Claude
for col, type_str in [("ai_category", "VARCHAR"), ("ai_priority", "VARCHAR"), ("ai_is_valid", "BOOLEAN"), ("ai_summary", "VARCHAR")]:
    try:
        with engine.connect() as _conn:
            _conn.execute(text(f"ALTER TABLE incidents ADD COLUMN {col} {type_str}"))
            _conn.commit()
    except Exception:
        pass

# Sprint 5 — migración idempotente: crear tabla validations si no existe
try:
    with engine.connect() as _conn:
        _conn.execute(text("""
            CREATE TABLE IF NOT EXISTS validations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id INTEGER NOT NULL REFERENCES incidents(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(incident_id, user_id)
            )
        """))
        _conn.commit()
except Exception:
    pass  # tabla ya existe

# Directorio de imágenes subidas
_UPLOADS_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "uploads", "images")
)
os.makedirs(_UPLOADS_DIR, exist_ok=True)

# ── Crear aplicación ──
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API del MVP QHALI — Sistema de reporte ciudadano de incidencias urbanas "
        "con geolocalización, validación social cruzada y dashboard de gestión."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Servir imágenes subidas en /static/images/
app.mount("/static/images", StaticFiles(directory=_UPLOADS_DIR), name="images")

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"], summary="Verificar estado de la API")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# ── Registrar routers ──
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Usuarios"])
app.include_router(incidents.router, prefix="/api/v1/incidents", tags=["Incidencias"])
app.include_router(validations.router, prefix="/api/v1/validations", tags=["Validaciones"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administración"])


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Bienvenido a QHALI API", "docs": "/docs", "health": "/health"}
