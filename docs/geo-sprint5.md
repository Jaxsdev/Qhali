# GeoData/IA — Sprint 5: Validación ciudadana cercana

Definido por: Developer GeoData/IA  
Sprint: 5 — Validación cruzada y confirmación automática

---

## Entregables GeoData en Sprint 5

| Entregable | Estado |
|------------|--------|
| Función Haversine integrada en endpoint `/nearby` | ✅ |
| Función Haversine integrada en endpoint `/validate` | ✅ |
| Radio operativo confirmado: 300 m | ✅ |
| Dataset de usuarios validadores (Vecino-A a Vecino-F) | ✅ |
| Coordenadas de prueba dentro y fuera de 300 m | ✅ |
| Documentación de reglas geográficas de validación | ✅ este documento |

---

## Función de distancia — Haversine

Ya implementada desde Sprint 3 en `backend/app/utils/geo.py`:

```python
from app.utils.geo import haversine_distance

dist = haversine_distance(lat1, lon1, lat2, lon2)  # → metros
```

Integrada en dos endpoints Sprint 5:

| Endpoint | Uso de Haversine |
|----------|-----------------|
| `GET /incidents/nearby` | Filtra candidatos a `dist <= radius` (default 300 m) |
| `POST /incidents/{id}/validate` | Bloquea con 403 si `dist > 300 m` |

---

## Radio operativo

```
NEARBY_RADIUS_DEFAULT = 300 m
NEARBY_RADIUS_MAX     = 1000 m  (cap de seguridad; no configurable por usuario)
VALIDATE_RADIUS       = 300 m   (fijo en backend; no configurable por cliente)
```

El radio está validado **en el servidor** en ambos endpoints. El frontend no puede
evitar el bloqueo omitiendo coordenadas — el cuerpo del POST validate exige `latitude`
y `longitude` y si la distancia supera 300 m el backend devuelve 403.

---

## Reglas geográficas de validación (Sprint 5)

Un usuario puede validar un incidente **solo si** se cumplen todas estas condiciones:

```
1. incident.status == "Pendiente"          → 409 si no
2. incident.user_id != current_user.id     → 403 si es propio
3. haversine(user, incident) <= 300 m      → 403 si lejos
4. no existe Validation(incident_id, user_id) → 409 si duplicado
```

Si las 4 condiciones se cumplen → se registra la validación y:
```
incident.validation_count += 1
if incident.validation_count >= 5:
    incident.status = "Confirmado"
```

---

## Dataset de prueba — Usuarios demo Sprint 5

Generado por `backend/scripts/seed_sprint5_users.py`.

| Usuario | Email | Alias | Contraseña |
|---------|-------|-------|-----------|
| A (creador) | usuario.a@qhali.demo | Vecino-A | demo1234 |
| B | usuario.b@qhali.demo | Vecino-B | demo1234 |
| C | usuario.c@qhali.demo | Vecino-C | demo1234 |
| D | usuario.d@qhali.demo | Vecino-D | demo1234 |
| E | usuario.e@qhali.demo | Vecino-E | demo1234 |
| F | usuario.f@qhali.demo | Vecino-F | demo1234 |

---

## Coordenadas de prueba

### Punto de referencia: Plaza de Armas de Huancayo
```
lat_incidente = -12.0651
lng_incidente = -75.2049
```

### Usuarios dentro de 300 m (válidos para validar)

Todos a ~0 m del incidente de referencia (en la prueba de demo, el frontend envía
las mismas coords que el incidente para simular cercanía):

| Usuario | Latitud | Longitud | Distancia al incidente |
|---------|---------|----------|----------------------|
| Vecino-B | -12.0651 | -75.2049 | 0 m ✅ |
| Vecino-C | -12.0654 | -75.2052 | ~40 m ✅ |
| Vecino-D | -12.0648 | -75.2046 | ~40 m ✅ |
| Vecino-E | -12.0655 | -75.2044 | ~60 m ✅ |
| Vecino-F | -12.0643 | -75.2058 | ~120 m ✅ |

### Usuario fuera de 300 m (caso negativo QA)

```
lat_lejano = -12.0900   lng_lejano = -75.2300
# distancia al incidente ≈ 3.2 km → 403 bloqueado
```

### Verificación de la fórmula

```python
from app.utils.geo import haversine_distance

# Caso dentro de 300 m
d1 = haversine_distance(-12.0651, -75.2049, -12.0654, -75.2052)
# → ~40 m ✅

# Caso fuera de 300 m
d2 = haversine_distance(-12.0651, -75.2049, -12.0900, -75.2300)
# → ~3200 m ❌ → 403
```

---

## Flujo de prueba QA — 5 validaciones → "Confirmado"

```
1. Vecino-A  → POST /incidents  → crea incidente en (-12.0651, -75.2049)
2. Vecino-A  → POST /incidents/{id}/validate  → 403 "No puedes confirmar tu propio reporte"
3. Vecino-B  → POST /incidents/{id}/validate  → 201 validation_count=1
4. Vecino-B  → POST /incidents/{id}/validate  → 409 "Ya confirmaste este incidente"
5. Vecino-C  → POST /incidents/{id}/validate  → 201 validation_count=2
6. Vecino-D  → POST /incidents/{id}/validate  → 201 validation_count=3
7. Vecino-E  → POST /incidents/{id}/validate  → 201 validation_count=4
8. Vecino-F  → POST /incidents/{id}/validate  → 201 validation_count=5 status="Confirmado"
9. Vecino-B  → GET /incidents/nearby          → incidente ya no aparece (status != "Pendiente")
```

---

## Casos de prueba geográficos

| Caso | lat_usuario | lng_usuario | Resultado esperado |
|------|-------------|-------------|-------------------|
| Dentro del radio | -12.0651 | -75.2049 | 201 — validación registrada |
| Justo en el límite | varía | varía | 201 si dist ≤ 300, 403 si dist > 300 |
| Fuera del radio | -12.0900 | -75.2300 | 403 — "Estás a NNN m…" |
| Coordenadas inválidas (lat>90) | 200.0 | 0.0 | 422 — validación de rango |
| Sin coordenadas en body | — | — | 422 — campo requerido |

---

## Observaciones geográficas

### Precisión del GPS en campo real

- GPS urbano típico: ±5–15 m de error → inofensivo para radio de 300 m.
- En interiores o zonas con edificios altos: ±50–100 m → usuarios legítimos cerca del límite pueden ser bloqueados.
- **Decisión técnica Sprint 5**: se acepta este riesgo; se puede ampliar a 350 m si hay quejas recurrentes.

### Separación de responsabilidades

```
nearby     → filtra por distancia (Haversine) para mostrar lista
validate   → valida distancia (Haversine) al momento de confirmar
```

Ambas verificaciones son **independientes y redundantes** por diseño:
- Un usuario podría estar en /nearby por GPS impreciso y quedar fuera al validar.
- No es un bug — es una capa de seguridad geográfica.

---

## Preparación para Sprint 6 (Duplicados por proximidad)

Las funciones ya listas en `backend/app/utils/geo.py` para Sprint 6:

```python
check_duplicate(lat, lon, category, incidents, radius_m=50)
# → lista de incidentes posibles duplicados (misma cat, dist < 50 m, activos)
```

Datos necesarios para Sprint 6:
- Incidentes pendientes y confirmados con coordenadas: ✅ listos
- Usuarios con validaciones registradas: ✅ tras Sprint 5
- Función de detección de duplicados: ✅ implementada en geo.py

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `backend/app/utils/geo.py` | Haversine, `is_within_validation_range`, `check_duplicate` |
| `backend/app/routers/incidents.py` | `GET /nearby` + `POST /{id}/validate` con Haversine |
| `backend/app/models/validation_db.py` | Tabla `validations` con unique(incident_id, user_id) |
| `backend/scripts/seed_sprint5_users.py` | Usuarios Vecino-A a Vecino-F para QA |
| `docs/geo-rules.md` | Reglas base Haversine y Sprint 5 (definidas Sprint 3) |
| `docs/geo-sprint4.md` | Dataset de incidentes con coords reales de Huancayo |
