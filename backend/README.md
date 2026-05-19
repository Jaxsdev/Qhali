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
# Cargar usuarios demo (para pruebas y QA)
python -m scripts.seed_demo_users

# Verificar unicidad y formato de alias anónimos
python -m scripts.test_alias_uniqueness

# Cargar incidentes simulados con coordenadas reales de Huancayo (Sprint 3+)
python -m scripts.seed_incidents
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

## Endpoints — Sprint 1–2 (base)

| Método | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| GET | `/health` | Health check | ✅ Funcional |
| GET | `/docs` | Swagger UI interactivo | ✅ Funcional |
| POST | `/api/v1/auth/register` | Registro de ciudadano | ✅ Sprint 2 |
| POST | `/api/v1/auth/login` | Login | ✅ Sprint 2 |
| GET | `/api/v1/auth/me` | Perfil del usuario | ✅ Sprint 2 |
| POST | `/api/v1/incidents/` | Crear reporte | ✅ Sprint 3 |
| GET | `/api/v1/incidents/public` | Lista para mapa | ✅ Sprint 3 |
| GET | `/api/v1/incidents/my` | Historial privado | ✅ Sprint 3 |
| POST | `/api/v1/validations/` | Crear validación | 🟡 Sprint 5 |
| GET | `/api/v1/admin/dashboard` | Dashboard admin | 🟡 Sprint 6 |

## Estructura de carpetas

```
backend/
├── app/
│   ├── main.py              # FastAPI app, tablas y montaje de archivos estáticos
│   ├── config.py            # Settings con pydantic-settings
│   ├── database.py          # Sesión SQLAlchemy + get_db
│   ├── models/
│   │   ├── user_db.py       # ORM SQLAlchemy (tabla users)
│   │   └── incident_db.py   # ORM SQLAlchemy (tabla incidents) — Sprint 3
│   ├── routers/
│   │   ├── auth.py          # register, login, /me, logout
│   │   ├── incidents.py     # POST /, GET /public, GET /my, GET /{id}
│   │   ├── users.py
│   │   ├── validations.py
│   │   └── admin.py
│   ├── schemas/
│   │   ├── user.py          # RegisterRequest, LoginRequest, AuthResponse, UserPublic
│   │   └── incident.py      # IncidentResponse, IncidentPublicItem
│   └── utils/
│       ├── auth_utils.py    # JWT, bcrypt, get_current_user
│       ├── alias_generator.py  # Generación de alias anónimos
│       ├── geo.py           # Haversine, find_nearby_incidents
│       └── geo_validation.py   # validate_coordinates — Sprint 3
├── scripts/
│   ├── seed_demo_users.py        # Seed de usuarios demo
│   ├── test_alias_uniqueness.py  # Tests de unicidad de alias
│   └── seed_incidents.py         # Seed de incidentes simulados de Huancayo
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
