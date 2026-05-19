"""
Utilidades Geográficas — QHALI MVP
Funciones de cálculo de distancia y búsqueda geográfica.
Implementa la fórmula de Haversine para el MVP (sin PostGIS).
"""

import math
from typing import Optional


# ── Radio de la Tierra en metros ──
EARTH_RADIUS_METERS = 6_371_000


def haversine_distance(
    lat1: float, lon1: float,
    lat2: float, lon2: float,
) -> float:
    """
    Calcula la distancia en metros entre dos coordenadas GPS
    usando la fórmula de Haversine.

    Args:
        lat1: Latitud del punto 1 (grados decimales)
        lon1: Longitud del punto 1 (grados decimales)
        lat2: Latitud del punto 2 (grados decimales)
        lon2: Longitud del punto 2 (grados decimales)

    Returns:
        Distancia en metros entre los dos puntos.

    Example:
        >>> # Plaza de Armas de Huancayo a Real Plaza Huancayo
        >>> dist = haversine_distance(-12.0651, -75.2049, -12.0730, -75.2090)
        >>> print(f"{dist:.0f} metros")  # ~970 metros
    """
    # Convertir a radianes
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    # Fórmula de Haversine
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_METERS * c


def find_nearby_incidents(
    lat: float,
    lon: float,
    incidents: list[dict],
    radius_m: float = 300.0,
) -> list[dict]:
    """
    Busca incidentes dentro de un radio dado desde una coordenada.

    Args:
        lat: Latitud del punto de búsqueda
        lon: Longitud del punto de búsqueda
        incidents: Lista de incidentes (cada uno con 'latitude' y 'longitude')
        radius_m: Radio de búsqueda en metros (default: 300m)

    Returns:
        Lista de incidentes dentro del radio, con distancia calculada.
    """
    nearby = []
    for incident in incidents:
        distance = haversine_distance(
            lat, lon,
            incident["latitude"], incident["longitude"],
        )
        if distance <= radius_m:
            nearby.append({
                **incident,
                "distance_meters": round(distance, 2),
            })

    # Ordenar por distancia (más cercano primero)
    nearby.sort(key=lambda x: x["distance_meters"])
    return nearby


def check_duplicate(
    lat: float,
    lon: float,
    category: str,
    incidents: list[dict],
    radius_m: float = 50.0,
) -> list[dict]:
    """
    Verifica si existe un incidente duplicado:
    misma categoría + distancia < 50 metros + estado activo.

    Args:
        lat: Latitud del nuevo incidente
        lon: Longitud del nuevo incidente
        category: Categoría del nuevo incidente
        incidents: Lista de incidentes existentes
        radius_m: Radio de duplicidad en metros (default: 50m)

    Returns:
        Lista de posibles duplicados encontrados.
    """
    duplicates = []
    active_statuses = {"pendiente", "confirmado"}

    for incident in incidents:
        # Solo comparar misma categoría y estados activos
        if (
            incident.get("category") == category
            and incident.get("status", "pendiente") in active_statuses
        ):
            distance = haversine_distance(
                lat, lon,
                incident["latitude"], incident["longitude"],
            )
            if distance <= radius_m:
                duplicates.append({
                    **incident,
                    "distance_meters": round(distance, 2),
                })

    return duplicates


def is_within_validation_range(
    validator_lat: float,
    validator_lon: float,
    incident_lat: float,
    incident_lon: float,
    max_distance_m: float = 300.0,
) -> tuple[bool, float]:
    """
    Verifica si un validador está dentro del rango permitido
    para validar un incidente.

    Args:
        validator_lat: Latitud del validador
        validator_lon: Longitud del validador
        incident_lat: Latitud del incidente
        incident_lon: Longitud del incidente
        max_distance_m: Distancia máxima permitida (default: 300m)

    Returns:
        Tupla (está_en_rango, distancia_en_metros)
    """
    distance = haversine_distance(
        validator_lat, validator_lon,
        incident_lat, incident_lon,
    )
    return distance <= max_distance_m, round(distance, 2)
