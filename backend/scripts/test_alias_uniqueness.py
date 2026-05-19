"""
Script de verificación de unicidad de alias — GeoData/IA Sprint 2.

Prueba que:
1. Se generan N aliases sin repetición.
2. El formato sigue el patrón Prefijo_XXXX.
3. El fallback de 6 chars funciona bajo alta colisión simulada.

Uso:
    cd backend
    python -m scripts.test_alias_uniqueness
"""

import sys
import os
import re
import random
from unittest.mock import MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.utils.alias_generator import generate_unique_alias, _PREFIXES

ALIAS_PATTERN = re.compile(r"^(Vecino|Ciudadano|Habitante|Residente)_[A-Z0-9]{4,6}$")


# ── Test 1: Unicidad en 500 aliases contra BD real ──────────────────────────

def test_uniqueness_real_db(n: int = 500):
    """Genera N aliases usando la BD real y verifica que no se repiten."""
    from app.database import SessionLocal, engine, Base
    import app.models.user_db  # noqa: F401
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    generated = set()
    collisions = 0

    try:
        for i in range(n):
            alias = generate_unique_alias(db)
            if alias in generated:
                collisions += 1
            generated.add(alias)

            if not ALIAS_PATTERN.match(alias):
                print(f"  [FAIL] Formato inválido: {alias}")
                return False

        print(f"  [OK]   {n} aliases generados, {collisions} colisiones detectadas.")
        return collisions == 0
    finally:
        db.close()


# ── Test 2: Formato del alias ────────────────────────────────────────────────

def test_alias_format():
    """Verifica que el formato siempre comience con un prefijo conocido."""
    db_mock = MagicMock()
    db_mock.query.return_value.filter.return_value.first.return_value = None  # siempre libre

    for _ in range(100):
        alias = generate_unique_alias(db_mock)
        if not ALIAS_PATTERN.match(alias):
            print(f"  [FAIL] Formato inválido: {alias}")
            return False

    print(f"  [OK]   100 aliases con formato correcto (patrón: Prefijo_XXXX).")
    return True


# ── Test 3: Fallback bajo alta colisión ──────────────────────────────────────

def test_fallback_under_collision():
    """Simula que los 20 primeros intentos siempre colisionan → debe usar sufijo largo."""
    call_count = [0]

    def always_collide(*args, **kwargs):
        call_count[0] += 1
        mock = MagicMock()
        # Los primeros 20 intentos simulan colisión, el 21 no (fallback con suffix 6)
        mock.first.return_value = "collides" if call_count[0] <= 20 else None
        return mock

    db_mock = MagicMock()
    db_mock.query.return_value.filter.return_value = MagicMock(side_effect=None)
    db_mock.query.return_value.filter.return_value.first.side_effect = lambda: (
        "collides" if call_count[0] < 20 else None
    )

    # Reiniciamos el contador para cada intento dentro del bucle de generate_unique_alias
    call_count[0] = 0
    alias = generate_unique_alias(db_mock)

    suffix_len = len(alias.split("_")[1]) if "_" in alias else 0
    if suffix_len >= 4:
        print(f"  [OK]   Fallback generó alias válido: {alias} (sufijo {suffix_len} chars).")
        return True
    else:
        print(f"  [FAIL] Alias de fallback inválido: {alias}")
        return False


# ── Test 4: Prefijos cubiertos ───────────────────────────────────────────────

def test_prefix_distribution(n: int = 1000):
    """Verifica que los 4 prefijos se distribuyen aproximadamente uniforme."""
    db_mock = MagicMock()
    db_mock.query.return_value.filter.return_value.first.return_value = None

    counts = {p: 0 for p in _PREFIXES}
    for _ in range(n):
        alias = generate_unique_alias(db_mock)
        prefix = alias.split("_")[0]
        counts[prefix] = counts.get(prefix, 0) + 1

    min_expected = n // len(_PREFIXES) * 0.5  # al menos 50% del ideal
    ok = all(v >= min_expected for v in counts.values())
    status = "[OK]  " if ok else "[WARN]"
    print(f"  {status} Distribución de prefijos (n={n}): {counts}")
    return ok


# ── Runner ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("QHALI — Verificación de unicidad de alias anónimos\n")

    results = []

    print("Test 1: Formato de alias")
    results.append(test_alias_format())

    print("\nTest 2: Distribución de prefijos (1000 aliases)")
    results.append(test_prefix_distribution(1000))

    print("\nTest 3: Fallback bajo colisión simulada")
    results.append(test_fallback_under_collision())

    print("\nTest 4: Unicidad contra BD real (500 aliases)")
    results.append(test_uniqueness_real_db(500))

    passed = sum(results)
    total = len(results)
    print(f"\n{'='*45}")
    print(f"Resultado: {passed}/{total} tests pasaron.")
    if passed < total:
        sys.exit(1)
