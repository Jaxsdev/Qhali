"""
Router de Administración — QHALI MVP
Dashboard y gestión administrativa de incidencias.
"""

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.get(
    "/dashboard",
    summary="Dashboard de gestión",
    description="Retorna estadísticas generales del sistema para el dashboard administrativo.",
)
async def get_dashboard():
    """
    Dashboard admin. Sprint 6: Implementar con datos reales.
    """
    return {
        "message": "Endpoint de dashboard preparado",
        "preview": {
            "total_incidents": 0,
            "pending": 0,
            "confirmed": 0,
            "in_review": 0,
            "resolved": 0,
            "total_users": 0,
            "total_validations": 0,
        },
        "status": "pendiente_implementacion",
        "sprint": 6,
    }


@router.get(
    "/incidents",
    summary="Gestión de incidencias (admin)",
    description="Lista todas las incidencias con filtros avanzados para gestión.",
)
async def admin_list_incidents():
    """Lista admin de incidencias. Sprint 6+."""
    return {
        "message": "Endpoint de gestión de incidencias preparado",
        "status": "pendiente_implementacion",
        "sprint": 6,
    }


@router.put(
    "/incidents/{incident_id}/review",
    summary="Revisar incidencia",
    description="Marca una incidencia para revisión administrativa.",
)
async def review_incident(incident_id: int):
    """Revisión de incidencia. Sprint 6+."""
    return {
        "message": f"Endpoint de revisión de incidencia {incident_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 6,
    }


@router.get(
    "/users",
    summary="Gestión de usuarios (admin)",
    description="Lista todos los usuarios registrados con estadísticas.",
)
async def admin_list_users():
    """Lista admin de usuarios. Sprint 6+."""
    return {
        "message": "Endpoint de gestión de usuarios preparado",
        "status": "pendiente_implementacion",
        "sprint": 6,
    }
