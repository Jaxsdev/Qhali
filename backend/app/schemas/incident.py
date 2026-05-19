"""Schemas de request/response para incidencias — Sprint 3."""

from datetime import datetime
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel


class IncidentResponse(BaseModel):
    id: int
    public_alias: str
    category: str
    description: str
    image_url: Optional[str]
    latitude: float
    longitude: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentPublicItem(BaseModel):
    id: int
    public_alias: str
    category: str
    description: str
    image_url: Optional[str]
    latitude: float
    longitude: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
