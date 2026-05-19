# QHALI Backend — API FastAPI

API REST del MVP QHALI para reporte ciudadano de incidencias urbanas con geolocalización.

## Stack

- **Framework**: FastAPI (Python 3.10+)
- **BD**: PostgreSQL (preparado, no conectado en Sprint 1)
- **Auth**: JWT con python-jose (preparado para Sprint 2)
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

## Endpoints disponibles (Sprint 1)

| Método | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| GET | `/health` | Health check | ✅ Funcional |
| GET | `/docs` | Swagger UI | ✅ Funcional |
| GET | `/redoc` | ReDoc | ✅ Funcional |
| POST | `/api/v1/auth/register` | Registro | 🟡 Preparado |
| POST | `/api/v1/auth/login` | Login | 🟡 Preparado |
| GET | `/api/v1/users/` | Listar usuarios | 🟡 Preparado |
| GET | `/api/v1/incidents/` | Listar incidencias | 🟡 Preparado |
| POST | `/api/v1/incidents/` | Crear incidencia | 🟡 Preparado |
| POST | `/api/v1/validations/` | Crear validación | 🟡 Preparado |
| GET | `/api/v1/admin/dashboard` | Dashboard | 🟡 Preparado |

## Estructura de carpetas

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Punto de entrada FastAPI
│   ├── config.py             # Configuración con pydantic-settings
│   ├── database.py           # Conexión a BD
│   ├── models/               # Modelos Pydantic
│   │   ├── user.py
│   │   ├── incident.py
│   │   └── validation.py
│   ├── routers/              # Endpoints de la API
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── incidents.py
│   │   ├── validations.py
│   │   └── admin.py
│   ├── schemas/              # Schemas request/response
│   └── utils/
│       └── geo.py            # Utilidades geográficas (Haversine)
├── .env.example
├── requirements.txt
└── README.md
```

## Modelos de datos

### User
- `id`, `email`, `alias_anonimo`, `password_hash`, `role`, `is_active`, `created_at`

### Incident
- `id`, `user_id`, `title`, `description`, `category`, `photo_url`
- `latitude`, `longitude`, `location_accuracy`, `distrito`
- `status`, `validation_count`, `confidence_score`, `created_at`

### Validation
- `id`, `incident_id`, `user_id`, `is_confirmed`
- `latitude`, `longitude`, `distance_to_incident`, `comment`, `created_at`
