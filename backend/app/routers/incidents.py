"""
Router de Incidencias — QHALI MVP
CRUD de reportes ciudadanos con geolocalización.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Optional

router = APIRouter()


@router.get(
    "/",
    summary="Listar incidencias",
    description="Retorna lista de incidencias con filtros opcionales por categoría, estado y ubicación.",
)
async def list_incidents(
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_m: Optional[float] = 300.0,
):
    """
    Listar incidencias. Sprint 3: Implementar con BD y filtros geo.
    """
    return {
        "message": "Endpoint de listado de incidencias preparado",
        "filters": {
            "category": category,
            "status": status_filter,
            "location": {"lat": latitude, "lng": longitude, "radius": radius_m},
        },
        "status": "pendiente_implementacion",
        "sprint": 3,
    }


@router.post(
    "/",
    summary="Crear incidencia",
    description="Crea un nuevo reporte ciudadano con foto, GPS, categoría y descripción.",
    status_code=status.HTTP_201_CREATED,
)
async def create_incident():
    """
    Crear incidencia. Sprint 3: Implementar con foto, GPS y validación.
    """
    return {
        "message": "Endpoint de creación de incidencia preparado",
        "status": "pendiente_implementacion",
        "sprint": 3,
    }


@router.get(
    "/{incident_id}",
    summary="Obtener incidencia por ID",
    description="Retorna detalle completo de una incidencia incluyendo validaciones.",
)
async def get_incident(incident_id: int):
    """Detalle de incidencia. Sprint 3+."""
    return {
        "message": f"Endpoint de incidencia {incident_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 3,
    }


@router.put(
    "/{incident_id}/status",
    summary="Actualizar estado de incidencia",
    description="Cambia el estado de una incidencia (pendiente → confirmado → en revisión → resuelto).",
)
async def update_incident_status(incident_id: int):
    """Actualizar estado. Sprint 3+."""
    return {
        "message": f"Endpoint de actualización de estado de incidencia {incident_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 3,
    }


@router.get(
    "/nearby",
    summary="Obtener incidencias cercanas",
    description="Retorna incidencias dentro de un radio dado desde una coordenada.",
)
async def get_nearby_incidents(
    latitude: float,
    longitude: float,
    radius_m: float = 300.0,
):
    """
    Incidencias cercanas. Sprint 4: Implementar con fórmula Haversine.
    """
    return {
        "message": "Endpoint de incidencias cercanas preparado",
        "location": {"lat": latitude, "lng": longitude, "radius": radius_m},
        "status": "pendiente_implementacion",
        "sprint": 4,
    }


@router.get(
    "/{incident_id}/duplicates",
    summary="Verificar posibles duplicados",
    description="Busca incidencias similares en la misma categoría dentro de 50 metros.",
)
async def check_duplicates(incident_id: int):
    """
    Detección de duplicados. Sprint 6: Implementar con regla de duplicidad.
    """
    return {
        "message": f"Endpoint de duplicados para incidencia {incident_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 6,
    }
