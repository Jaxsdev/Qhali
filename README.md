# QHALI — MVP de Reporte Ciudadano

**QHALI** es una aplicación de reporte ciudadano de incidencias urbanas con geolocalización,
validación social cruzada y dashboard de gestión para la ciudad de Huancayo.

## Estructura del proyecto (Monorepo)

```
Qhali/
├── frontend/          → Next.js + Tailwind CSS (PWA ciudadana)
├── backend/           → FastAPI (API REST)
├── docs/              → Documentación técnica
│   ├── geo-rules.md       → Reglas geográficas
│   ├── data-model.md      → Modelo de datos
│   ├── api-endpoints.md   → Documentación de API
│   └── test-data/         → Datos de prueba
└── README.md
```

## Inicio rápido

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
# → Swagger: http://localhost:8000/docs
```

## Estado del Sprint 1

| Entregable | Estado |
|------------|--------|
| Frontend PWA base navegable | ✅ |
| Backend API con /health | ✅ |
| Modelo preliminar de datos | ✅ |
| Routers de API (5 módulos) | ✅ |
| Reglas geográficas documentadas | ✅ |
| Dataset de prueba (Huancayo) | ✅ |
| Función Haversine | ✅ |

## Equipo

| Rol | Responsabilidad |
|-----|----------------|
| Product Owner Técnico | Visión, backlog, criterios |
| Scrum Master / QA | Organización, pruebas |
| Developer Frontend PWA | Next.js, pantallas, componentes |
| Developer Backend/API | FastAPI, modelos, endpoints |
| Developer GeoData/IA | Reglas geo, Haversine, validación |

## Git

- **main**: rama principal estable
- **develop**: integración de features
- **feature/nombre**: ramas de funcionalidad
