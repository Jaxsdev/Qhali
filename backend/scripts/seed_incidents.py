"""
Seed de incidentes simulados para QHALI Sprint 3/4.
Genera 10 reportes con coordenadas reales de Huancayo y diferentes estados,
para probar los colores de pines en el mapa ciudadano.
Uso: python backend/scripts/seed_incidents.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("DATABASE_URL", "sqlite:///./backend/qhali.db")

from app.database import SessionLocal, engine, Base
import app.models.user_db      # noqa: F401
import app.models.incident_db  # noqa: F401
from app.models.incident_db import Incident
from app.models.user_db import User

Base.metadata.create_all(bind=engine)

# Coordenadas reales de Huancayo, Junín — distribuidas en distintos puntos
INCIDENTS = [
    # Pendiente (pin gris) — recientes
    {
        "category": "bache",
        "description": "Bache profundo frente al mercado mayorista, peligroso para motos.",
        "latitude": -12.0651,
        "longitude": -75.2049,
        "status": "Pendiente",
        "validation_count": 0,
        "image_url": None,
    },
    {
        "category": "basura",
        "description": "Acumulacion de residuos solidos en la esquina, no recogen desde el lunes.",
        "latitude": -12.0620,
        "longitude": -75.2010,
        "status": "Pendiente",
        "validation_count": 2,
        "image_url": None,
    },
    {
        "category": "ruido",
        "description": "Construccion nocturna sin permiso afecta descanso de vecinos.",
        "latitude": -12.0640,
        "longitude": -75.2150,
        "status": "Pendiente",
        "validation_count": 0,
        "image_url": None,
    },
    # Confirmado (pin rojo)
    {
        "category": "alumbrado",
        "description": "Poste de alumbrado apagado desde hace tres dias en cuadra 5.",
        "latitude": -12.0700,
        "longitude": -75.2100,
        "status": "Confirmado",
        "validation_count": 5,
        "image_url": None,
    },
    {
        "category": "alcantarillado",
        "description": "Alcantarilla sin tapa, riesgo de caida especialmente de noche.",
        "latitude": -12.0730,
        "longitude": -75.2090,
        "status": "Confirmado",
        "validation_count": 8,
        "image_url": None,
    },
    {
        "category": "agua",
        "description": "Tuberia rota genera charco en la pista dificultando el paso peatonal.",
        "latitude": -12.0680,
        "longitude": -75.1980,
        "status": "Confirmado",
        "validation_count": 3,
        "image_url": None,
    },
    # En revisión (pin azul)
    {
        "category": "señalización",
        "description": "Señal de transito derribada en cruce con alta circulacion vehicular.",
        "latitude": -12.0590,
        "longitude": -75.2060,
        "status": "En revisión",
        "validation_count": 12,
        "image_url": None,
    },
    {
        "category": "seguridad",
        "description": "Luminaria rota en parque deja zona oscura con reportes de inseguridad.",
        "latitude": -12.0750,
        "longitude": -75.2020,
        "status": "En revisión",
        "validation_count": 7,
        "image_url": None,
    },
    # Resuelto (pin verde)
    {
        "category": "áreas_verdes",
        "description": "Arboles caidos bloqueaban la ciclovía. Ya fueron retirados.",
        "latitude": -12.0610,
        "longitude": -75.1990,
        "status": "Resuelto",
        "validation_count": 15,
        "image_url": None,
    },
    {
        "category": "otro",
        "description": "Grieta en vereda afectaba paso de personas con discapacidad. Reparada.",
        "latitude": -12.0560,
        "longitude": -75.2080,
        "status": "Resuelto",
        "validation_count": 9,
        "image_url": None,
    },
]


def seed():
    db = SessionLocal()
    try:
        first_user = db.query(User).filter(User.is_active == True).first()
        if not first_user:
            print("ERROR: No hay usuarios en la BD. Ejecuta seed_demo_users.py primero.")
            return

        existing = db.query(Incident).count()
        if existing > 0:
            print(f"Ya existen {existing} incidentes. Omitiendo seed.")
            return

        for data in INCIDENTS:
            incident = Incident(
                user_id=first_user.id,
                public_alias=first_user.alias_anonimo,
                **data,
            )
            db.add(incident)

        db.commit()
        total = db.query(Incident).count()
        counts = {}
        for inc in db.query(Incident).all():
            counts[inc.status] = counts.get(inc.status, 0) + 1
        print(f"OK -> {total} incidentes creados con usuario: {first_user.alias_anonimo}")
        for st, n in counts.items():
            print(f"   {st}: {n}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
