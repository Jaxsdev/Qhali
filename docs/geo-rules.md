# QHALI — Reglas Geográficas Iniciales

## Decisión Técnica

**El MVP usará la fórmula de Haversine** para cálculos de distancia entre coordenadas.
No se requiere PostGIS completo en esta fase. Se migrará a PostGIS cuando se necesite:
- Búsquedas espaciales complejas
- Geofencing por distritos reales
- Volumen de datos > 10,000 incidentes

## Campos Geográficos del Incidente

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `latitude` | float | ✅ Sí | Latitud GPS (-90 a 90) |
| `longitude` | float | ✅ Sí | Longitud GPS (-180 a 180) |
| `location_accuracy` | float | ❌ No | Precisión del GPS en metros |
| `distrito` | string | ❌ No | Distrito (preparado para PostGIS futuro) |
| `confidence_score` | float | ❌ No | Score de confianza (0-1), uso futuro |

## Regla 1: Validación Cercana (Sprint 5)

**Propósito**: Un ciudadano puede validar un incidente solo si está físicamente cerca.

### Condiciones
1. El validador debe ser un **usuario distinto** al que reportó el incidente
2. La distancia entre validador e incidente debe ser **≤ 300 metros**
3. El incidente debe estar en estado **"pendiente"**
4. El validador no debe haber validado ya ese incidente

### Pseudocódigo
```python
def puede_validar(validador, incidente):
    # 1. No puede validar su propio reporte
    if validador.id == incidente.user_id:
        return False, "No puedes validar tu propio reporte"

    # 2. Verificar distancia
    distancia = haversine_distance(
        validador.latitude, validador.longitude,
        incidente.latitude, incidente.longitude
    )
    if distancia > 300:
        return False, f"Estás a {distancia:.0f}m, necesitas estar a menos de 300m"

    # 3. Verificar estado
    if incidente.status != "pendiente":
        return False, "Solo se pueden validar incidentes pendientes"

    # 4. No duplicar validación
    if ya_valido(validador.id, incidente.id):
        return False, "Ya validaste este incidente"

    return True, "Validación permitida"
```

### Parámetros configurables
- `NEARBY_RADIUS_METERS = 300` (variable de entorno)

---

## Regla 2: Detección de Duplicados (Sprint 6)

**Propósito**: Detectar si un nuevo reporte ya existe como incidente activo cercano.

### Condiciones para considerar duplicado
1. **Misma categoría** que un incidente existente
2. **Distancia < 50 metros** entre el nuevo reporte y el existente
3. El incidente existente debe estar en **estado activo** (pendiente o confirmado)

### Pseudocódigo
```python
def detectar_duplicados(nuevo_incidente, incidentes_existentes):
    duplicados = []
    for existente in incidentes_existentes:
        if (
            existente.category == nuevo_incidente.category
            and existente.status in ["pendiente", "confirmado"]
        ):
            distancia = haversine_distance(
                nuevo_incidente.latitude, nuevo_incidente.longitude,
                existente.latitude, existente.longitude
            )
            if distancia < 50:
                duplicados.append({
                    "incidente_id": existente.id,
                    "distancia_metros": distancia,
                    "categoria": existente.category
                })
    return duplicados
```

### Parámetros configurables
- `DUPLICATE_RADIUS_METERS = 50` (variable de entorno)

---

## Fórmula de Haversine

Calcula la distancia en metros entre dos puntos GPS sobre la superficie terrestre.

### Fórmula matemática

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1-a))
d = R × c
```

Donde:
- `R` = 6,371,000 metros (radio de la Tierra)
- `lat1, lon1` = coordenadas del punto 1 (en radianes)
- `lat2, lon2` = coordenadas del punto 2 (en radianes)
- `d` = distancia en metros

### Implementación
Ver `backend/app/utils/geo.py` para la implementación en Python.

### Precisión
- Error típico: < 0.5% para distancias < 10 km
- Suficiente para el MVP de QHALI (distancias < 1 km)

---

## Estructura de Coordenadas

### Formato
- **Sistema**: WGS84 (el estándar de GPS)
- **Tipo**: Grados decimales (no DMS)
- **Ejemplo Huancayo**: `latitude: -12.0651, longitude: -75.2049`

### Validaciones
- Latitud: -90 ≤ lat ≤ 90
- Longitud: -180 ≤ lng ≤ 180
- Precisión mínima recomendada: 6 decimales (~0.11m)

---

## Decisiones Pendientes (Post-MVP)

| Decisión | Estado | Sprint estimado |
|----------|--------|-----------------|
| Migrar a PostGIS | Pendiente | Post-MVP |
| Geocodificación inversa (coordenadas → dirección) | Pendiente | Sprint 4+ |
| Geofencing por distritos reales | Pendiente | Post-MVP |
| Clustering de incidentes en mapa | Pendiente | Sprint 4 |
