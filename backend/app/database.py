"""
Configuración de conexión a base de datos.
Preparado para PostgreSQL con SQLAlchemy.
En Sprint 1 solo se define la estructura; la conexión real se activa en Sprint 2.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# ── Engine y sesión ──
# En Sprint 1 no se conecta a BD real, pero la estructura queda lista.
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # pool_pre_ping=True,  # Descomentar cuando se conecte a BD real
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency para inyección de sesión de BD en endpoints.
    Uso: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
