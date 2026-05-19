# QHALI — Endpoints API (Preliminar)

## Base URL
```
http://localhost:8000
```

## Autenticación (Sprint 2)

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| POST | `/api/v1/auth/register` | Registro de ciudadano | `{email, password, alias_anonimo?}` |
| POST | `/api/v1/auth/login` | Iniciar sesión | `{email, password}` → JWT token |
| POST | `/api/v1/auth/logout` | Cerrar sesión | Header: `Authorization: Bearer <token>` |
| GET | `/api/v1/auth/me` | Perfil del usuario actual | Header: `Authorization: Bearer <token>` |

## Usuarios (Sprint 2+)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/users/` | Listar usuarios | Admin |
| GET | `/api/v1/users/{id}` | Detalle de usuario | Admin |
| PUT | `/api/v1/users/{id}` | Actualizar usuario | Owner/Admin |
| DELETE | `/api/v1/users/{id}` | Desactivar usuario | Admin |

## Incidencias (Sprint 3)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/incidents/` | Listar incidencias | Público |
| POST | `/api/v1/incidents/` | Crear incidencia | Ciudadano |
| GET | `/api/v1/incidents/{id}` | Detalle de incidencia | Público |
| PUT | `/api/v1/incidents/{id}/status` | Cambiar estado | Admin |
| GET | `/api/v1/incidents/nearby` | Incidencias cercanas | Público |
| GET | `/api/v1/incidents/{id}/duplicates` | Verificar duplicados | Sistema |

### Crear Incidencia (POST)
```json
{
  "title": "Bache peligroso en Av. Real",
  "description": "Bache de aproximadamente 50cm de diámetro en el carril derecho",
  "category": "bache",
  "latitude": -12.0651,
  "longitude": -75.2049,
  "location_accuracy": 10.5,
  "photo_url": "https://storage.qhali.com/photos/abc123.jpg"
}
```

## Validaciones (Sprint 5)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/validations/` | Crear validación | Ciudadano (cercano) |
| GET | `/api/v1/validations/incident/{id}` | Validaciones de incidente | Público |
| GET | `/api/v1/validations/user/{id}` | Validaciones de usuario | Owner |

### Crear Validación (POST)
```json
{
  "incident_id": 42,
  "is_confirmed": true,
  "latitude": -12.0653,
  "longitude": -75.2051,
  "comment": "Confirmo, el bache sigue ahí y es peligroso"
}
```

## Administración (Sprint 6)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/admin/dashboard` | Dashboard de gestión | Admin |
| GET | `/api/v1/admin/incidents` | Gestión de incidencias | Admin |
| PUT | `/api/v1/admin/incidents/{id}/review` | Revisar incidencia | Admin |
| GET | `/api/v1/admin/users` | Gestión de usuarios | Admin |

## Health Check

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado de la API |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |
