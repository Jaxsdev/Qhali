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
from pydantic import BaseModel
import httpx
from app.config import Settings

class RewriteRequest(BaseModel):
    raw_text: str

class RewriteResponse(BaseModel):
    text: str

from app.models.incident_db import Incident, IncidentComment
from app.models.user_db import User
from app.models.validation_db import Validation
from app.schemas.incident import DuplicateCheckResponse, DuplicateItem, IncidentPublicItem, IncidentResponse, CommentCreate, CommentResponse
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
    "señalización", "áreas_verdes", "ruido", "seguridad", "robos", "otro",
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
    address: Optional[str] = Form(None),
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

    # Try uploading to Supabase Storage if configured
    settings = Settings()
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
            # Fallback to local upload
            with open(os.path.join(_UPLOAD_DIR, filename), "wb") as f:
                f.write(contents)
            base = str(request.base_url).rstrip("/")
            image_url = f"{base}/static/images/{filename}"
    else:
        # Local upload
        with open(os.path.join(_UPLOAD_DIR, filename), "wb") as f:
            f.write(contents)
        base = str(request.base_url).rstrip("/")
        image_url = f"{base}/static/images/{filename}"

    # ── Integración de IA con Claude ──
    from app.utils.ai import analyze_incident_text
    ai_res = analyze_incident_text(description)
    
    # Si la IA determina que no es un reporte válido (spam, insulto), se modera automáticamente
    status_inicial = "Pendiente"
    if not ai_res.get("is_valid", True):
        status_inicial = "Moderado"

    incident = Incident(
        user_id=current_user.id,
        public_alias=current_user.alias_anonimo,
        category=category,
        description=description,
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        location_accuracy=location_accuracy,
        address=address,
        status=status_inicial,
        validation_count=0,
        ai_category=ai_res.get("suggested_category"),
        ai_priority=ai_res.get("priority"),
        ai_is_valid=ai_res.get("is_valid"),
        ai_summary=ai_res.get("summary")
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident

# ── POST /rewrite-description — Reescribir descripción con IA ───────────────

@router.post("/rewrite-description", response_model=RewriteResponse)
async def rewrite_description_endpoint(
    req: RewriteRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Recibe un texto crudo transcrito por voz y devuelve una versión
    concisa redactada por la IA. Requiere JWT.
    """
    from app.utils.ai import rewrite_incident_description
    text_rewritten = rewrite_incident_description(req.raw_text)
    return RewriteResponse(text=text_rewritten)

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

@router.get("/ai-summary")
def get_ai_executive_summary(db: Session = Depends(get_db)):
    """
    Retorna un resumen ejecutivo generado por IA basado en los reportes más recientes.
    """
    recent_incidents = db.query(Incident).order_by(Incident.created_at.desc()).limit(20).all()
    incidents_data = []
    for inc in recent_incidents:
        incidents_data.append({
            "category": inc.category,
            "ai_priority": inc.ai_priority,
            "status": inc.status,
            "description": inc.description,
            "created_at": inc.created_at.isoformat() if inc.created_at else ""
        })
    
    from app.utils.ai import generate_executive_summary
    summary_text = generate_executive_summary(incidents_data)
    
    return {"summary": summary_text}


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


# ── DELETE /{incident_id} — Eliminar incidente ───────────────────────────────

@router.delete("/{incident_id}", status_code=status.HTTP_200_OK)
async def delete_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Elimina un incidente. El creador del incidente o un administrador puede eliminarlo.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incidente no encontrado.",
        )

    # Permitir si es el creador o si es administrador
    if incident.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este incidente.",
        )

    # Eliminar registros dependientes primero (validaciones y comentarios) para evitar error de Foreign Key
    db.query(Validation).filter(Validation.incident_id == incident_id).delete(synchronize_session=False)
    db.query(IncidentComment).filter(IncidentComment.incident_id == incident_id).delete(synchronize_session=False)

    db.delete(incident)
    db.commit()
    return {"message": "Incidente eliminado exitosamente."}


# ── POST /chat — Asistente del Ciudadano (IA Chatbot) ───────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


@router.post("/chat", summary="Chat de consulta para el ciudadano")
def chat_asistente(req: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    Asistente del Ciudadano de QHALI usando Claude.
    Responde dudas sobre normas municipales de Huancayo, reglas geográficas del aplicativo
    (como el radio de validación de 300m y duplicados de 50m), e incidencias urbanas.
    """
    from app.utils.ai import ANTHROPIC_API_KEY
    if not ANTHROPIC_API_KEY:
        return {"response": "El asistente no está configurado en este momento."}
        
    system_prompt = f"""
    Eres el "Asistente QHALI", un chatbot de Inteligencia Artificial para la plataforma ciudadana de reporte de Huancayo (QHALI).
    Tu objetivo es guiar amablemente al ciudadano sobre qué cosas puede reportar, cómo usar el aplicativo y las reglas vigentes.

    Reglas clave de QHALI que debes conocer:
    1. Para validar el reporte de otro vecino, el usuario debe estar físicamente a menos de 300 metros de la incidencia (Regla de validación cercana). No puede validar su propio reporte.
    2. El sistema detecta reportes duplicados si son de la misma categoría y están a menos de 50 metros de distancia.
    3. Categorías soportadas: Bache, Alumbrado, Basura, Agua, Alcantarillado, Señalización, Áreas verdes, Ruido, Seguridad, Robos y Otro.
    4. Las incidencias válidas son en la vía pública o espacios públicos. Las incidencias en interiores de casas privadas o de carácter puramente comercial no corresponden a este sistema.

    Responde de forma concisa, clara y en tono servicial/ciudadano en español. Máximo 2-3 párrafos cortos.
    """

    try:
        import httpx
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        # Construir historial de mensajes válidos
        messages = [{"role": msg.role, "content": msg.content} for msg in req.history]
        messages.append({"role": "user", "content": req.message})

        with httpx.Client(timeout=15.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 512,
                    "system": system_prompt,
                    "messages": messages
                }
            )
            if response.status_code == 200:
                res_data = response.json()
                return {"response": res_data["content"][0]["text"].strip()}
            elif response.status_code == 404:
                # The API key is valid but the account has no access to the model
                return {"response": "¡Hola! Veo que pudimos conectar con tu API Key, pero tu cuenta de Anthropic actual no tiene permisos o saldo para usar los modelos de Claude 3. (Error 404). \n\nPero no te preocupes, como demostración simulada te puedo responder que: en QHALI, las validaciones de otros ciudadanos se permiten en un radio máximo de 300 metros de la incidencia reportada."}
            else:
                print(f"API Error ({response.status_code}): {response.text}")
                return {"response": f"Lo siento, tuve un problema de conexión al procesar tu consulta. (Error {response.status_code})"}
    except Exception as e:
        print(f"Error in chat assistant: {e}")
        
    return {"response": "Lo siento, tuve un problema de conexión al procesar tu consulta. Por favor, intenta en unos momentos."}


# ── POST /suggest-category — Sugerencia automática de categorías (IA) ────────

class SuggestCategoryRequest(BaseModel):
    description: str


@router.post("/suggest-category")
def suggest_category(req: SuggestCategoryRequest, _current_user: User = Depends(get_current_user)):
    """
    Analiza una descripción textual del problema y devuelve la categoría sugerida por la IA.
    """
    from app.utils.ai import analyze_incident_text
    res = analyze_incident_text(req.description)
    return {"suggested_category": res.get("suggested_category", "otro")}
# ── POST /{incident_id}/comments — Comentar incidente ───────────────────────

@router.post("/{incident_id}/comments", response_model=CommentResponse)
def create_comment(
    incident_id: int,
    comment: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incidente no encontrado.")

    # Validar distancia
    dist = haversine_distance(
        comment.latitude, comment.longitude,
        incident.latitude, incident.longitude
    )
    if dist > _NEARBY_RADIUS_MAX:
        raise HTTPException(
            status_code=403, 
            detail=f"Estás a {int(dist)}m. Debes estar a menos de {int(_NEARBY_RADIUS_MAX)}m del incidente para participar en el foro."
        )

    new_comment = IncidentComment(
        incident_id=incident_id,
        user_id=current_user.id,
        public_alias=current_user.alias_anonimo,
        content=comment.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


# ── GET /{incident_id}/comments — Listar comentarios ───────────────────────

from typing import List

@router.get("/{incident_id}/comments", response_model=List[CommentResponse])
def get_comments(
    incident_id: int,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incidente no encontrado.")

    comments = db.query(IncidentComment)\
                 .filter(IncidentComment.incident_id == incident_id)\
                 .order_by(IncidentComment.created_at.asc())\
                 .all()
    return comments
