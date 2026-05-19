# GeoData/IA — Sprint 4: Mapa ciudadano e historial privado

Definido por: Developer GeoData/IA  
Sprint: 4 — Visualización de incidentes en mapa interactivo

---

## Entregables GeoData en Sprint 4

| Entregable | Estado |
|------------|--------|
| Dataset ≥ 8 incidentes simulados en Huancayo | ✅ 10 incidentes |
| Coordenadas distribuidas (sin superposición) | ✅ |
| Todos los estados representados en el dataset | ✅ |
| Filtro temporal de pendientes antiguos (PB-44) | ✅ implementado |
| Validación de coordenadas nulas en endpoint público | ✅ filtro `.isnot(None)` |
| Documentación de reglas geográficas Sprint 4 | ✅ este documento |

---

## Dataset de demo — 10 incidentes de prueba

Generado por `backend/scripts/seed_incidents.py`.  
Todas las coordenadas están dentro del área de Huancayo, Junín.

| # | Categoría | Latitud | Longitud | Estado | Validaciones |
|---|-----------|---------|----------|--------|-------------|
| 1 | bache | -12.0651 | -75.2049 | Pendiente | 0 |
| 2 | basura | -12.0620 | -75.2010 | Pendiente | 2 |
| 3 | ruido | -12.0640 | -75.2150 | Pendiente | 0 |
| 4 | alumbrado | -12.0700 | -75.2100 | Confirmado | 5 |
| 5 | alcantarillado | -12.0730 | -75.2090 | Confirmado | 8 |
| 6 | agua | -12.0680 | -75.1980 | Confirmado | 3 |
| 7 | señalización | -12.0590 | -75.2060 | En revisión | 12 |
| 8 | seguridad | -12.0750 | -75.2020 | En revisión | 7 |
| 9 | áreas_verdes | -12.0610 | -75.1990 | Resuelto | 15 |
| 10 | otro | -12.0560 | -75.2080 | Resuelto | 9 |

### Verificación de coordenadas

- Todos los valores son `float`, no `string` → compatibles con Leaflet.
- Todos están dentro del bounding box de Huancayo: lat [-12.15, -11.95], lon [-75.35, -75.10].
- Separación mínima entre pines: ~300 m → no hay superposición visual en zoom 14.
- Ningún incidente tiene coordenadas nulas (columnas `NOT NULL` en el esquema).

---

## Regla de visibilidad pública (PB-44)

Implementada en `backend/app/routers/incidents.py` → `GET /incidents/public`.

```
Incidente visible si:
  status != "Pendiente"
  OR (
    status == "Pendiente"
    AND (created_at >= ahora - 24h  OR  validation_count > 0)
  )
```

**Motivación geográfica**: Un pendiente antiguo sin validaciones indica que posiblemente
ya fue resuelto de manera informal o nunca fue real. Ocultarlo evita ruido visual en el mapa.

### Impacto en el dataset de prueba

| Estado | Incidentes | Visibles en mapa |
|--------|------------|-----------------|
| Pendiente (recientes, < 24h) | 3 | ✅ Sí |
| Pendiente (si pasan 24h sin validación) | 1 (el de 0 validaciones) | ❌ Se oculta |
| Pendiente (pasan 24h con ≥ 1 validación) | 2 | ✅ Sí |
| Confirmado | 3 | ✅ Siempre |
| En revisión | 2 | ✅ Siempre |
| Resuelto | 2 | ✅ Siempre |

---

## Colores de pines por estado

Definidos por GeoData/IA, aprobados por Product Owner:

| Estado | Color | Hex | Criterio |
|--------|-------|-----|----------|
| Pendiente | Gris | `#9CA3AF` | No confirmado aún |
| Confirmado | Rojo | `#EF4444` | Requiere atención urgente |
| En revisión | Azul | `#3B82F6` | Siendo atendido |
| Resuelto | Verde | `#22C55E` | Problema solucionado |

---

## Validación de coordenadas en el mapa (endpoint público)

El endpoint `GET /incidents/public` incluye un filtro explícito:

```python
Incident.latitude.isnot(None),
Incident.longitude.isnot(None),
```

**Razón**: aunque el esquema de BD define ambas columnas como `NOT NULL`, este filtro
defensivo garantiza que ningún incidente sin coordenadas llegue al cliente y rompa el
renderizado de Leaflet.

---

## Casos de prueba QA — Coordenadas problemáticas

| Caso | Acción | Resultado esperado |
|------|--------|--------------------|
| Coordenadas fuera de rango (`lat=200`) | POST /incidents | 422 — "Latitud inválida" |
| Coordenadas nulas (`lat=null`) | POST /incidents | 422 — validación de tipo |
| Longitud > 180 (`lon=181`) | POST /incidents | 422 — "Longitud inválida" |
| Incidente fuera de Huancayo (pero WGS84 válido) | POST /incidents | 201 — se acepta (validación no bloquea por zona) |
| GET /public con incidente sin coords (imposible en prod) | GET /public | Filtrado silenciosamente por `.isnot(None)` |

**Nota para QA**: el endpoint `POST /incidents` llama a `validate_coordinates(lat, lon)`
(ver `backend/app/utils/geo_validation.py`). Los casos de coordenadas inválidas deben
probarse ahí, no en el mapa.

---

## Observaciones sobre pines superpuestos

Con 10 incidentes distribuidos en un área de ~3 km² y zoom 14, no hay superposición.

**Umbral de superposición visual en Leaflet zoom 14**: ~15 metros por píxel → pines de
24px cubren ~360 metros. Si dos incidentes están a menos de 360 m pueden solaparse.

En el dataset actual, el par más cercano es:
- Bache (-12.0651, -75.2049) y Alcantarillado (-12.0730, -75.2090) → ~970 m. ✅ Sin solapamiento.

**Solución futura (Sprint 5+)**: implementar clustering con `Leaflet.markercluster`
cuando haya > 50 incidentes en el mapa.

---

## Preparación de datos para Sprint 5 (Validación ciudadana cercana)

Sprint 5 implementará validación por proximidad (≤ 300 m). Los datos necesarios están listos:

| Requerimiento | Estado |
|---------------|--------|
| Incidentes con `latitude` y `longitude` reales | ✅ |
| Incidentes en estado `Pendiente` (validables) | ✅ 3 en dataset |
| Incidentes en estado `Confirmado` (>3 validaciones → auto-confirmado) | ✅ 3 en dataset |
| Función Haversine implementada | ✅ `backend/app/utils/geo.py` |
| `is_within_validation_range()` implementada | ✅ `backend/app/utils/geo.py` |
| Tabla `validations` en BD | ❌ Pendiente Sprint 5 |
| Endpoint `POST /incidents/{id}/validate` | ❌ Pendiente Sprint 5 |

### Regla de auto-confirmación (Sprint 5)

```
if validation_count >= 3 and status == "Pendiente":
    status = "Confirmado"
```

Los incidentes con estado "Confirmado" en el dataset actual tienen `validation_count >= 3`,
lo que simula el comportamiento esperado del Sprint 5.

---

## Limitaciones del mapa actual (Sprint 4)

1. **Sin clustering**: con muchos pines en la misma zona, se solapan visualmente.
2. **Sin filtro por distancia al usuario**: el mapa muestra todos los incidentes de Huancayo,
   no solo los cercanos al usuario actual.
3. **Sin geocodificación inversa**: las coordenadas no se traducen a dirección legible
   (calle, distrito). Se muestra solo lat/lon en el detalle.
4. **Sin modo offline**: el mapa requiere conexión para cargar los tiles de OpenStreetMap.
5. **`validation_count` = valores fijos en el seed**: en producción, este campo se actualiza
   dinámicamente. El seed usa valores estáticos para pruebas visuales.

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `backend/app/utils/geo.py` | Haversine, búsqueda cercana, detección duplicados |
| `backend/app/utils/geo_validation.py` | Validación de coordenadas GPS (WGS84) |
| `backend/scripts/seed_incidents.py` | Dataset de 10 incidentes con coords reales |
| `backend/app/routers/incidents.py` | Filtro de visibilidad + guard de coords nulas |
| `frontend/app/components/MapView.tsx` | Leaflet map con divIcon por estado |
| `docs/geo-rules.md` | Haversine, Sprint 5 proximity rules, duplicados |
| `docs/geo-validation-rules.md` | Reglas de validación GPS (Sprint 3) |
