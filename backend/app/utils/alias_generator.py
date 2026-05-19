"""Generación de alias anónimo para ciudadanos de QHALI."""

import random
import string

from sqlalchemy.orm import Session

_PREFIXES = ["Vecino", "Ciudadano", "Habitante", "Residente"]


def _random_suffix(length: int = 4) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def generate_unique_alias(db: Session) -> str:
    """Genera un alias único comprobando contra la BD. Ej: Vecino_AB3K."""
    from app.models.user_db import User

    for _ in range(20):
        prefix = random.choice(_PREFIXES)
        alias = f"{prefix}_{_random_suffix()}"
        exists = db.query(User).filter(User.alias_anonimo == alias).first()
        if not exists:
            return alias

    # Fallback con sufijo más largo si hay mucha colisión
    prefix = random.choice(_PREFIXES)
    return f"{prefix}_{_random_suffix(6)}"
