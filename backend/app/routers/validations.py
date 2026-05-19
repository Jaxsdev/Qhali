"""
Router de Validaciones — QHALI Sprint 5.
GET /incident/{incident_id} — lista las validaciones de un incidente.
"""

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.validation_db import Validation

router = APIRouter()


@router.get(
    "/incident/{incident_id}",
    summary="Listar validaciones de un incidente",
    description="Retorna el conteo de validaciones ciudadanas de una incidencia.",
)
def list_validations_by_incident(incident_id: int, db: Session = Depends(get_db)):
    """Cuenta cuántas validaciones tiene un incidente."""
    count = db.query(Validation).filter(Validation.incident_id == incident_id).count()
    return {"incident_id": incident_id, "validation_count": count}
