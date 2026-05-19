"""
Esquemas Pydantic — Administración QHALI Sprint 6.
"""

from datetime import datetime
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel


class StatusUpdateRequest(BaseModel):
    status: str


class AdminIncidentItem(BaseModel):
    id: int
    public_alias: str
    category: str
    description: str
    image_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    validation_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class MetricsResponse(BaseModel):
    total_reportes: int
    reportes_pendientes: int
    reportes_confirmados: int
    reportes_en_revision: int
    reportes_resueltos: int
    categoria_mas_frecuente: Optional[str]
