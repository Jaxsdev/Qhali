"""
Router de Validaciones — QHALI MVP
Validación ciudadana cruzada de incidencias.
Un ciudadano cercano puede confirmar o negar la existencia de un incidente.
"""

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.post(
    "/",
    summary="Crear validación ciudadana",
    description=(
        "Permite a un ciudadano cercano validar un incidente. "
        "Requiere estar dentro de 300 metros del incidente."
    ),
    status_code=status.HTTP_201_CREATED,
)
async def create_validation():
    """
    Crear validación. Sprint 5: Implementar con verificación de cercanía.
    Regla: usuario distinto + radio ≤ 300m + estado pendiente.
    """
    return {
        "message": "Endpoint de validación ciudadana preparado",
        "rules": {
            "max_distance_meters": 300,
            "incident_status_required": "pendiente",
            "self_validation": False,
        },
        "status": "pendiente_implementacion",
        "sprint": 5,
    }


@router.get(
    "/incident/{incident_id}",
    summary="Listar validaciones de un incidente",
    description="Retorna todas las validaciones ciudadanas de una incidencia.",
)
async def list_validations_by_incident(incident_id: int):
    """Validaciones por incidente. Sprint 5+."""
    return {
        "message": f"Endpoint de validaciones para incidencia {incident_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 5,
    }


@router.get(
    "/user/{user_id}",
    summary="Listar validaciones de un usuario",
    description="Retorna todas las validaciones realizadas por un ciudadano.",
)
async def list_validations_by_user(user_id: int):
    """Validaciones por usuario. Sprint 5+."""
    return {
        "message": f"Endpoint de validaciones del usuario {user_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 5,
    }
