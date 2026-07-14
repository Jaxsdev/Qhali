import json
import httpx
from app.config import settings

# Usar el API Key configurado en settings
ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY

def analyze_incident_text(description: str) -> dict:
    """
    Analiza la descripción de una incidencia urbana usando Claude API para:
    - Sugerir una categoría adecuada.
    - Evaluar la urgencia / prioridad (Baja, Media, Alta, Crítica).
    - Validar si es una descripción coherente y real de un problema urbano (True / False).
    - Crear un título corto de 5 palabras.
    """
    if not ANTHROPIC_API_KEY:
        # Fallback si no hay API Key configurada
        return {
            "suggested_category": "otro",
            "priority": "Media",
            "is_valid": True,
            "summary": "Incidencia reportada"
        }

    prompt = f"""
    Eres un asistente de Inteligencia Artificial para la plataforma de reporte ciudadano de incidencias llamada QHALI.
    Analiza la siguiente descripción de un problema de la ciudad y clasifícala en formato JSON.

    Descripción del ciudadano: "{description}"

    Debes responder únicamente con un objeto JSON válido con las siguientes claves exactas:
    1. "suggested_category": una de estas categorías exactas: "bache", "alumbrado", "basura", "agua", "alcantarillado", "señalización", "áreas_verdes", "ruido", "seguridad", "robos", "otro".
    2. "priority": una prioridad exacta de urgencia: "Baja", "Media", "Alta", "Crítica". (Usa "Crítica" solo ante situaciones de peligro de vida inminente como cables de alta tensión expuestos, postes por caer o colapsos estructurales).
    3. "is_valid": un booleano (true o false). Pon false si el texto es spam, insultos, bromas, información sin sentido lógico, o no describe ningún problema en la ciudad.
    4. "summary": un resumen corto del problema en un título de 5 palabras como máximo (ej. "Bache profundo en pista").

    Responde exclusivamente el objeto JSON crudo. No agregues etiquetas de markdown como ```json o ```, ni explicaciones o introducciones.
    """

    try:
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        # Llamamos a Claude 3.5 Haiku por ser súper rápido y preciso
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 512,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            
            if response.status_code == 200:
                res_data = response.json()
                content_text = res_data["content"][0]["text"].strip()
                
                # Limpieza de markdown por seguridad
                if content_text.startswith("```"):
                    lines = content_text.splitlines()
                    if len(lines) > 2:
                        # Si empieza con ```json, saltar la primera y última línea
                        start_idx = 1 if lines[0].strip().startswith("```json") or lines[0].strip() == "```" else 0
                        end_idx = -1 if lines[-1].strip() == "```" else len(lines)
                        content_text = "\n".join(lines[start_idx:end_idx]).strip()
                
                result = json.loads(content_text)
                return {
                    "suggested_category": result.get("suggested_category", "otro"),
                    "priority": result.get("priority", "Media"),
                    "is_valid": result.get("is_valid", True),
                    "summary": result.get("summary", "Incidencia reportada")
                }
            elif response.status_code == 404:
                print("[AI Fallback] API Key no tiene acceso al modelo (404). Usando mock.")
                # Mock a successful response for the demo
                cat = "bache" if "hueco" in description.lower() or "bache" in description.lower() else "otro"
                return {
                    "suggested_category": cat,
                    "priority": "Alta",
                    "is_valid": True,
                    "summary": "Reporte simulado por falta permisos API"
                }
            else:
                print(f"[AI Error] HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[AI Error] Error al analizar incidencia con Claude: {e}")
        
    return {
        "suggested_category": "otro",
        "priority": "Media",
        "is_valid": True,
        "summary": "Incidencia reportada"
    }

def generate_executive_summary(incidents_data: list) -> str:
    """
    Genera un resumen ejecutivo de las incidencias provistas usando Claude API.
    """
    if not ANTHROPIC_API_KEY:
        return "El resumen ejecutivo inteligente no está disponible porque no hay una API Key configurada. Se encontraron " + str(len(incidents_data)) + " incidencias en total."

    # Preparamos un string resumido de las incidencias para no exceder tokens
    compact_data = []
    for inc in incidents_data:
        compact_data.append(f"- [{inc.get('category')}] {inc.get('ai_priority', 'Media')} | Hora: {inc.get('created_at', '')} | Desc: {inc.get('description', '')} (Estado: {inc.get('status')})")
    
    incidents_text = "\n".join(compact_data)
    
    prompt = f"""
    Eres un analista de datos urbano para la plataforma QHALI. Tienes la siguiente lista de incidencias recientes reportadas por los ciudadanos (en Huancayo):
    
    {incidents_text}
    
    Tu tarea es escribir un 'Resumen Ejecutivo' para el Administrador de la plataforma, de 2 a 3 párrafos como máximo.
    Debes identificar e informar:
    1. Cuáles son los problemas más comunes (categorías de incidentes más frecuentes).
    2. Dónde ocurren principalmente o de qué tratan (analizando el texto de la descripción).
    3. A qué horas suelen ocurrir o reportarse más frecuentemente estos problemas.
    4. La gravedad general (prioridades críticas o altas) y una breve recomendación para la gestión de la ciudad.
    
    REGLAS ESTRICTAS DE FORMATO:
    - Usa un tono profesional, claro y directo. 
    - Empieza directamente con los párrafos del resumen, sin saludos y sin poner títulos como "Resumen Ejecutivo".
    - NO utilices NINGÚN tipo de formato Markdown (prohibido usar asteriscos **, símbolos #, o listas con viñetas). Todo debe ser texto plano continuo dividido solo por saltos de línea (párrafos).
    """

    try:
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 1024,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            
            if response.status_code == 200:
                res_data = response.json()
                return res_data["content"][0]["text"].strip()
            elif response.status_code == 404:
                return "Resumen simulado: Se han detectado varias incidencias. Se recomienda priorizar los reportes marcados como Alta prioridad."
            else:
                print(f"[AI Summary Error] HTTP {response.status_code}: {response.text}")
                return "Hubo un error al generar el resumen. Por favor, revisa los logs."
    except Exception as e:
        print(f"[AI Summary Error] Error al generar resumen con Claude: {e}")
        return "Error interno al conectar con la IA para generar el resumen."

def rewrite_incident_description(raw_text: str) -> str:
    """
    Toma una transcripción de voz (raw_text) y usa Claude API para reescribirla
    de forma concisa y profesional, extrayendo detalles clave (lugar, hora, problema).
    """
    if not ANTHROPIC_API_KEY:
        # Fallback si no hay API Key configurada
        return f"[Redacción simulada] {raw_text[:200]}..."

    prompt = f"""
    Eres un asistente de redacción para QHALI, una plataforma de reporte ciudadano.
    A continuación recibirás una transcripción cruda de voz (dictado) de un ciudadano reportando un problema en la ciudad:
    
    "{raw_text}"
    
    Tu tarea es reescribir este reporte en un texto corto, claro y formal (máximo 250 caracteres).
    Asegúrate de extraer y mantener los detalles más importantes como:
    - Lugar (nombre de calle, zona, si se menciona).
    - Hora o fecha (si se menciona).
    - El problema exacto.
    - El nivel de gravedad descrito.
    
    Responde ÚNICAMENTE con la descripción redactada. Sin comillas, sin introducciones ni saludos.
    """

    try:
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 150,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            
            if response.status_code == 200:
                res_data = response.json()
                content_text = res_data["content"][0]["text"].strip()
                return content_text
            elif response.status_code == 404:
                return f"[Simulado] {raw_text[:200]}..."
            else:
                print(f"[AI Rewrite Error] HTTP {response.status_code}: {response.text}")
                return raw_text
    except Exception as e:
        print(f"[AI Rewrite Error] Error al reescribir con Claude: {e}")
        return raw_text


