"""
Router de Incidencias — QHALI Sprint 3 / 4.
POST /              — crear reporte (protegido, multipart/form-data).
GET  /public        — lista pública para el mapa ciudadano.
GET  /my            — historial privado del usuario autenticado.
GET  /{incident_id} — detalle de un incidente.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
# pyrefly: ignore [missing-import]
from sqlalchemy import and_, or_
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.incident_db import Incident
from app.models.user_db import User
from app.schemas.incident import IncidentPublicItem, IncidentResponse
from app.utils.auth_utils import get_current_user
from app.utils.geo_validation import validate_coordinates

router = APIRouter()

_UPLOAD_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "images")
)
_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

_VALID_CATEGORIES = {
    "bache", "alumbrado", "basura", "agua", "alcantarillado",
    "señalización", "áreas_verdes", "ruido", "seguridad", "otro",
}


# ── POST / — Crear incidente ─────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=IncidentResponse)
async def create_incident(
    request: Request,
    category: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    location_accuracy: Optional[float] = Form(None),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Crea un reporte urbano. Requiere JWT. Acepta multipart/form-data.
    Estado inicial siempre 'Pendiente', no configurable por el cliente.
    """
    if category not in _VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Categoría inválida. Opciones: {', '.join(sorted(_VALID_CATEGORIES))}",
        )

    description = description.strip()
    if len(description) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La descripción debe tener al menos 10 caracteres.",
        )
    if len(description) > 250:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La descripción no puede superar los 250 caracteres.",
        )

    validate_coordinates(latitude, longitude)

    if image.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tipo de imagen no permitido. Use JPG, PNG o WebP.",
        )

    contents = await image.read()
    if len(contents) > _MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La imagen supera el tamaño máximo de 10 MB.",
        )

    os.makedirs(_UPLOAD_DIR, exist_ok=True)
    ext = "jpg"
    if image.filename and "." in image.filename:
        ext = image.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(_UPLOAD_DIR, filename), "wb") as f:
        f.write(contents)

    base = str(request.base_url).rstrip("/")
    image_url = f"{base}/static/images/{filename}"

    incident = Incident(
        user_id=current_user.id,
        public_alias=current_user.alias_anonimo,
        category=category,
        description=description,
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        location_accuracy=location_accuracy,
        status="Pendiente",
        validation_count=0,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


# ── GET /public — Lista pública para el mapa ─────────────────────────────────

@router.get("/public", response_model=list[IncidentPublicItem])
def list_public_incidents(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Lista pública de incidentes para el mapa ciudadano.
    Reglas de visibilidad (Sprint 4):
    - Confirmados, En revisión y Resueltos: siempre visibles.
    - Pendientes: visibles solo si tienen <24h O tienen al menos 1 validación.
    No expone email, user_id ni datos privados.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    query = db.query(Incident).filter(
        or_(
            Incident.status != "Pendiente",
            and_(
                Incident.status == "Pendiente",
                or_(
                    Incident.created_at >= cutoff,
                    Incident.validation_count > 0,
                ),
            ),
        )
    )

    if category:
        query = query.filter(Incident.category == category)

    return query.order_by(Incident.created_at.desc()).limit(200).all()


# ── GET /my — Historial privado ──────────────────────────────────────────────

@router.get("/my", response_model=list[IncidentResponse])
def list_my_incidents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Historial privado del usuario autenticado, ordenado por fecha descendente.
    Solo devuelve reportes del usuario cuyo token está en el header.
    """
    return (
        db.query(Incident)
        .filter(Incident.user_id == current_user.id)
        .order_by(Incident.created_at.desc())
        .all()
    )


# ── GET /{incident_id} — Detalle ─────────────────────────────────────────────

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    """Detalle completo de un incidente por ID. Sin datos privados."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incidente no encontrado.",
        )
    return incident
