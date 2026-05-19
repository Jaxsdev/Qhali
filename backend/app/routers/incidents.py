"""
Router de Incidencias — QHALI Sprint 3 / 4 / 5.
POST /                   — crear reporte (protegido, multipart/form-data).
GET  /public             — lista pública para el mapa ciudadano.
GET  /my                 — historial privado del usuario autenticado.
GET  /nearby             — incidentes pendientes cercanos para validar (Sprint 5).
GET  /{incident_id}      — detalle de un incidente.
POST /{incident_id}/validate — validar incidente cercano (Sprint 5).
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
from sqlalchemy.exc import IntegrityError
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.incident_db import Incident
from app.models.user_db import User
from app.schemas.incident import DuplicateCheckResponse, DuplicateItem, IncidentPublicItem, IncidentResponse
from app.schemas.validation import NearbyIncidentItem, ValidateRequest, ValidateResponse
from app.utils.auth_utils import get_current_user
from app.utils.geo import haversine_distance
from app.utils.geo_validation import validate_coordinates

router = APIRouter()

_UPLOAD_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "images")
)
_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
_NEARBY_RADIUS_MAX = 1000.0          # cap para evitar queries excesivos

_VALID_CATEGORIES = {
    "bache", "alumbrado", "basura", "agua", "alcantarillado",
    "señalización", "áreas_verdes", "ruido", "seguridad", "otro",
}

_VALIDATION_THRESHOLD = 5  # validaciones para cambiar a "Confirmado"


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
        Incident.latitude.isnot(None),
        Incident.longitude.isnot(None),
        or_(
            Incident.status != "Pendiente",
            and_(
                Incident.status == "Pendiente",
                or_(
                    Incident.created_at >= cutoff,
                    Incident.validation_count > 0,
                ),
            ),
        ),
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


# ── GET /nearby — Incidentes cercanos para validar (Sprint 5) ────────────────

@router.get("/nearby", response_model=list[NearbyIncidentItem])
def list_nearby_incidents(
    lat: float,
    lng: float,
    radius: float = 300.0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Devuelve incidentes pendientes dentro del radio (default 300 m), excluyendo
    los reportes del propio usuario. Incluye distancia calculada con Haversine.
    Solo accesible con JWT.
    """
    if radius > _NEARBY_RADIUS_MAX:
        radius = _NEARBY_RADIUS_MAX

    candidates = db.query(Incident).filter(
        Incident.status == "Pendiente",
        Incident.user_id != current_user.id,
        Incident.latitude.isnot(None),
        Incident.longitude.isnot(None),
    ).all()

    result: list[NearbyIncidentItem] = []
    for inc in candidates:
        dist = haversine_distance(lat, lng, inc.latitude, inc.longitude)
        if dist <= radius:
            result.append(NearbyIncidentItem(
                id=inc.id,
                public_alias=inc.public_alias,
                category=inc.category,
                description=inc.description,
                image_url=inc.image_url,
                latitude=inc.latitude,
                longitude=inc.longitude,
                status=inc.status,
                validation_count=inc.validation_count,
                created_at=inc.created_at,
                distance_meters=round(dist, 1),
            ))

    result.sort(key=lambda x: x.distance_meters)
    return result


# ── GET /check-duplicate — Detección de duplicados cercanos (Sprint 6) ──────

@router.get("/check-duplicate", response_model=DuplicateCheckResponse)
def check_duplicate_incident(
    lat: float,
    lng: float,
    category: str,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verifica si existen incidentes similares a menos de 50 m del punto dado.
    Mismo criterio: misma categoría + estado activo (Pendiente, Confirmado, En revisión).
    No bloquea el envío; sirve como advertencia previa al ciudadano.
    """
    _ACTIVE_STATUSES = ["Pendiente", "Confirmado", "En revisión"]
    candidates = db.query(Incident).filter(
        Incident.category == category,
        Incident.status.in_(_ACTIVE_STATUSES),
        Incident.latitude.isnot(None),
        Incident.longitude.isnot(None),
    ).all()

    duplicates: list[DuplicateItem] = []
    for inc in candidates:
        dist = haversine_distance(lat, lng, inc.latitude, inc.longitude)
        if dist <= 50.0:
            duplicates.append(DuplicateItem(
                id=inc.id,
                description=inc.description,
                status=inc.status,
                distance_meters=round(dist, 1),
            ))

    duplicates.sort(key=lambda x: x.distance_meters)
    return DuplicateCheckResponse(has_duplicates=len(duplicates) > 0, duplicates=duplicates)


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


# ── POST /{incident_id}/validate — Validar incidente (Sprint 5) ──────────────

@router.post("/{incident_id}/validate", response_model=ValidateResponse, status_code=status.HTTP_201_CREATED)
def validate_incident(
    incident_id: int,
    body: ValidateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registra la validación ciudadana de un incidente cercano.
    Reglas (Sprint 5):
    1. El incidente debe estar en estado 'Pendiente'.
    2. El usuario no puede validar su propio reporte.
    3. El usuario debe estar dentro del radio de 300 m.
    4. Cada usuario solo puede validar una vez el mismo incidente.
    5. Al llegar a 5 validaciones el incidente pasa a 'Confirmado'.
    """
    from app.models.validation_db import Validation

    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incidente no encontrado.",
        )

    if incident.status != "Pendiente":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Este incidente ya está '{incident.status}' y no puede recibir más validaciones.",
        )

    if incident.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes confirmar tu propio reporte.",
        )

    dist = haversine_distance(body.latitude, body.longitude, incident.latitude, incident.longitude)
    if dist > 300.0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Estás a {dist:.0f} m del incidente. Debes estar a menos de 300 m para validar.",
        )

    existing = db.query(Validation).filter(
        Validation.incident_id == incident_id,
        Validation.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya confirmaste este incidente.",
        )

    try:
        val = Validation(incident_id=incident_id, user_id=current_user.id)
        db.add(val)
        db.flush()  # obtener val.id antes del commit

        incident.validation_count = (incident.validation_count or 0) + 1
        if incident.validation_count >= _VALIDATION_THRESHOLD:
            incident.status = "Confirmado"

        db.commit()
        db.refresh(val)
        db.refresh(incident)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya confirmaste este incidente.",
        )

    msg = (
        "¡Incidente confirmado por la comunidad! Estado actualizado a 'Confirmado'."
        if incident.status == "Confirmado"
        else "Validación registrada correctamente."
    )

    return ValidateResponse(
        validation_id=val.id,
        incident_id=incident.id,
        validation_count=incident.validation_count,
        status=incident.status,
        message=msg,
    )
