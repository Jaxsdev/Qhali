"""
seed_demo_complete.py — Dataset completo para la demo final del MVP QHALI (Sprint 7).

Crea de forma idempotente:
  - 1 usuario administrador
  - 6 ciudadanos (Vecino-A a Vecino-F)
  - 15 incidentes con todas las categorías y estados
  - Validaciones para reproducir conteos y el cambio automático a "Confirmado"

Uso (desde la carpeta backend/):
    python scripts/seed_demo_complete.py

O desde la raíz del proyecto:
    python -m scripts.seed_demo_complete
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
import app.models.user_db       # noqa: F401
import app.models.incident_db   # noqa: F401
import app.models.validation_db # noqa: F401
from app.models.user_db import User
from app.models.incident_db import Incident
from app.models.validation_db import Validation
from app.utils.auth_utils import hash_password

Base.metadata.create_all(bind=engine)

# ── Usuarios demo ─────────────────────────────────────────────────────────────

USERS = [
    # Admin
    {"email": "admin@qhali.demo",     "alias": "Admin-QHALI", "role": "admin",     "password": "admin1234"},
    # Ciudadanos (Vecino-A es creador de incidentes; B-F son validadores)
    {"email": "usuario.a@qhali.demo", "alias": "Vecino-A",    "role": "ciudadano", "password": "demo1234"},
    {"email": "usuario.b@qhali.demo", "alias": "Vecino-B",    "role": "ciudadano", "password": "demo1234"},
    {"email": "usuario.c@qhali.demo", "alias": "Vecino-C",    "role": "ciudadano", "password": "demo1234"},
    {"email": "usuario.d@qhali.demo", "alias": "Vecino-D",    "role": "ciudadano", "password": "demo1234"},
    {"email": "usuario.e@qhali.demo", "alias": "Vecino-E",    "role": "ciudadano", "password": "demo1234"},
    {"email": "usuario.f@qhali.demo", "alias": "Vecino-F",    "role": "ciudadano", "password": "demo1234"},
]

# ── Incidentes demo ───────────────────────────────────────────────────────────
# Coordenadas reales de Huancayo, Junín.
# El incidente principal de demo está en la Plaza de Armas (-12.0651, -75.2049).

INCIDENTS = [
    # ── Pendiente (sin validaciones o pocas) ──
    {
        "category": "bache",
        "description": "Bache profundo frente al mercado mayorista, peligroso para motos y peatones.",
        "latitude": -12.0651, "longitude": -75.2049,
        "status": "Pendiente", "validation_count": 0,
    },
    {
        "category": "basura",
        "description": "Acumulación de residuos sólidos en la esquina. No recogen desde el lunes.",
        "latitude": -12.0620, "longitude": -75.2010,
        "status": "Pendiente", "validation_count": 2,
    },
    {
        "category": "ruido",
        "description": "Construcción nocturna sin permiso afecta el descanso de los vecinos.",
        "latitude": -12.0640, "longitude": -75.2150,
        "status": "Pendiente", "validation_count": 0,
    },
    {
        "category": "agua",
        "description": "Fuga de agua en la tubería principal de la cuadra 7. Lleva 3 días sin atención.",
        "latitude": -12.0670, "longitude": -75.2055,
        "status": "Pendiente", "validation_count": 1,
    },
    {
        "category": "seguridad",
        "description": "Cámaras de vigilancia dañadas en el parque central. Zona sin cobertura.",
        "latitude": -12.0605, "longitude": -75.2030,
        "status": "Pendiente", "validation_count": 3,
    },
    # ── Confirmado (5+ validaciones → cambio automático) ──
    {
        "category": "alumbrado",
        "description": "Poste de alumbrado apagado desde hace tres días en la cuadra 5 de Jr. Puno.",
        "latitude": -12.0700, "longitude": -75.2100,
        "status": "Confirmado", "validation_count": 5,
    },
    {
        "category": "alcantarillado",
        "description": "Alcantarilla sin tapa en esquina concurrida. Riesgo de caída especialmente de noche.",
        "latitude": -12.0730, "longitude": -75.2090,
        "status": "Confirmado", "validation_count": 8,
    },
    {
        "category": "bache",
        "description": "Bache en intersección de Av. Real y Jr. Lima. Accidentes reportados.",
        "latitude": -12.0680, "longitude": -75.1980,
        "status": "Confirmado", "validation_count": 6,
    },
    {
        "category": "basura",
        "description": "Desmonte sin retirar bloquea parte de la vereda desde hace una semana.",
        "latitude": -12.0715, "longitude": -75.2070,
        "status": "Confirmado", "validation_count": 5,
    },
    # ── En revisión ──
    {
        "category": "señalización",
        "description": "Señal de tránsito derribada en cruce con alta circulación vehicular.",
        "latitude": -12.0590, "longitude": -75.2060,
        "status": "En revisión", "validation_count": 12,
    },
    {
        "category": "alumbrado",
        "description": "Luminaria rota en parque deja zona oscura con reportes de inseguridad.",
        "latitude": -12.0750, "longitude": -75.2020,
        "status": "En revisión", "validation_count": 7,
    },
    {
        "category": "agua",
        "description": "Tubería rota genera charco en la pista dificultando el paso peatonal.",
        "latitude": -12.0635, "longitude": -75.2080,
        "status": "En revisión", "validation_count": 4,
    },
    # ── Resuelto ──
    {
        "category": "áreas_verdes",
        "description": "Árboles caídos bloqueaban la ciclovía. Ya fueron retirados por la municipalidad.",
        "latitude": -12.0610, "longitude": -75.1990,
        "status": "Resuelto", "validation_count": 15,
    },
    {
        "category": "otro",
        "description": "Grieta en vereda afectaba el paso de personas con discapacidad. Reparada.",
        "latitude": -12.0560, "longitude": -75.2080,
        "status": "Resuelto", "validation_count": 9,
    },
    {
        "category": "alcantarillado",
        "description": "Desagüe desbordado en Av. Ferrocarril. Atendido y sellado por la empresa de agua.",
        "latitude": -12.0580, "longitude": -75.2120,
        "status": "Resuelto", "validation_count": 11,
    },
]


def get_or_create_user(db, email: str, alias: str, role: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        if user.role != role:
            user.role = role
            db.commit()
        return user
    user = User(
        email=email,
        password_hash=hash_password(password),
        alias_anonimo=alias,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed():
    db = SessionLocal()
    try:
        print("=== QHALI — Seed demo completo (Sprint 7) ===\n")

        # 1. Usuarios
        print("1. Creando usuarios...")
        created_users: list[User] = []
        for u in USERS:
            user = get_or_create_user(db, u["email"], u["alias"], u["role"], u["password"])
            created_users.append(user)
            print(f"   {'[nuevo]' if db.is_modified(user) else '[existe]'} {user.alias_anonimo} <{user.email}> rol={user.role}")

        # Vecino-A es el creador de todos los incidentes
        creator = next(u for u in created_users if u.alias_anonimo == "Vecino-A")
        validators = [u for u in created_users if u.alias_anonimo.startswith("Vecino-") and u.alias_anonimo != "Vecino-A"]

        # 2. Incidentes
        print(f"\n2. Verificando incidentes (creador: {creator.alias_anonimo})...")
        existing_count = db.query(Incident).count()
        if existing_count > 0:
            print(f"   Ya existen {existing_count} incidentes. Omitiendo creación de incidentes.")
            print("   (Para reiniciar: elimina qhali.db y vuelve a ejecutar este script)")
        else:
            db_incidents: list[Incident] = []
            for data in INCIDENTS:
                inc = Incident(
                    user_id=creator.id,
                    public_alias=creator.alias_anonimo,
                    image_url=None,
                    **data,
                )
                db.add(inc)
                db_incidents.append(inc)
            db.commit()
            for inc in db_incidents:
                db.refresh(inc)
            print(f"   {len(db_incidents)} incidentes creados.")

            # 3. Validaciones para incidentes Confirmados (demostrar conteo real)
            print("\n3. Creando validaciones...")
            confirmed = [i for i in db_incidents if i.status == "Confirmado"]
            total_validations = 0
            for inc in confirmed:
                needed = inc.validation_count
                for i, val_user in enumerate(validators):
                    if i >= needed:
                        break
                    existing_val = db.query(Validation).filter(
                        Validation.incident_id == inc.id,
                        Validation.user_id == val_user.id,
                    ).first()
                    if not existing_val:
                        db.add(Validation(incident_id=inc.id, user_id=val_user.id))
                        total_validations += 1
            db.commit()
            print(f"   {total_validations} validaciones creadas para incidentes Confirmados.")

        # Resumen final
        print("\n=== Resumen ===")
        counts: dict[str, int] = {}
        for inc in db.query(Incident).all():
            counts[inc.status] = counts.get(inc.status, 0) + 1
        for st, n in counts.items():
            print(f"   {st}: {n} incidentes")
        print(f"   Total: {sum(counts.values())} incidentes")
        print(f"   Validaciones en BD: {db.query(Validation).count()}")
        print(f"   Usuarios en BD: {db.query(User).count()}")
        print("\nCredenciales de acceso:")
        print("   Admin:    admin@qhali.demo  /  admin1234")
        print("   Vecino-A: usuario.a@qhali.demo  /  demo1234")
        print("   Vecinos B-F: usuario.X@qhali.demo  /  demo1234")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
