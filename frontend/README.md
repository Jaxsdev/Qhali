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

## Ejecución

```bash
npm run dev
# Abre http://localhost:3000
```

## Rutas disponibles (Sprint 1)

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/login` | Inicio de sesión / Registro | ✅ Visual |
| `/home` | Pantalla principal ciudadana | ✅ Visual |
| `/report` | Formulario de nuevo reporte (3 pasos) | ✅ Visual |
| `/map` | Mapa de incidencias | ✅ Placeholder |
| `/my-reports` | Historial de mis reportes | ✅ Visual |

## Componentes reutilizables

- `Button` — Botón con variantes (primary, secondary, outline, ghost, danger)
- `Input` — Campo de entrada con label, error e ícono
- `Card` — Tarjeta con hover y glow effects
- `BottomNav` — Navegación inferior de 4 tabs
- `StatusBadge` — Badge de estado de incidencia

## Estructura

```
frontend/
├── app/
│   ├── globals.css          # Design system
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Redirect → /login
│   ├── login/page.tsx       # Login/Register
│   ├── (app)/               # App group (con bottom nav)
│   │   ├── layout.tsx
│   │   ├── home/page.tsx
│   │   ├── report/page.tsx
│   │   ├── map/page.tsx
│   │   └── my-reports/page.tsx
│   └── components/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── BottomNav.tsx
│       └── StatusBadge.tsx
```
