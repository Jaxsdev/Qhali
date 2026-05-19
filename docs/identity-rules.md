# QHALI — Reglas de Identidad Anónima (Sprint 2)

## Objetivo

Permitir que los ciudadanos participen activamente en la plataforma sin exponer su
identidad real. El correo electrónico nunca aparece en ninguna vista pública ni en
ninguna respuesta de API que pueda ser vista por terceros.

---

## Estructura de datos del usuario

### Datos públicos (visibles en la app)

| Campo | Ejemplo | Dónde aparece |
|-------|---------|---------------|
| `alias_anonimo` | `Vecino_AB3K` | Home, reportes, validaciones |
| `role` | `ciudadano` | Insignias de rol (futuro) |

### Datos privados (nunca expuestos)

| Campo | Por qué privado |
|-------|-----------------|
| `email` | Identificación real del usuario |
| `password_hash` | Credencial de seguridad |
| `id` | Puede usarse para inferir actividad |

> **Regla de privacidad**: ningún endpoint público retorna `email` ni `password_hash`.
> El endpoint `GET /auth/me` es privado (requiere JWT) y retorna `alias_anonimo`, `role`,
> `is_active` y `created_at` — no el correo.

---

## Formato del alias anónimo

### Patrón

```
{Prefijo}_{SufijoAleatorio}
```

### Prefijos disponibles

| Prefijo | Descripción |
|---------|-------------|
| `Vecino` | Ciudadano general |
| `Ciudadano` | Variante formal |
| `Habitante` | Variante descriptiva |
| `Residente` | Variante alternativa |

### Sufijo aleatorio

- **Longitud**: 4 caracteres (suficiente para ~1.6M combinaciones por prefijo)
- **Caracteres**: A-Z y 0-9 (mayúsculas y dígitos)
- **Ejemplo**: `AB3K`, `7X9Q`, `MN2R`

### Ejemplos válidos

```
Vecino_AB3K
Ciudadano_7X9Q
Habitante_MN2R
Residente_PP01
```

---

## Algoritmo de generación

```python
PREFIJOS = ["Vecino", "Ciudadano", "Habitante", "Residente"]

def generate_unique_alias(db: Session) -> str:
    for _ in range(20):                          # máx 20 intentos
        prefix = random.choice(PREFIJOS)
        suffix = ''.join(random.choices(A-Z + 0-9, k=4))
        alias  = f"{prefix}_{suffix}"
        if not db.query(User).filter_by(alias_anonimo=alias).first():
            return alias
    # Fallback: sufijo de 6 chars si hay alta colisión
    return f"{random.choice(PREFIJOS)}_{random_suffix(6)}"
```

**Dónde se ejecuta**: en el backend, al momento de registrar al usuario
(`POST /api/v1/auth/register`). El frontend nunca envía ni sugiere un alias.

---

## Reglas de unicidad

1. El alias es **único en toda la base de datos** (columna `UNIQUE` en `users.alias_anonimo`).
2. El algoritmo reintenta hasta 20 veces antes de usar un sufijo más largo.
3. Con 4 chars y 36 posibles caracteres: **36⁴ = 1,679,616 combinaciones por prefijo**.
   Con 4 prefijos: ~6.7 millones de aliases únicos posibles.
4. El sufijo de fallback de 6 chars amplía a ~2.17 mil millones combinaciones.

---

## Cuándo se asigna el alias

| Evento | Acción |
|--------|--------|
| Registro nuevo (`POST /auth/register`) | Se genera y asigna inmediatamente |
| Login (`POST /auth/login`) | Se retorna el alias ya existente |
| Consulta de perfil (`GET /auth/me`) | Se retorna el alias ya existente |
| Reporte de incidente (Sprint 3) | Se muestra el alias del ciudadano |

El alias **no cambia** una vez asignado. Si se requiere cambio de alias en el futuro,
se implementará como una función de "Configuración de privacidad" (post-MVP).

---

## Verificación de privacidad (QA)

Para verificar que ningún endpoint expone el correo:

```bash
# Registrar usuario
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"12345678"}'

# Verificar que la respuesta NO contiene el email
# Respuesta esperada: {access_token, token_type, user: {id, alias_anonimo, role, is_active, created_at}}
```

---

## Usuarios demo (Sprint 2 → Sprint 5)

Ver script `backend/scripts/seed_demo_users.py` para cargar usuarios de prueba
con aliases diferenciados. Estos usuarios son útiles para:

- **Sprint 3**: probar reportes asociados a distintos ciudadanos
- **Sprint 5**: probar validaciones cruzadas (distintos usuarios validando el mismo reporte)
- **QA manual**: demostrar que el alias protege la identidad en la UI

---

## Decisiones técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| ¿Alias elegido por usuario? | No, generado automático | Evita nombres ofensivos y garantiza unicidad |
| ¿Alias editable? | No en MVP | Simplicidad + consistencia en reportes históricos |
| ¿Email en `/me`? | No | Consistencia con política de privacidad pública |
| ¿Prefijo en español? | Sí | Contexto local peruano (Huancayo) |
