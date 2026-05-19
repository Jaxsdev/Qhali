"""
Validación geográfica de coordenadas GPS — QHALI Sprint 3.

Reglas definidas por el rol GeoData/IA:
  - Latitud:  -90.0  a  90.0  (WGS84)
  - Longitud: -180.0 a 180.0  (WGS84)
  - Coordenadas None/nulas son rechazadas.

Huancayo, Junín (referencia para pruebas):
  Latitud  aprox: -12.0651
  Longitud aprox: -75.2049
"""

from fastapi import HTTPException, status


def validate_latitude(lat: float) -> None:
    """Rechaza latitudes fuera del rango -90 a 90."""
    if lat < -90.0 or lat > 90.0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Latitud inválida: {lat}. Debe estar entre -90 y 90.",
        )


def validate_longitude(lon: float) -> None:
    """Rechaza longitudes fuera del rango -180 a 180."""
    if lon < -180.0 or lon > 180.0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Longitud inválida: {lon}. Debe estar entre -180 y 180.",
        )


def validate_coordinates(lat: float, lon: float) -> None:
    """Valida latitud y longitud en una sola llamada."""
    validate_latitude(lat)
    validate_longitude(lon)


def is_within_huancayo_approx(lat: float, lon: float, margin_deg: float = 0.5) -> bool:
    """
    Verifica si las coordenadas están dentro del área aproximada de
    Huancayo, Junín (para pruebas y advertencias opcionales).
    No bloquea el envío — solo sirve como indicador de calidad.
    """
    center_lat, center_lon = -12.0651, -75.2049
    return (
        abs(lat - center_lat) <= margin_deg
        and abs(lon - center_lon) <= margin_deg
    )
