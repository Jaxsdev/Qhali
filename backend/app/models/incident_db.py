"""SQLAlchemy ORM model para incidentes de QHALI."""

# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func

from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    public_alias = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_accuracy = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    status = Column(String, default="Pendiente", nullable=False, index=True)
    validation_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Evidencia de Resolución ──
    resolution_image_url = Column(String, nullable=True)
    resolution_comment = Column(String, nullable=True)

    # ── Campos de IA (Claude) ──
    ai_category = Column(String, nullable=True)
    ai_priority = Column(String, nullable=True)
    ai_is_valid = Column(Boolean, nullable=True)
    ai_summary = Column(String, nullable=True)


class IncidentComment(Base):
    __tablename__ = "incident_comments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    public_alias = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

