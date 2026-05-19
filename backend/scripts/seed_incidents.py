"""
Seed de incidentes simulados para QHALI Sprint 3.
Genera 8 reportes con coordenadas reales de Huancayo, Junín.
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

# Coordenadas reales de puntos conocidos de Huancayo, Junin
INCIDENTS = [
    {
        "category": "bache",
        "description": "Bache profundo frente al mercado mayorista, peligroso para motos y bicicletas.",
        "latitude": -12.0651,
        "longitude": -75.2049,
        "image_url": None,
    },
    {
        "category": "alumbrado",
        "description": "Poste de alumbrado público apagado desde hace tres dias en la cuadra 5.",
        "latitude": -12.0700,
        "longitude": -75.2100,
        "image_url": None,
    },
    {
        "category": "basura",
        "description": "Acumulacion de residuos solidos en la esquina, no recogen desde el lunes.",
        "latitude": -12.0620,
        "longitude": -75.2010,
        "image_url": None,
    },
    {
        "category": "agua",
        "description": "Tuberia rota genera charco en la pista dificultando el paso peatonal.",
        "latitude": -12.0680,
        "longitude": -75.1980,
        "image_url": None,
    },
    {
        "category": "alcantarillado",
        "description": "Alcantarilla sin tapa representa riesgo de caida especialmente de noche.",
        "latitude": -12.0730,
        "longitude": -75.2090,
        "image_url": None,
    },
    {
        "category": "señalización",
        "description": "Señal de transito derribada en cruce con alta circulacion vehicular.",
        "latitude": -12.0590,
        "longitude": -75.2060,
        "image_url": None,
    },
    {
        "category": "seguridad",
        "description": "Luminaria rota en parque deja zona oscura, reportes de inseguridad nocturna.",
        "latitude": -12.0750,
        "longitude": -75.2020,
        "image_url": None,
    },
    {
        "category": "otro",
        "description": "Grieta en vereda afecta el paso de personas con discapacidad.",
        "latitude": -12.0640,
        "longitude": -75.2150,
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
                status="Pendiente",
                **data,
            )
            db.add(incident)

        db.commit()
        total = db.query(Incident).count()
        print(f"OK -> {total} incidentes creados con usuario: {first_user.alias_anonimo}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
