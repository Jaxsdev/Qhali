import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Importar Base y modelos
from app.database import Base
from app.models.user_db import User
from app.models.incident_db import Incident, IncidentComment
from app.models.validation_db import Validation

def main():
    print("Iniciando proceso de migración de SQLite a PostgreSQL (Supabase)...")

    # 1. Configurar conexión SQLite (Origen)
    sqlite_url = "sqlite:///./qhali.db"
    if not os.path.exists("./qhali.db"):
        print("Error: No se encontró la base de datos local qhali.db")
        sys.exit(1)
        
    engine_sqlite = create_engine(sqlite_url)
    SessionSQLite = sessionmaker(bind=engine_sqlite)
    session_sqlite = SessionSQLite()

    # 2. Configurar conexión Postgres (Destino)
    postgres_url = os.getenv("SUPABASE_URL")
    if not postgres_url:
        print("Error: No se definió la variable de entorno SUPABASE_URL.")
        print("Por favor, provee la URL de conexión de Supabase.")
        sys.exit(1)

    # SQLAlchemy requiere que postgresql:// empiece así. Supabase a veces da postgres://
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)

    print("Conectando a Supabase...")
    engine_postgres = create_engine(postgres_url)
    SessionPostgres = sessionmaker(bind=engine_postgres)
    
    # 3. Crear tablas en Postgres
    print("Creando tablas en Supabase (si no existen)...")
    Base.metadata.create_all(bind=engine_postgres)
    
    session_postgres = SessionPostgres()

    try:
        # Extraer datos de SQLite
        print("Extrayendo usuarios...")
        users = session_sqlite.query(User).all()
        print(f"Extrayendo incidentes...")
        incidents = session_sqlite.query(Incident).all()
        print(f"Extrayendo validaciones...")
        validations = session_sqlite.query(Validation).all()
        print(f"Extrayendo comentarios...")
        comments = session_sqlite.query(IncidentComment).all()

        # Evitar problemas con secuencias (IDs autoincrementales)
        # PostgreSQL no actualiza automáticamente las secuencias de IDs si insertamos los IDs manualmente.
        # Por lo tanto, después de insertar, debemos actualizar las secuencias.
        
        # Insertar en Postgres
        print("Insertando usuarios en Supabase...")
        for u in users:
            # Crear una copia desconectada de SQLite
            session_postgres.merge(u)
        
        print("Insertando incidentes en Supabase...")
        for i in incidents:
            session_postgres.merge(i)
            
        print("Insertando validaciones en Supabase...")
        for v in validations:
            session_postgres.merge(v)
            
        print("Insertando comentarios en Supabase...")
        for c in comments:
            session_postgres.merge(c)

        session_postgres.commit()
        print("¡Migración de datos exitosa!")

        # Actualizar las secuencias de PostgreSQL para que los próximos INSERTs funcionen
        # Esto es crucial al importar IDs manualmente.
        from sqlalchemy import text
        print("Actualizando secuencias autoincrementales en PostgreSQL...")
        
        def update_seq(table_name, column_name="id"):
            query = f"SELECT setval(pg_get_serial_sequence('{table_name}', '{column_name}'), coalesce(max({column_name}), 1), max({column_name}) IS NOT null) FROM {table_name};"
            session_postgres.execute(text(query))
            
        update_seq("users")
        update_seq("incidents")
        update_seq("validations")
        update_seq("incident_comments")
        
        session_postgres.commit()
        print("¡Secuencias actualizadas!")
        print("Proceso finalizado. Puedes actualizar el archivo .env con la nueva DATABASE_URL.")

    except Exception as e:
        session_postgres.rollback()
        print(f"Error durante la migración: {e}")
        sys.exit(1)
    finally:
        session_sqlite.close()
        session_postgres.close()

if __name__ == "__main__":
    main()
