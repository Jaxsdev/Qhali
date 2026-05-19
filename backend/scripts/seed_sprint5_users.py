"""
Seed de usuarios demo para pruebas de validación cruzada — QHALI Sprint 5.
Crea 6 usuarios (A-F) para demostrar el flujo de 5 validaciones distintas.
Uso: python backend/scripts/seed_sprint5_users.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("DATABASE_URL", "sqlite:///./backend/qhali.db")

from app.database import SessionLocal, engine, Base
import app.models.user_db       # noqa: F401
import app.models.incident_db   # noqa: F401
import app.models.validation_db  # noqa: F401
from app.models.user_db import User
from app.utils.auth_utils import hash_password

Base.metadata.create_all(bind=engine)

# Usuarios A-F para el guion de Sprint 5.
# A crea el reporte; B-F lo validan → al quinto se confirma.
SPRINT5_USERS = [
    {"email": "usuario.a@qhali.demo", "alias_anonimo": "Vecino-A"},
    {"email": "usuario.b@qhali.demo", "alias_anonimo": "Vecino-B"},
    {"email": "usuario.c@qhali.demo", "alias_anonimo": "Vecino-C"},
    {"email": "usuario.d@qhali.demo", "alias_anonimo": "Vecino-D"},
    {"email": "usuario.e@qhali.demo", "alias_anonimo": "Vecino-E"},
    {"email": "usuario.f@qhali.demo", "alias_anonimo": "Vecino-F"},
]
PASSWORD = "demo1234"


def seed():
    db = SessionLocal()
    try:
        created, skipped = 0, 0
        for data in SPRINT5_USERS:
            if db.query(User).filter(User.email == data["email"]).first():
                skipped += 1
                continue
            # Skip si el alias ya existe
            if db.query(User).filter(User.alias_anonimo == data["alias_anonimo"]).first():
                skipped += 1
                continue
            user = User(
                email=data["email"],
                password_hash=hash_password(PASSWORD),
                alias_anonimo=data["alias_anonimo"],
                role="ciudadano",
                is_active=True,
            )
            db.add(user)
            created += 1

        db.commit()
        print(f"OK -> {created} usuarios creados, {skipped} ya existían.")
        print()
        print("Credenciales Sprint 5 (contraseña: demo1234):")
        for u in SPRINT5_USERS:
            print(f"  {u['email']}  alias: {u['alias_anonimo']}")
        print()
        print("Flujo de prueba (todos dentro de 300 m de Plaza de Armas):")
        print("  lat_usuario = -12.0651  lng_usuario = -75.2049")
        print("  1. Vecino-A crea reporte en Plaza de Armas.")
        print("  2. Vecinos B, C, D, E, F validan → al 5.º → 'Confirmado'.")
        print("  3. Vecino-A intenta validar su propio reporte → 403 bloqueado.")
        print("  4. Vecino-B intenta validar dos veces → 409 duplicado.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
