"""
Modelo de Incidencia — QHALI MVP
Define la estructura del reporte ciudadano con geolocalización.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class IncidentStatus(str, Enum):
    """Estados posibles de una incidencia."""
    pendiente = "pendiente"
    confirmado = "confirmado"
    en_revision = "en_revisión"
    resuelto = "resuelto"


class IncidentCategory(str, Enum):
    """Categorías de incidencias urbanas."""
    bache = "bache"
    alumbrado = "alumbrado"
    basura = "basura"
    agua = "agua"
    alcantarillado = "alcantarillado"
    señalizacion = "señalización"
    areas_verdes = "áreas_verdes"
    ruido = "ruido"
    seguridad = "seguridad"
    otro = "otro"


class IncidentBase(BaseModel):
    """Campos base de una incidencia."""
    title: str = Field(
        ...,
        description="Título breve de la incidencia",
        min_length=5,
        max_length=200,
    )
    description: str = Field(
        ...,
        description="Descripción detallada de la incidencia",
        min_length=10,
        max_length=2000,
    )
    category: IncidentCategory = Field(
        ...,
        description="Categoría de la incidencia",
    )
    # ── Geolocalización ──
    latitude: float = Field(
        ...,
        description="Latitud GPS del incidente",
        ge=-90,
        le=90,
    )
    longitude: float = Field(
        ...,
        description="Longitud GPS del incidente",
        ge=-180,
        le=180,
    )
    location_accuracy: Optional[float] = Field(
        None,
        description="Precisión de la ubicación GPS en metros",
        ge=0,
    )
    distrito: Optional[str] = Field(
        None,
        description="Distrito donde ocurre la incidencia (preparado para PostGIS)",
        max_length=100,
    )


class IncidentCreate(IncidentBase):
    """Esquema para crear una nueva incidencia."""
    photo_url: Optional[str] = Field(
        None,
        description="URL de la foto del incidente",
    )


class IncidentResponse(IncidentBase):
    """Esquema de respuesta de una incidencia."""
    id: int
    user_id: int
    photo_url: Optional[str] = None
    status: IncidentStatus = IncidentStatus.pendiente
    validation_count: int = 0
    resolution_image_url: Optional[str] = None
    resolution_comment: Optional[str] = None
    confidence_score: Optional[float] = Field(
        None,
        description="Puntaje de confianza basado en validaciones (uso futuro)",
        ge=0,
        le=1,
    )
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IncidentInDB(IncidentBase):
    """Modelo completo del incidente como se almacena en BD."""
    id: int
    user_id: int
    photo_url: Optional[str] = None
    status: IncidentStatus = IncidentStatus.pendiente
    validation_count: int = 0
    resolution_image_url: Optional[str] = None
    resolution_comment: Optional[str] = None
    confidence_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
