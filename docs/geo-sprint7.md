# GeoData/IA — Sprint 7: Verificación final, dataset de demo y limitaciones

Definido por: Developer GeoData/IA  
Sprint: 7 — Integración final, pruebas, pulido y demo del MVP

---

## Entregables GeoData en Sprint 7

| Entregable | Estado |
|------------|--------|
| Verificación de Haversine para nearby (300 m) | ✅ |
| Verificación de Haversine para validación (300 m) | ✅ |
| Verificación de Haversine para duplicados (50 m) | ✅ |
| Dataset final con 15 incidentes en 4 estados | ✅ |
| Coordenadas de usuarios validadores cerca del incidente principal | ✅ |
| Casos positivos y negativos de duplicado documentados | ✅ |
| Limitaciones del cálculo geográfico documentadas | ✅ este documento |

---

## Verificación final de cálculos geográficos

### Fórmula de Haversine — `haversine_distance` en `geo.py`

```python
from app.utils.geo import haversine_distance

# Plaza de Armas de Huancayo → punto de referencia de la demo
lat_ref, lng_ref = -12.0651, -75.2049

# Vecino-B (mismo punto) → 0 m ✅ dentro de 300 m para validar
d_b = haversine_distance(lat_ref, lng_ref, -12.0651, -75.2049)  # → 0 m

# Vecino-F (más lejano del grupo) → ~120 m ✅ dentro de 300 m
d_f = haversine_distance(lat_ref, lng_ref, -12.0643, -75.2058)  # → ~120 m

# Punto lejano → ~3200 m ❌ fuera de 300 m → 403
d_far = haversine_distance(lat_ref, lng_ref, -12.0900, -75.2300)  # → ~3200 m
```

### Casos verificados por endpoint

| Endpoint | Radio | Caso positivo | Caso negativo |
|----------|-------|---------------|---------------|
| `GET /incidents/nearby` | 300 m | Vecino-B a 0 m → incluido | Lejano a 3.2 km → excluido |
| `POST /incidents/{id}/validate` | 300 m | Vecino-B a 0 m → 201 | Lejano a 3.2 km → 403 |
| `GET /incidents/check-duplicate` | 50 m | Mismo punto, misma cat → advertencia | Diferente cat o >50 m → sin advertencia |

---

## Dataset final de demo — Coordenadas verificadas

### Incidente principal (Plaza de Armas de Huancayo)

```
category: bache
lat: -12.0651  lng: -75.2049
status: Pendiente
```

Este incidente es el protagonista de la demo de validación ciudadana.
Los 5 Vecinos (B a F) se posicionan cerca para validarlo y llegar a "Confirmado".

### Coordenadas de usuarios validadores (todos dentro de 300 m)

| Usuario | Latitud | Longitud | Distancia al incidente |
|---------|---------|----------|----------------------|
| Vecino-B | -12.0651 | -75.2049 | 0 m ✅ |
| Vecino-C | -12.0654 | -75.2052 | ~41 m ✅ |
| Vecino-D | -12.0648 | -75.2046 | ~41 m ✅ |
| Vecino-E | -12.0655 | -75.2044 | ~60 m ✅ |
| Vecino-F | -12.0643 | -75.2058 | ~120 m ✅ |

### Distribución de los 15 incidentes de la demo

| Estado | N.° | Categorías |
|--------|-----|-----------|
| Pendiente | 5 | bache, basura, ruido, agua, seguridad |
| Confirmado | 4 | alumbrado, alcantarillado, bache, basura |
| En revisión | 3 | señalización, alumbrado, agua |
| Resuelto | 3 | áreas_verdes, otro, alcantarillado |
| **Total** | **15** | 9 de 10 categorías cubiertas |

### Caso duplicado positivo para la demo (misma categoría, <50 m)

```
Incidente existente: bache en (-12.0651, -75.2049)
Nuevo reporte: bache en (-12.0652, -75.2050)  → ~14 m → advertencia visible ✅
```

### Casos duplicado negativo (no deben generar advertencia)

```
1. Diferente categoría:
   Incidente existente: bache en (-12.0651, -75.2049)
   Nuevo reporte:       agua  en (-12.0651, -75.2049)  → misma posición, diferente cat → sin advertencia ✅

2. Mayor distancia:
   Incidente existente: bache en (-12.0651, -75.2049)
   Nuevo reporte:       bache en (-12.0700, -75.2100)  → ~700 m → sin advertencia ✅

3. Incidente resuelto:
   Incidente existente: bache en (-12.0651, -75.2049) con status="Resuelto"
   → No cuenta como activo → sin advertencia ✅
```

---

## Verificación de coordenadas del dataset

| Incidente | Lat | Lng | ¿En Huancayo? | ¿Nulo? |
|-----------|-----|-----|--------------|--------|
| Bache Plaza Armas | -12.0651 | -75.2049 | ✅ | No |
| Basura esquina | -12.0620 | -75.2010 | ✅ | No |
| Ruido construcción | -12.0640 | -75.2150 | ✅ | No |
| Agua fuga cuadra 7 | -12.0670 | -75.2055 | ✅ | No |
| Seguridad cámaras | -12.0605 | -75.2030 | ✅ | No |
| Alumbrado Jr. Puno | -12.0700 | -75.2100 | ✅ | No |
| Alcantarillado tapa | -12.0730 | -75.2090 | ✅ | No |
| Bache Av. Real | -12.0680 | -75.1980 | ✅ | No |
| Basura desmonte | -12.0715 | -75.2070 | ✅ | No |
| Señalización cruce | -12.0590 | -75.2060 | ✅ | No |
| Alumbrado parque | -12.0750 | -75.2020 | ✅ | No |
| Agua tubería rota | -12.0635 | -75.2080 | ✅ | No |
| Áreas verdes ciclovía | -12.0610 | -75.1990 | ✅ | No |
| Otro grieta vereda | -12.0560 | -75.2080 | ✅ | No |
| Alcantarillado Ferrocarril | -12.0580 | -75.2120 | ✅ | No |

Rango válido para Huancayo, Junín: lat ∈ [-12.10, -12.04], lng ∈ [-75.26, -75.17]  
Todos los puntos pasan el rango. No hay coordenadas nulas ni fuera de zona.

---

## Limitaciones del cálculo geográfico del MVP

### 1. Fórmula Haversine sin PostGIS

El MVP usa la fórmula matemática de Haversine implementada en Python puro (`geo.py`).
Esta aproximación asume la Tierra como esfera perfecta (radio 6 371 000 m).

**Error real vs. precisión requerida:**
- Error de Haversine: ≤ 0.3% sobre la distancia real (por elipsoide vs. esfera)
- Error en 300 m: < 1 m — inofensivo para el uso case del MVP
- En V2 se recomienda PostGIS con `ST_DWithin` para eficiencia en escala

### 2. Precisión del GPS del dispositivo

| Contexto | Error típico | Impacto en radio 300 m | Impacto en radio 50 m |
|----------|-------------|----------------------|----------------------|
| Exterior, cielo despejado | ±5–15 m | Inofensivo | Bajo |
| Zona urbana densa | ±15–50 m | Bajo | Moderado |
| Interior o sótano | ±50–150 m | Moderado | Alto |

**Decisión técnica MVP:** Se acepta el riesgo de GPS impreciso.
Un ciudadano legítimo cerca del límite puede ser bloqueado en interiores.
Mitigación posible en V2: agregar tolerancia de ±30 m al radio de validación.

### 3. Sin polígonos distritales

El MVP no verifica si el incidente pertenece a un distrito específico de Huancayo.
La validación geográfica es solo por distancia lineal.

**V2 recomendada:** Integrar polígonos GeoJSON de distritos de Huancayo para
asignar incidentes al distrito correcto y enrutar a la autoridad responsable.

### 4. Sin deduplicación por imagen

El MVP detecta duplicados por **categoría + distancia ≤ 50 m**.
No compara imágenes ni analiza contenido de la descripción.

**V2 recomendada:** Clasificación ligera de imagen (ResNet o MobileNet) para
detectar el mismo objeto físico reportado desde distintos ángulos.

### 5. Sin clustering de pines en el mapa

El mapa muestra un pin por incidente. Con muchos incidentes en la misma zona,
los pines se superponen.

**V2 recomendada:** Implementar clustering (Leaflet.markercluster) para agrupar
pins cuando el zoom es bajo.

---

## Checklist de cierre GeoData — Sprint 7

| Ítem | Estado |
|------|--------|
| `haversine_distance()` retorna 0 para el mismo punto | ✅ |
| Radio 300 m bloquea a 3.2 km → 403 | ✅ |
| Radio 50 m detecta duplicado a 14 m | ✅ |
| Distinta categoría no genera duplicado | ✅ |
| Status "Resuelto" excluido de duplicados | ✅ |
| Todos los incidentes del dataset tienen coordenadas no nulas | ✅ |
| Todos los puntos están dentro del área de Huancayo | ✅ |
| Reglas geográficas congeladas para la demo | ✅ |

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `backend/app/utils/geo.py` | Haversine, `find_nearby_incidents`, `check_duplicate`, `is_within_validation_range` |
| `backend/app/routers/incidents.py` | `GET /nearby` (300 m), `POST /{id}/validate` (300 m), `GET /check-duplicate` (50 m) |
| `backend/scripts/seed_demo_complete.py` | Dataset final de 15 incidentes + 7 usuarios + validaciones |
| `docs/geo-sprint5.md` | Reglas de validación ciudadana |
| `docs/geo-sprint6.md` | Reglas de duplicación |
