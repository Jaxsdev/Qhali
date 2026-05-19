"""
seed_admin.py — Promueve (o crea) el usuario admin para Sprint 6.

Uso:
    cd backend
    python scripts/seed_admin.py

Comportamiento:
  - Si existe un usuario con email 'admin@qhali.demo', actualiza su role a 'admin'.
  - Si no existe, lo crea con alias 'Admin-QHALI' y contraseña 'admin1234'.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user_db import User

try:
    from passlib.context import CryptContext
except ImportError:
    from app.utils.auth_utils import pwd_context as _ctx  # type: ignore
    _hash = _ctx.hash
else:
    _hash = CryptContext(schemes=["bcrypt"], deprecated="auto").hash

ADMIN_EMAIL = "admin@qhali.demo"
ADMIN_ALIAS = "Admin-QHALI"
ADMIN_PASSWORD = "admin1234"

db = SessionLocal()

try:
    user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if user:
        user.role = "admin"
        db.commit()
        print(f"[OK] Usuario '{ADMIN_EMAIL}' promovido a rol 'admin'.")
    else:
        new_user = User(
            email=ADMIN_EMAIL,
            password_hash=_hash(ADMIN_PASSWORD),
            alias_anonimo=ADMIN_ALIAS,
            role="admin",
        )
        db.add(new_user)
        db.commit()
        print(f"[OK] Usuario admin creado: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
finally:
    db.close()
