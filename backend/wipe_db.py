import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

def main():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL no encontrada en .env")
        sys.exit(1)

    print(f"Conectando a base de datos...")
    engine = create_engine(db_url)

    with engine.begin() as conn:
        print("Eliminando validaciones...")
        conn.execute(text("DELETE FROM validations"))
        
        print("Eliminando comentarios...")
        conn.execute(text("DELETE FROM incident_comments"))
        
        print("Eliminando incidentes...")
        conn.execute(text("DELETE FROM incidents"))
        
        print("Eliminando usuarios (excepto admin)...")
        conn.execute(text("DELETE FROM users WHERE role != 'admin'"))

    print("¡Base de datos limpiada con éxito!")

if __name__ == "__main__":
    main()
