"""
Router de Administración — QHALI Sprint 6.
Dashboard y gestión administrativa de incidencias.
"""

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
# pyrefly: ignore [missing-import]
from sqlalchemy import func
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
import uuid
import os
import httpx

from app.config import Settings

from app.database import get_db
from app.models.incident_db import Incident
from app.models.user_db import User
from app.schemas.admin import AdminIncidentItem, MetricsResponse, StatusUpdateRequest
from app.utils.auth_utils import get_current_user

router = APIRouter()

_VALID_STATUSES = {"Pendiente", "Confirmado", "En revisión"}


def _require_admin(current_user: User) -> None:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido. Se requiere rol de administrador.",
        )


@router.get(
    "/incidents",
    response_model=list[AdminIncidentItem],
    summary="Lista de incidencias (admin)",
    description="Lista todas las incidencias con filtros opcionales de estado y categoría.",
)
def admin_list_incidents(
    status_filter: str | None = None,
    category: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if category:
        query = query.filter(Incident.category == category)
    return query.order_by(Incident.created_at.desc()).all()


@router.patch(
    "/incidents/{incident_id}/status",
    response_model=AdminIncidentItem,
    summary="Cambiar estado de incidencia (admin)",
    description="Actualiza manualmente el estado de un incidente.",
)
def update_incident_status(
    incident_id: int,
    body: StatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)

    if body.status not in _VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Estado inválido. Opciones: {', '.join(sorted(_VALID_STATUSES))}",
        )

    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incidente no encontrado.",
        )

    incident.status = body.status
    db.commit()
    db.refresh(incident)
    return incident


@router.post(
    "/incidents/{incident_id}/resolve",
    response_model=AdminIncidentItem,
    summary="Resolver incidencia con evidencia (admin)",
    description="Cambia el estado a 'Resuelto' y guarda la foto y comentario de evidencia.",
)
async def resolve_incident(
    incident_id: int,
    image: UploadFile = File(...),
    comment: str = Form(..., min_length=5, max_length=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)

    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incidente no encontrado.",
        )

    if incident.status == "Resuelto":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El incidente ya está resuelto.",
        )

    # ── Upload Image ──
    contents = await image.read()
    ext = "jpg"
    if image.filename and "." in image.filename:
        ext = image.filename.rsplit(".", 1)[-1].lower()
    filename = f"resolution_{uuid.uuid4().hex}.{ext}"

    settings = Settings()
    image_url = ""
    
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            url = f"{settings.SUPABASE_URL}/storage/v1/object/qhali-images/{filename}"
            headers = {
                "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                "apikey": settings.SUPABASE_KEY,
                "Content-Type": image.content_type
            }
            async with httpx.AsyncClient() as client:
                res = await client.post(url, content=contents, headers=headers)
                if res.status_code >= 200 and res.status_code < 300:
                    image_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/qhali-images/{filename}"
                else:
                    raise Exception(f"Supabase error: {res.text}")
        except Exception as e:
            print(f"Failed to upload to Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al subir la imagen de evidencia a Supabase."
            )
    else:
        # Fallback to local
        _UPLOAD_DIR = "uploads"
        os.makedirs(_UPLOAD_DIR, exist_ok=True)
        with open(os.path.join(_UPLOAD_DIR, filename), "wb") as f:
            f.write(contents)
        image_url = f"/static/images/{filename}"

    incident.status = "Resuelto"
    incident.resolution_image_url = image_url
    incident.resolution_comment = comment

    db.commit()
    db.refresh(incident)
    return incident



@router.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Métricas generales del sistema (admin)",
    description="Retorna contadores y estadísticas agregadas de todos los incidentes.",
)
def get_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(current_user)

    total = db.query(func.count(Incident.id)).scalar() or 0
    pendientes = db.query(func.count(Incident.id)).filter(Incident.status == "Pendiente").scalar() or 0
    confirmados = db.query(func.count(Incident.id)).filter(Incident.status == "Confirmado").scalar() or 0
    en_revision = db.query(func.count(Incident.id)).filter(Incident.status == "En revisión").scalar() or 0
    resueltos = db.query(func.count(Incident.id)).filter(Incident.status == "Resuelto").scalar() or 0

    cat_row = (
        db.query(Incident.category, func.count(Incident.id).label("cnt"))
        .group_by(Incident.category)
        .order_by(func.count(Incident.id).desc())
        .first()
    )
    categoria_mas_frecuente = cat_row[0] if cat_row else None

    return MetricsResponse(
        total_reportes=total,
        reportes_pendientes=pendientes,
        reportes_confirmados=confirmados,
        reportes_en_revision=en_revision,
        reportes_resueltos=resueltos,
        categoria_mas_frecuente=categoria_mas_frecuente,
    )
