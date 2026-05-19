"""
Configuración central del backend QHALI.
Carga variables de entorno y define settings globales.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuración de la aplicación QHALI."""

    # ── Aplicación ──
    APP_NAME: str = "QHALI API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # ── Base de datos ──
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/qhali"

    # ── Autenticación ──
    SECRET_KEY: str = "qhali-dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # ── Geolocalización ──
    NEARBY_RADIUS_METERS: float = 300.0
    DUPLICATE_RADIUS_METERS: float = 50.0

    # ── Archivos / Fotos ──
    MAX_PHOTO_SIZE_MB: int = 5
    UPLOAD_DIR: str = "uploads"

    # ── CORS ──
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
