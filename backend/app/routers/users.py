"""
Router de Usuarios — QHALI MVP
Gestión de perfiles de ciudadanos y administradores.
"""

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.get(
    "/",
    summary="Listar usuarios",
    description="Retorna lista de usuarios (solo admin).",
)
async def list_users():
    """Lista de usuarios. Sprint 2+."""
    return {
        "message": "Endpoint de listado de usuarios preparado",
        "status": "pendiente_implementacion",
        "sprint": 2,
    }


@router.get(
    "/{user_id}",
    summary="Obtener usuario por ID",
    description="Retorna datos de un usuario específico.",
)
async def get_user(user_id: int):
    """Detalle de usuario. Sprint 2+."""
    return {
        "message": f"Endpoint de usuario {user_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 2,
    }


@router.put(
    "/{user_id}",
    summary="Actualizar usuario",
    description="Actualiza datos del perfil del usuario.",
)
async def update_user(user_id: int):
    """Actualizar usuario. Sprint 2+."""
    return {
        "message": f"Endpoint de actualización de usuario {user_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 2,
    }


@router.delete(
    "/{user_id}",
    summary="Desactivar usuario",
    description="Desactiva la cuenta de un usuario (soft delete).",
)
async def deactivate_user(user_id: int):
    """Desactivar usuario. Sprint 3+."""
    return {
        "message": f"Endpoint de desactivación de usuario {user_id} preparado",
        "status": "pendiente_implementacion",
        "sprint": 3,
    }
