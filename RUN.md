# Cómo Ejecutar QHALI (Guía Paso a Paso)

Qhali es un monorepo que contiene tanto el **Frontend** (Next.js) como el **Backend** (FastAPI). Para que la aplicación funcione completamente, debes ejecutar ambos proyectos al mismo tiempo en dos terminales separadas.

## Requisitos Previos

Asegúrate de tener instalados en tu computadora:
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
- [Python](https://www.python.org/) (Versión 3.9 o superior)
- Git

---

## 1. Clonar el Repositorio (Si aún no lo has hecho)

```bash
git clone https://github.com/Jaxsdev/Qhali.git
cd Qhali
```

---

## 2. Iniciar el Backend (API)

El backend proporciona todos los datos y la lógica de validación e inteligencia artificial a la aplicación.

Abre una terminal y ejecuta los siguientes comandos:

```bash
# 1. Entra a la carpeta del backend
cd backend

# 2. Crea un entorno virtual (solo la primera vez)
python -m venv venv

# 3. Activa el entorno virtual
# En Windows:
venv\Scripts\activate
# En Mac/Linux:
# source venv/bin/activate

# 4. Instala las dependencias (librerías necesarias)
pip install -r requirements.txt

# 5. Configura las variables de entorno
# Si tienes un archivo .env.example, cópialo a .env
# En Windows:
copy .env.example .env

# 6. Inicia el servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

✅ El backend estará corriendo en: `http://localhost:8000`
✅ Puedes ver la documentación de la API en: `http://localhost:8000/docs`

---

## 3. Iniciar el Frontend (Aplicación Web)

El frontend es la interfaz de usuario con la que interactúan los ciudadanos.

Abre **otra ventana de terminal nueva** y ejecuta:

```bash
# 1. Entra a la carpeta del frontend
cd frontend

# 2. Instala las dependencias de Node (solo la primera vez o cuando cambie el package.json)
npm install

# 3. Inicia el servidor de desarrollo
npm run dev
```

✅ El frontend estará corriendo en: `http://localhost:3000`

---

## 4. Probando la Aplicación

Una vez que tengas ambas terminales corriendo sin errores:
1. Abre tu navegador web.
2. Ingresa a `http://localhost:3000`.
3. ¡Listo! Ya puedes interactuar con Qhali.

## Resolución de Problemas (Troubleshooting)

- **El frontend no muestra datos o muestra error de conexión:** Verifica que la terminal del backend siga ejecutándose y que no haya ningún error.
- **Error de "ModuleNotFoundError" en el backend:** Asegúrate de haber activado el entorno virtual (`venv\Scripts\activate`) antes de correr uvicorn.
- **Errores de CORS:** Si el frontend no puede conectarse al backend por políticas de CORS, asegúrate de que el backend tenga configurado `http://localhost:3000` en los orígenes permitidos (dentro de `backend/app/main.py`).
