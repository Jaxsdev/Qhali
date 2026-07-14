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
    address: Optional[str] = None
    status: str
    validation_count: int = 0
    created_at: datetime
    ai_category: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_is_valid: Optional[bool] = None
    ai_summary: Optional[str] = None

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
    address: Optional[str] = None
    status: str
    validation_count: int = 0
    created_at: datetime
    ai_category: Optional[str] = None
    ai_priority: Optional[str] = None
    ai_is_valid: Optional[bool] = None
    ai_summary: Optional[str] = None

    class Config:
        from_attributes = True


class DuplicateItem(BaseModel):
    id: int
    description: str
    status: str
    distance_meters: float


class DuplicateCheckResponse(BaseModel):
    has_duplicates: bool
    duplicates: list[DuplicateItem]


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    latitude: float
    longitude: float


class CommentResponse(CommentBase):
    id: int
    incident_id: int
    user_id: int
    public_alias: str
    created_at: datetime

    class Config:
        from_attributes = True
