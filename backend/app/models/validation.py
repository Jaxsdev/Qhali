"""
Modelo de Validación Ciudadana — QHALI MVP
Define la estructura de la validación cruzada entre ciudadanos.
Un ciudadano puede validar un incidente si está dentro del radio de cercanía.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ValidationBase(BaseModel):
    """Campos base de una validación ciudadana."""
    incident_id: int = Field(
        ...,
        description="ID del incidente que se está validando",
    )
    is_confirmed: bool = Field(
        ...,
        description="Si el ciudadano confirma la existencia del incidente",
    )
    latitude: float = Field(
        ...,
        description="Latitud GPS del validador al momento de validar",
        ge=-90,
        le=90,
    )
    longitude: float = Field(
        ...,
        description="Longitud GPS del validador al momento de validar",
        ge=-180,
        le=180,
    )
    comment: Optional[str] = Field(
        None,
        description="Comentario opcional del validador",
        max_length=500,
    )


class ValidationCreate(ValidationBase):
    """Esquema para crear una nueva validación."""
    pass


class ValidationResponse(ValidationBase):
    """Esquema de respuesta de una validación."""
    id: int
    user_id: int
    distance_to_incident: float = Field(
        ...,
        description="Distancia en metros entre el validador y el incidente",
    )
    created_at: datetime

    class Config:
        from_attributes = True


class ValidationInDB(ValidationBase):
    """Modelo completo de la validación como se almacena en BD."""
    id: int
    user_id: int
    distance_to_incident: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
