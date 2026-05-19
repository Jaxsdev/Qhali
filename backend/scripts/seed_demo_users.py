"""
Script de seed — Usuarios demo para Sprint 3, 5 y QA.

Uso:
    cd backend
    python -m scripts.seed_demo_users

Crea 6 usuarios demo con aliases diferenciados. Si ya existen (por email), los omite.
Útil para pruebas de reportes cruzados y validaciones en sprints futuros.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal, engine, Base
from app.models.user_db import User  # registra el modelo en Base.metadata
from app.utils.auth_utils import hash_password
from app.utils.alias_generator import generate_unique_alias

Base.metadata.create_all(bind=engine)

DEMO_USERS = [
    {"email": "ciudadano1@qhali.demo", "password": "Demo1234!", "role": "ciudadano"},
    {"email": "ciudadano2@qhali.demo", "password": "Demo1234!", "role": "ciudadano"},
    {"email": "ciudadano3@qhali.demo", "password": "Demo1234!", "role": "ciudadano"},
    {"email": "ciudadano4@qhali.demo", "password": "Demo1234!", "role": "ciudadano"},
    {"email": "validador1@qhali.demo", "password": "Demo1234!", "role": "ciudadano"},
    {"email": "admin@qhali.demo",      "password": "AdminDemo!", "role": "admin"},
]


def seed():
    db = SessionLocal()
    created = 0
    skipped = 0

    try:
        for data in DEMO_USERS:
            existing = db.query(User).filter(User.email == data["email"]).first()
            if existing:
                print(f"  [skip]  {data['email']} -> alias ya asignado: {existing.alias_anonimo}")
                skipped += 1
                continue

            alias = generate_unique_alias(db)
            user = User(
                email=data["email"],
                password_hash=hash_password(data["password"]),
                alias_anonimo=alias,
                role=data["role"],
            )
            db.add(user)
            db.flush()  # obtener id antes del commit
            print(f"  [ok]    {data['email']} -> alias: {alias}  (role: {data['role']})")
            created += 1

        db.commit()
        print(f"\nSeed completado: {created} creados, {skipped} omitidos.")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("QHALI — Seed de usuarios demo\n")
    seed()
