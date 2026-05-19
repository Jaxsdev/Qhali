# Reglas de Validación Geográfica — QHALI Sprint 3

Definido por: Developer GeoData/IA  
Sprint: 3 — Emisión de reporte urbano

---

## Reglas de coordenadas GPS (WGS84)

| Campo | Tipo | Rango válido | Obligatorio |
|-------|------|-------------|-------------|
| `latitude` | `float` | -90.0 a 90.0 | Sí |
| `longitude` | `float` | -180.0 a 180.0 | Sí |
| `location_accuracy` | `float` | ≥ 0 (metros) | No (opcional) |

Las coordenadas `null` o ausentes son **rechazadas** por el endpoint `POST /incidents`.

---

## Implementación

Archivo: `backend/app/utils/geo_validation.py`

```python
validate_coordinates(latitude, longitude)
# Lanza HTTPException 422 si alguno está fuera de rango.
```

El backend llama a `validate_coordinates` antes de guardar cualquier reporte.

---

## Coordenadas de referencia — Huancayo, Junín

| Lugar | Latitud | Longitud |
|-------|---------|----------|
| Plaza de Armas de Huancayo | -12.0651 | -75.2049 |
| Real Plaza Huancayo | -12.0730 | -75.2090 |
| Mercado Mayorista | -12.0620 | -75.2010 |
| Hospital El Carmen | -12.0680 | -75.1980 |
| Parque de la Identidad Wanka | -12.0590 | -75.2060 |

Área aproximada de la provincia: latitud [-12.15, -11.95], longitud [-75.35, -75.10]

---

## Ejemplos de coordenadas válidas

```json
{ "latitude": -12.0651, "longitude": -75.2049 }   // Plaza de Armas Huancayo
{ "latitude": -12.0700, "longitude": -75.2100 }   // Centro de Huancayo
{ "latitude":  -0.0000, "longitude":   0.0000 }   // Ecuador / Greenwich (válido)
{ "latitude":  90.0000, "longitude": 180.0000 }   // Polo Norte / meridiano (límite válido)
{ "latitude": -90.0000, "longitude":-180.0000 }   // Polo Sur / antimeridiano (límite válido)
```

## Ejemplos de coordenadas inválidas (rechazadas)

```json
{ "latitude":  91.0, "longitude":   0.0  }   // Latitud fuera de rango
{ "latitude": -91.0, "longitude":   0.0  }   // Latitud negativa fuera de rango
{ "latitude":   0.0, "longitude": 181.0  }   // Longitud fuera de rango
{ "latitude":   0.0, "longitude":-181.0  }   // Longitud negativa fuera de rango
{ "latitude":  null, "longitude":   null }   // Nulas — rechazadas por validación de tipo
```

---

## Precisión mínima recomendada

Para que el reporte sea útil en el mapa (Sprint 4), se recomienda:

- `location_accuracy` ≤ 50 metros (precisión GPS normal en ciudad)
- `location_accuracy` ≤ 100 metros (precisión aceptable con señal débil)
- `location_accuracy` > 200 metros: el reporte se acepta pero puede tener posición imprecisa

El campo `location_accuracy` es **opcional** en Sprint 3. El sistema lo almacena para uso futuro.

---

## Datos de prueba — dataset Huancayo (Sprint 4)

El script `backend/scripts/seed_incidents.py` genera 8 incidentes simulados con coordenadas reales de Huancayo para pruebas del mapa en Sprint 4.

```bash
python backend/scripts/seed_incidents.py
```

---

## Limitaciones conocidas en móvil

- `navigator.geolocation` en Android puede tardar 3–8 segundos en obtener posición.
- En interiores o zonas con edificios altos, la precisión baja a 50–200 metros.
- iOS requiere HTTPS para acceder a `geolocation` en producción (no aplica en localhost).
- Si el usuario deniega el permiso, el sistema muestra error y bloquea el envío del reporte.
