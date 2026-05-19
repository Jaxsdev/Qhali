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
```

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

## Endpoints — Sprint 1 (base preparada)

| Método | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| GET | `/health` | Health check | ✅ Funcional |
| GET | `/docs` | Swagger UI interactivo | ✅ Funcional |
| GET | `/redoc` | ReDoc | ✅ Funcional |
| GET | `/api/v1/users/` | Listar usuarios | 🟡 Sprint 3 |
| GET | `/api/v1/incidents/` | Listar incidencias | 🟡 Sprint 3 |
| POST | `/api/v1/incidents/` | Crear incidencia | 🟡 Sprint 3 |
| POST | `/api/v1/validations/` | Crear validación | 🟡 Sprint 5 |
| GET | `/api/v1/admin/dashboard` | Dashboard admin | 🟡 Sprint 6 |

## Estructura de carpetas

```
backend/
├── app/
│   ├── main.py              # FastAPI app + arranque de BD
│   ├── config.py            # Settings con pydantic-settings
│   ├── database.py          # Sesión SQLAlchemy + get_db
│   ├── models/
│   │   ├── user_db.py       # ORM SQLAlchemy (tabla users)
│   │   ├── user.py          # Pydantic models (legado Sprint 1)
│   │   ├── incident.py
│   │   └── validation.py
│   ├── routers/
│   │   ├── auth.py          # register, login, /me, logout
│   │   ├── users.py
│   │   ├── incidents.py
│   │   ├── validations.py
│   │   └── admin.py
│   ├── schemas/
│   │   └── user.py          # RegisterRequest, LoginRequest, AuthResponse, UserPublic
│   └── utils/
│       ├── auth_utils.py    # JWT, bcrypt, get_current_user
│       ├── alias_generator.py  # Generación de alias anónimos
│       └── geo.py           # Haversine
├── scripts/
│   ├── seed_demo_users.py   # Seed de usuarios demo
│   └── test_alias_uniqueness.py
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
