# QHALI Backend — API FastAPI

API REST del MVP QHALI para reporte ciudadano de incidencias urbanas con geolocalización.

## Stack

- **Framework**: FastAPI 0.115 (Python 3.10+)
- **BD**: SQLite (desarrollo) / PostgreSQL (producción)
- **Auth**: JWT con python-jose + bcrypt para hash de contraseñas
- **Geo**: Fórmula Haversine para cálculo de distancias

## Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar variables de entorno
copy .env.example .env
```

## Ejecución

```bash
# Desde la carpeta backend/
uvicorn app.main:app --reload --port 8000
```

La BD SQLite (`qhali.db`) se crea automáticamente al arrancar.

## Scripts de utilidad

```bash
# Dataset completo para la demo final (Sprint 7) — recomendado
python scripts/seed_demo_complete.py

# Cargar usuarios demo ciudadanos
python -m scripts.seed_demo_users

# Cargar usuarios validadores Sprint 5 (Vecino-A a Vecino-F)
python -m scripts.seed_sprint5_users

# Crear / promover usuario administrador
python scripts/seed_admin.py

# Cargar incidentes simulados con coordenadas reales de Huancayo
python -m scripts.seed_incidents

# Verificar unicidad y formato de alias anónimos
python -m scripts.test_alias_uniqueness
```

Las imágenes subidas se guardan en `backend/uploads/images/` y se sirven en `http://localhost:8000/static/images/<archivo>`.

## Endpoints — Sprint 2 (Autenticación)

### POST `/api/v1/auth/register`
Registra un ciudadano nuevo. El alias anónimo se genera automáticamente.

**Request:**
```json
{ "email": "tu@correo.com", "password": "min8chars" }
```

**Response 201:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "alias_anonimo": "Vecino_AB3K",
    "role": "ciudadano",
    "is_active": true,
    "created_at": "2026-05-19T..."
  }
}
```

**Errores:** `400` correo ya registrado · `422` campos inválidos

---

### POST `/api/v1/auth/login`
Autentica un ciudadano existente.

**Request:**
```json
{ "email": "tu@correo.com", "password": "tu_contraseña" }
```

**Response 200:** igual que `/register`

**Errores:** `401` credenciales incorrectas · `400` cuenta inactiva

---

### GET `/api/v1/auth/me`
Devuelve el perfil del usuario autenticado. Requiere token JWT.

**Header:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": 1,
  "alias_anonimo": "Vecino_AB3K",
  "role": "ciudadano",
  "is_active": true,
  "created_at": "2026-05-19T..."
}
```

**Errores:** `401` token inválido o expirado

---

### POST `/api/v1/auth/logout`
Cierra la sesión (el token se elimina en el cliente). Requiere token JWT.

**Response 200:**
```json
{ "message": "Sesión cerrada correctamente" }
```

---

## Endpoints — Sprint 3 (Reporte ciudadano)

### POST `/api/v1/incidents/`
Crea un reporte urbano. Requiere token JWT. Acepta `multipart/form-data`.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Campos del formulario:**

| Campo | Tipo | Obligatorio | Restricciones |
|-------|------|-------------|---------------|
| `category` | string | Sí | Ver categorías válidas |
| `description` | string | Sí | 10–250 caracteres |
| `latitude` | float | Sí | -90.0 a 90.0 |
| `longitude` | float | Sí | -180.0 a 180.0 |
| `location_accuracy` | float | No | Precisión GPS en metros |
| `image` | file | Sí | JPG, PNG o WebP · máx 10 MB |

**Categorías válidas:** `bache`, `alumbrado`, `basura`, `agua`, `alcantarillado`, `señalización`, `áreas_verdes`, `ruido`, `seguridad`, `otro`

**Response 201:**
```json
{
  "id": 1,
  "public_alias": "Vecino_AB3K",
  "category": "bache",
  "description": "Bache profundo frente al colegio...",
  "image_url": "http://localhost:8000/static/images/abc123.jpg",
  "latitude": -12.0651,
  "longitude": -75.2049,
  "status": "Pendiente",
  "created_at": "2026-05-19T10:30:00Z"
}
```

**Errores:** `401` sin token · `422` campos inválidos, categoría incorrecta, coords fuera de rango, imagen no válida

> El campo `status` es siempre `"Pendiente"`. No puede ser definido por el cliente.

---

### GET `/api/v1/incidents/public`
Lista pública de incidentes activos para el mapa ciudadano (Sprint 4).

**Query params opcionales:** `?category=bache`

**Response 200:** array de incidentes (sin email del autor, solo alias público)

---

### GET `/api/v1/incidents/my`
Historial privado del usuario autenticado. Requiere token JWT.

**Header:** `Authorization: Bearer <token>`

**Response 200:** array de incidentes del usuario autenticado

---

### GET `/api/v1/incidents/{id}`
Detalle de un incidente por ID.

**Response 200:** objeto incidente · **404** si no existe

---

## Endpoints — Sprint 5 (Validación ciudadana)

### GET `/api/v1/incidents/nearby`
Incidentes pendientes dentro del radio, excluyendo los del propio usuario. Requiere JWT.

**Query params:** `?lat=-12.0651&lng=-75.2049&radius=300` (radius máx: 1000 m)

**Response 200:** array de incidentes con `distance_meters` calculado por Haversine.

---

### POST `/api/v1/incidents/{id}/validate`
Registra la validación ciudadana de un incidente. Requiere JWT.

**Reglas:** incidente en Pendiente · no es propio · usuario dentro de 300 m · no validado antes.
Con 5 validaciones el estado cambia automáticamente a "Confirmado".

**Request:** `{ "latitude": float, "longitude": float }`

**Response 201:**
```json
{ "validation_id": 1, "incident_id": 5, "validation_count": 3, "status": "Pendiente", "message": "Validación registrada correctamente." }
```
**Errores:** `403` propio o lejos · `404` no existe · `409` estado inválido o ya validado

---

### GET `/api/v1/validations/incident/{id}`
Devuelve el conteo de validaciones de un incidente.

**Response 200:** `{ "incident_id": 5, "validation_count": 3 }`

---

## Endpoints — Sprint 6 (Admin y duplicados)

### GET `/api/v1/incidents/check-duplicate`
Detecta incidentes similares cercanos (misma categoría + ≤50 m + activos). Requiere JWT.

**Query params:** `?lat=-12.0651&lng=-75.2049&category=bache`

**Response 200:**
```json
{ "has_duplicates": true, "duplicates": [{ "id": 1, "description": "...", "status": "Pendiente", "distance_meters": 14.2 }] }
```

---

### GET `/api/v1/admin/incidents`
Lista todas las incidencias. Requiere JWT con `role=admin`.

**Query params:** `?status_filter=Pendiente&category=bache` (ambos opcionales)

**Response 200:** array de incidentes con todos los campos (incluye lat/lng).

---

### PATCH `/api/v1/admin/incidents/{id}/status`
Cambia el estado de un incidente. Requiere JWT con `role=admin`.

**Request:** `{ "status": "En revisión" }` — valores válidos: `Pendiente`, `Confirmado`, `En revisión`, `Resuelto`

**Response 200:** incidente actualizado · **403** si no es admin · **404** si no existe · **422** estado inválido

---

### GET `/api/v1/admin/metrics`
Métricas generales del sistema. Requiere JWT con `role=admin`.

**Response 200:**
```json
{
  "total_reportes": 15,
  "reportes_pendientes": 5,
  "reportes_confirmados": 4,
  "reportes_en_revision": 3,
  "reportes_resueltos": 3,
  "categoria_mas_frecuente": "bache"
}
```

---

## Tabla resumen de todos los endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/docs` | No | Swagger UI interactivo |
| POST | `/api/v1/auth/register` | No | Registro de ciudadano |
| POST | `/api/v1/auth/login` | No | Login |
| GET | `/api/v1/auth/me` | JWT | Perfil del usuario |
| POST | `/api/v1/auth/logout` | JWT | Cierre de sesión |
| POST | `/api/v1/incidents/` | JWT | Crear reporte (multipart) |
| GET | `/api/v1/incidents/public` | No | Lista para mapa ciudadano |
| GET | `/api/v1/incidents/my` | JWT | Historial privado |
| GET | `/api/v1/incidents/nearby` | JWT | Incidentes a ≤300 m |
| GET | `/api/v1/incidents/check-duplicate` | JWT | Detectar duplicados (≤50 m) |
| GET | `/api/v1/incidents/{id}` | No | Detalle de incidente |
| POST | `/api/v1/incidents/{id}/validate` | JWT | Validar incidente |
| GET | `/api/v1/validations/incident/{id}` | No | Conteo de validaciones |
| GET | `/api/v1/admin/incidents` | JWT+admin | Lista admin con filtros |
| PATCH | `/api/v1/admin/incidents/{id}/status` | JWT+admin | Cambiar estado |
| GET | `/api/v1/admin/metrics` | JWT+admin | Métricas del sistema |

## Estructura de carpetas

```
backend/
├── app/
│   ├── main.py              # FastAPI app, migraciones idempotentes, routers
│   ├── config.py            # Settings con pydantic-settings
│   ├── database.py          # Sesión SQLAlchemy + get_db
│   ├── models/
│   │   ├── user_db.py       # ORM: tabla users
│   │   ├── incident_db.py   # ORM: tabla incidents (Sprint 3+)
│   │   └── validation_db.py # ORM: tabla validations (Sprint 5)
│   ├── routers/
│   │   ├── auth.py          # register, login, /me, logout
│   │   ├── incidents.py     # POST /, GET /public|my|nearby|check-duplicate, GET /{id}, POST /{id}/validate
│   │   ├── validations.py   # GET /incident/{id} — conteo de validaciones
│   │   ├── users.py         # gestión de usuarios
│   │   └── admin.py         # GET /incidents, PATCH /{id}/status, GET /metrics
│   ├── schemas/
│   │   ├── user.py          # RegisterRequest, LoginRequest, AuthResponse, UserPublic
│   │   ├── incident.py      # IncidentResponse, IncidentPublicItem, DuplicateCheckResponse
│   │   ├── validation.py    # ValidateRequest, ValidateResponse, NearbyIncidentItem
│   │   └── admin.py         # AdminIncidentItem, MetricsResponse, StatusUpdateRequest
│   └── utils/
│       ├── auth_utils.py    # JWT, bcrypt, get_current_user
│       ├── alias_generator.py  # Generación de alias anónimos únicos
│       ├── geo.py           # Haversine, find_nearby_incidents, check_duplicate, is_within_validation_range
│       └── geo_validation.py   # validate_coordinates
├── scripts/
│   ├── seed_demo_complete.py    # Dataset completo para demo (Sprint 7) ← usar este
│   ├── seed_demo_users.py       # Seed de usuarios demo básicos
│   ├── seed_sprint5_users.py    # Seed de Vecino-A a Vecino-F
│   ├── seed_admin.py            # Crear/promover usuario admin
│   ├── seed_incidents.py        # Seed de incidentes simulados (Sprint 3/4)
│   └── test_alias_uniqueness.py # Tests de unicidad de alias
├── uploads/
│   └── images/              # Imágenes subidas por los ciudadanos
├── .env.example
├── requirements.txt
└── README.md
```

## Seguridad

- Contraseñas: `bcrypt` (nunca se almacena en texto plano)
- Tokens: JWT firmados con `SECRET_KEY`, expiran en 24 horas
- El `email` y `password_hash` **nunca** aparecen en respuestas de API
- El alias anónimo es el único identificador público del ciudadano

## Variables de entorno relevantes

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./qhali.db` | Conexión a BD |
| `SECRET_KEY` | — | Clave para firmar JWT (cambiar en prod) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Duración del token (24h) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Orígenes permitidos |
