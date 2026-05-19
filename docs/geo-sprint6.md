# GeoData/IA — Sprint 6: Detección de duplicados

Definido por: Developer GeoData/IA  
Sprint: 6 — Dashboard admin y detección de duplicados

---

## Entregables GeoData en Sprint 6

| Entregable | Estado |
|------------|--------|
| Endpoint `GET /incidents/check-duplicate` con Haversine (50 m) | ✅ |
| Integración en frontend `/report` — advertencia no bloqueante | ✅ |
| Estados activos cubiertos: Pendiente, Confirmado, En revisión | ✅ |
| Documentación de reglas de duplicidad | ✅ este documento |

---

## Función de detección — `check_duplicate` en geo.py

Ya implementada desde Sprint 3 en `backend/app/utils/geo.py`:

```python
from app.utils.geo import check_duplicate

duplicates = check_duplicate(lat, lon, category, incidents, radius_m=50)
# → lista de incidentes posibles duplicados
```

Sprint 6 integra esta lógica directamente en el endpoint `GET /incidents/check-duplicate`,
consultando la base de datos ORM en lugar de recibir una lista externa.

---

## Reglas de duplicidad (Sprint 6)

Un incidente B es duplicado de un nuevo reporte A si se cumplen las 3 condiciones:

```
1. B.category == A.category            → misma categoría exacta
2. haversine(A, B) <= 50 m            → distancia inferior a 50 metros
3. B.status in {"Pendiente",           → estado activo (Resuelto excluido)
                 "Confirmado",
                 "En revisión"}
```

La detección **no bloquea** el envío del nuevo reporte. Es una advertencia informativa
para el ciudadano: puede continuar enviando si considera que es un problema distinto.

---

## Radio de duplicidad

```
DUPLICATE_RADIUS = 50 m   (fijo en backend; no configurable por cliente)
```

Comparación con otros radios del sistema:

| Operación | Radio | Endpoint |
|-----------|-------|----------|
| Nearby (alertas) | 300 m (default) | `GET /incidents/nearby` |
| Validación | 300 m (fijo) | `POST /incidents/{id}/validate` |
| Duplicados | **50 m** (fijo) | `GET /incidents/check-duplicate` |

El radio de 50 m captura incidentes prácticamente en el mismo punto físico
(mismo bache, mismo poste) pero no confunde problemas distintos en la misma cuadra.

---

## Endpoint de detección

```
GET /api/v1/incidents/check-duplicate
Query params: lat, lng, category
Auth: JWT requerido
```

### Respuesta

```json
{
  "has_duplicates": true,
  "duplicates": [
    {
      "id": 7,
      "description": "Bache frente al colegio...",
      "status": "Pendiente",
      "distance_meters": 12.4
    }
  ]
}
```

### Flujo de integración en `/report`

```
1. Ciudadano llega al paso 3 (GPS)
2. GPS se resuelve → lat/lng disponibles
3. Frontend llama GET /check-duplicate?lat=...&lng=...&category=...
4. Si has_duplicates == true → muestra banner de advertencia naranja
5. El botón "Enviar reporte" sigue activo → ciudadano decide
6. Si ciudadano envía → reporte se crea normalmente (no bloqueado)
```

---

## Casos de prueba QA — Duplicados

### Datos de referencia

Incidente existente (de seed_incidents.py):
```
id: 1  category: bache  lat: -12.0651  lng: -75.2049  status: Pendiente
```

### Casos positivos (debe detectar duplicado)

| lat_nuevo | lng_nuevo | category | Distancia | Resultado esperado |
|-----------|-----------|----------|-----------|-------------------|
| -12.0651 | -75.2049 | bache | 0 m | has_duplicates=true |
| -12.0652 | -75.2050 | bache | ~14 m | has_duplicates=true |
| -12.0654 | -75.2052 | bache | ~41 m | has_duplicates=true |

### Casos negativos (no debe detectar duplicado)

| lat_nuevo | lng_nuevo | category | Razón | Resultado esperado |
|-----------|-----------|----------|-------|-------------------|
| -12.0651 | -75.2049 | agua | Diferente categoría | has_duplicates=false |
| -12.0700 | -75.2100 | bache | >50 m (~700 m) | has_duplicates=false |
| -12.0651 | -75.2049 | bache | Status=Resuelto | has_duplicates=false |

### Verificación de la fórmula

```python
from app.utils.geo import haversine_distance

# Caso dentro de 50 m (duplicado)
d1 = haversine_distance(-12.0651, -75.2049, -12.0654, -75.2052)
# → ~41 m ✅ duplicado detectado

# Caso justo en el límite
d2 = haversine_distance(-12.0651, -75.2049, -12.0655, -75.2053)
# → ~55 m ❌ fuera del radio → no es duplicado
```

---

## Dataset de prueba para duplicados

Para probar la detección se puede usar el incidente semilla del seed_incidents.py
(bache en Plaza de Armas de Huancayo: -12.0651, -75.2049).

Pasos de prueba con curl o Swagger:

```bash
# 1. Login como cualquier usuario
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario.a@qhali.demo","password":"demo1234"}'

# 2. Verificar duplicado (mismo punto, misma categoría)
curl "http://localhost:8000/api/v1/incidents/check-duplicate?lat=-12.0651&lng=-75.2049&category=bache" \
  -H "Authorization: Bearer <token>"
# → {"has_duplicates":true,"duplicates":[...]}

# 3. Verificar sin duplicado (diferente categoría)
curl "http://localhost:8000/api/v1/incidents/check-duplicate?lat=-12.0651&lng=-75.2049&category=agua" \
  -H "Authorization: Bearer <token>"
# → {"has_duplicates":false,"duplicates":[]}
```

---

## Observaciones geográficas

### Precisión GPS y radio de 50 m

- GPS urbano típico: ±5–15 m de error.
- Un radio de 50 m tolera el error GPS sin generar falsos negativos.
- Si el error GPS fuera mayor de 50 m (raro en exterior), podría no detectar
  un duplicado exacto — riesgo aceptable para MVP.

### Separación de responsabilidades Sprint 6

```
check-duplicate → advertencia previa al ciudadano (no bloqueante)
validate        → validación ciudadana posterior al reporte (bloqueante si lejos)
admin/status    → corrección manual por administrador
```

Cada capa opera de forma independiente y complementaria.

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `backend/app/utils/geo.py` | `check_duplicate()` y `haversine_distance()` |
| `backend/app/routers/incidents.py` | `GET /incidents/check-duplicate` |
| `backend/app/routers/admin.py` | `GET /admin/metrics`, `PATCH /admin/incidents/{id}/status` |
| `backend/app/schemas/admin.py` | Schemas de admin: AdminIncidentItem, MetricsResponse |
| `backend/app/schemas/incident.py` | DuplicateItem, DuplicateCheckResponse |
| `backend/scripts/seed_admin.py` | Crea/promueve usuario admin para QA |
| `frontend/app/(app)/admin/dashboard/page.tsx` | Dashboard admin completo |
| `frontend/app/(app)/report/page.tsx` | Aviso de duplicado en paso 3 |
| `docs/geo-sprint5.md` | Reglas de validación ciudadana (300 m) |
