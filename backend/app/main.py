"""
Punto de entrada principal de la API QHALI.
FastAPI application con todos los routers registrados.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, users, incidents, validations, admin

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


# ── Health Check ──
@app.get(
    "/health",
    tags=["Health"],
    summary="Verificar estado de la API",
    description="Endpoint de salud que confirma que la API está ejecutándose correctamente.",
)
async def health_check():
    """Endpoint de salud. Responde con status ok si la API está activa."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ── Registrar routers ──
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Usuarios"])
app.include_router(incidents.router, prefix="/api/v1/incidents", tags=["Incidencias"])
app.include_router(validations.router, prefix="/api/v1/validations", tags=["Validaciones"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administración"])


@app.get("/", tags=["Root"])
async def root():
    """Ruta raíz con información básica de la API."""
    return {
        "message": "Bienvenido a QHALI API",
        "docs": "/docs",
        "health": "/health",
    }
