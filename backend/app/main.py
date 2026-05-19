"""Punto de entrada principal de la API QHALI."""

# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, incidents, validations, admin

# Crear tablas en BD al iniciar (SQLite para desarrollo)
import app.models.user_db  # noqa: F401 — registra el modelo en Base.metadata
Base.metadata.create_all(bind=engine)

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
