"""Schemas de validaciones ciudadanas — Sprint 5."""

from datetime import datetime
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class ValidateRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitud actual del validador")
    longitude: float = Field(..., ge=-180, le=180, description="Longitud actual del validador")


class ValidateResponse(BaseModel):
    validation_id: int
    incident_id: int
    validation_count: int
    status: str
    message: str


class NearbyIncidentItem(BaseModel):
    id: int
    public_alias: str
    category: str
    description: str
    image_url: Optional[str]
    latitude: float
    longitude: float
    status: str
    validation_count: int
    created_at: datetime
    distance_meters: float

    class Config:
        from_attributes = True
