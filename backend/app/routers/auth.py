"""
Router de Autenticación — QHALI MVP
Maneja registro, login y gestión de sesiones.
Endpoints preparados para Sprint 2.
"""

from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.post(
    "/register",
    summary="Registrar nuevo ciudadano",
    description="Crea una cuenta de ciudadano con email, contraseña y alias anónimo opcional.",
    status_code=status.HTTP_201_CREATED,
)
async def register():
    """
    Registro de ciudadano.
    Sprint 2: Implementar con hash de contraseña y guardado en BD.
    """
    return {
        "message": "Endpoint de registro preparado",
        "status": "pendiente_implementacion",
        "sprint": 2,
    }


@router.post(
    "/login",
    summary="Iniciar sesión",
    description="Autentica al usuario y retorna un token JWT.",
)
async def login():
    """
    Login de ciudadano.
    Sprint 2: Implementar con verificación de credenciales y JWT.
    """
    return {
        "message": "Endpoint de login preparado",
        "status": "pendiente_implementacion",
        "sprint": 2,
    }


@router.post(
    "/logout",
    summary="Cerrar sesión",
    description="Invalida el token de sesión actual.",
)
async def logout():
    """
    Logout de ciudadano.
    Sprint 2: Implementar invalidación de token.
    """
    return {
        "message": "Endpoint de logout preparado",
        "status": "pendiente_implementacion",
        "sprint": 2,
    }


@router.get(
    "/me",
    summary="Obtener perfil actual",
    description="Retorna los datos del usuario autenticado.",
)
async def get_current_user():
    """
    Perfil del usuario actual.
    Sprint 2: Implementar con token JWT.
    """
    return {
        "message": "Endpoint de perfil preparado",
        "status": "pendiente_implementacion",
        "sprint": 2,
    }
