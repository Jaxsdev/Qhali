# QHALI — Modelo Preliminar de Datos

## Diagrama de Entidades

```
┌─────────────────────┐     ┌──────────────────────────────┐
│       User          │     │         Incident             │
├─────────────────────┤     ├──────────────────────────────┤
│ id (PK)             │────▶│ id (PK)                      │
│ email (unique)      │     │ user_id (FK → User)          │
│ alias_anonimo       │     │ title                        │
│ password_hash       │     │ description                  │
│ role                │     │ category                     │
│ is_active           │     │ photo_url                    │
│ created_at          │     │ latitude                     │
│ updated_at          │     │ longitude                    │
│                     │     │ location_accuracy            │
│                     │     │ distrito                     │
│                     │     │ status                       │
│                     │     │ validation_count             │
│                     │     │ confidence_score             │
│                     │     │ created_at                   │
│                     │     │ updated_at                   │
└─────────────────────┘     └──────────────────────────────┘
                                        │
                                        │ 1:N
                                        ▼
                            ┌──────────────────────────────┐
                            │       Validation             │
                            ├──────────────────────────────┤
                            │ id (PK)                      │
                            │ incident_id (FK → Incident)  │
                            │ user_id (FK → User)          │
                            │ is_confirmed                 │
                            │ latitude                     │
                            │ longitude                    │
                            │ distance_to_incident         │
                            │ comment                      │
                            │ created_at                   │
                            └──────────────────────────────┘
```

## Detalle de Entidades

### User (Usuario)

| Campo | Tipo | Null | Descripción |
|-------|------|------|-------------|
| id | INTEGER | PK | Identificador único |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Correo electrónico (nunca público) |
| alias_anonimo | VARCHAR(50) | NOT NULL, UNIQUE | Alias anónimo generado automáticamente |
| password_hash | VARCHAR(255) | NOT NULL | Contraseña hasheada (bcrypt) |
| role | ENUM | NOT NULL | ciudadano, admin, moderador |
| is_active | BOOLEAN | NOT NULL | Default: true |
| created_at | TIMESTAMP | NOT NULL | Fecha de registro |
| updated_at | TIMESTAMP | NULL | Última actualización |

### Incident (Incidencia)

| Campo | Tipo | Null | Descripción |
|-------|------|------|-------------|
| id | INTEGER | PK | Identificador único |
| user_id | INTEGER | FK → User | Ciudadano que reportó |
| title | VARCHAR(200) | NOT NULL | Título breve |
| description | TEXT | NOT NULL | Descripción detallada |
| category | ENUM | NOT NULL | Categoría de incidencia |
| photo_url | VARCHAR(500) | NULL | URL de la foto |
| latitude | FLOAT | NOT NULL | Latitud GPS |
| longitude | FLOAT | NOT NULL | Longitud GPS |
| location_accuracy | FLOAT | NULL | Precisión GPS (metros) |
| distrito | VARCHAR(100) | NULL | Distrito (futuro PostGIS) |
| status | ENUM | NOT NULL | Estado del incidente |
| validation_count | INTEGER | NOT NULL | Contador de validaciones |
| confidence_score | FLOAT | NULL | Score de confianza (0-1) |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NULL | Última actualización |

**Categorías**: bache, alumbrado, basura, agua, alcantarillado, señalización, áreas_verdes, ruido, seguridad, otro

**Estados**: pendiente → confirmado → en_revisión → resuelto

### Validation (Validación Ciudadana)

| Campo | Tipo | Null | Descripción |
|-------|------|------|-------------|
| id | INTEGER | PK | Identificador único |
| incident_id | INTEGER | FK → Incident | Incidente validado |
| user_id | INTEGER | FK → User | Ciudadano validador |
| is_confirmed | BOOLEAN | NOT NULL | Confirma existencia |
| latitude | FLOAT | NOT NULL | Latitud del validador |
| longitude | FLOAT | NOT NULL | Longitud del validador |
| distance_to_incident | FLOAT | NOT NULL | Distancia al incidente (metros) |
| comment | VARCHAR(500) | NULL | Comentario opcional |
| created_at | TIMESTAMP | NOT NULL | Fecha de validación |

## Relaciones

- Un **User** puede crear muchos **Incidents** (1:N)
- Un **User** puede crear muchas **Validations** (1:N)
- Un **Incident** puede tener muchas **Validations** (1:N)
- Un User NO puede validar su propio Incident
- Un User solo puede validar un Incident una vez

## Índices implementados (Sprint 2)

```sql
-- Búsqueda por ubicación
CREATE INDEX idx_incident_location ON incidents(latitude, longitude);

-- Filtro por estado y categoría
CREATE INDEX idx_incident_status ON incidents(status);
CREATE INDEX idx_incident_category ON incidents(category);

-- Búsqueda de validaciones por incidente
CREATE INDEX idx_validation_incident ON validations(incident_id);

-- Unicidad de validación por usuario e incidente
CREATE UNIQUE INDEX idx_validation_unique ON validations(user_id, incident_id);
```
