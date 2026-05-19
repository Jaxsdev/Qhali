"""SQLAlchemy ORM model para validaciones ciudadanas — QHALI Sprint 5."""

# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func

from app.database import Base


class Validation(Base):
    __tablename__ = "validations"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("incident_id", "user_id", name="uq_validation_incident_user"),
    )
