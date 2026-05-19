"""Router de Autenticación — QHALI Sprint 2."""

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_db import User
from app.schemas.user import AuthResponse, LoginRequest, RegisterRequest, UserPublic
from app.utils.alias_generator import generate_unique_alias
from app.utils.auth_utils import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo ciudadano",
)
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta con ese correo",
        )

    alias = generate_unique_alias(db)
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        alias_anonimo=alias,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserPublic.model_validate(user))


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Iniciar sesión",
)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta inactiva",
        )

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserPublic.model_validate(user))


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Obtener perfil del usuario autenticado",
)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)


@router.post(
    "/logout",
    summary="Cerrar sesión",
    description="El cliente debe eliminar el token localmente.",
)
async def logout(_: User = Depends(get_current_user)):
    return {"message": "Sesión cerrada correctamente"}
