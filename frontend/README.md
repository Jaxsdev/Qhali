# QHALI Frontend — PWA Ciudadana

Aplicación web progresiva (PWA) para reporte ciudadano de incidencias urbanas en Huancayo.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Estilos**: Tailwind CSS v4
- **Lenguaje**: TypeScript
- **Fuente**: Inter (Google Fonts)

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno

Crear un archivo `.env.local` en la carpeta `frontend/`:

```env
# URL del backend (FastAPI)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Si no se define, el cliente usa `http://localhost:8000/api/v1` por defecto.

## Comandos

```bash
# Desarrollo (con hot reload)
npm run dev
# → http://localhost:3000

# Build de producción
npm run build

# Servir build de producción localmente
npm run start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Rutas disponibles — Sprint 2

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/login` | Inicio de sesión y registro de ciudadano | ✅ Funcional |
| `/home` | Pantalla principal con alias del usuario | ✅ Funcional |
| `/report` | Formulario de nuevo reporte (3 pasos) | 🟡 Sprint 3 |
| `/map` | Mapa de incidencias | 🟡 Sprint 4 |
| `/my-reports` | Historial de mis reportes | 🟡 Sprint 3 |

## Autenticación — Sprint 2

El flujo de auth usa JWT almacenado en `localStorage` bajo la clave `qhali_token`.

### Flujo de registro
1. Usuario llena email, contraseña y confirmación
2. El backend genera un alias anónimo automático (ej: `Vecino_AB3K`)
3. Se muestra el alias al usuario brevemente
4. Redirección automática a `/home`

### Flujo de login
1. Usuario llena email y contraseña
2. Se guarda el token JWT en `localStorage`
3. Redirección a `/home`

### Persistencia de sesión
Al cargar la app, `AuthProvider` verifica el token guardado contra `GET /api/v1/auth/me`.
Si el token es válido, el usuario queda autenticado sin volver a loguearse.

### Rutas protegidas
Las rutas dentro del grupo `(app)/` requieren sesión activa.
Sin sesión, el usuario es redirigido automáticamente a `/login`.

## Estructura

```
frontend/
├── app/
│   ├── globals.css              # Design system (colores, glassmorphism, animaciones)
│   ├── layout.tsx               # Root layout + AuthProvider
│   ├── page.tsx                 # Redirect → /login
│   ├── lib/
│   │   ├── api.ts               # Cliente HTTP (fetch + token automático)
│   │   └── auth.tsx             # AuthContext, AuthProvider, useAuth()
│   ├── login/
│   │   └── page.tsx             # Login + Registro funcional
│   ├── (app)/                   # Grupo con guard de auth + BottomNav
│   │   ├── layout.tsx           # Protección de rutas + spinner de carga
│   │   ├── home/page.tsx        # Home con alias del usuario + logout
│   │   ├── report/page.tsx
│   │   ├── map/page.tsx
│   │   └── my-reports/page.tsx
│   └── components/
│       ├── Providers.tsx        # Wrapper client-side para AuthProvider
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── BottomNav.tsx
│       └── StatusBadge.tsx
```

## Componentes reutilizables

| Componente | Props clave | Uso |
|------------|-------------|-----|
| `Button` | `size`, `fullWidth`, `disabled`, variantes | Botones en formularios y acciones |
| `Input` | `label`, `error`, `icon` | Campos de texto con validación visual |
| `Card` | `hover`, `className` | Tarjetas con efecto glassmorphism |
| `BottomNav` | — | Navegación inferior de 4 tabs |
| `StatusBadge` | `status` | Badge de estado de incidencia |

## Hook `useAuth()`

```ts
const { user, loading, login, register, logout } = useAuth()

// user: { id, alias_anonimo, role, is_active, created_at } | null
// loading: true mientras se verifica la sesión inicial
// login(email, password): Promise<UserPublic>
// register(email, password): Promise<UserPublic>
// logout(): void — limpia token y redirige al login
```
