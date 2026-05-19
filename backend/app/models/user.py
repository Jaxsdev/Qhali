"""
Modelo de Usuario — QHALI MVP
Define la estructura del ciudadano y administrador del sistema.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    """Roles disponibles en el sistema."""
    ciudadano = "ciudadano"
    admin = "admin"
    moderador = "moderador"


class UserBase(BaseModel):
    """Campos base compartidos del usuario."""
    email: EmailStr = Field(..., description="Correo electrónico del usuario")
    alias_anonimo: Optional[str] = Field(
        None,
        description="Alias anónimo para reportes públicos",
        max_length=50,
    )
    role: UserRole = Field(
        default=UserRole.ciudadano,
        description="Rol del usuario en el sistema",
    )


class UserCreate(UserBase):
    """Esquema para crear un nuevo usuario."""
    password: str = Field(
        ...,
        description="Contraseña del usuario",
        min_length=8,
        max_length=128,
    )


class UserResponse(UserBase):
    """Esquema de respuesta del usuario (sin contraseña)."""
    id: int
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    """Modelo completo del usuario como se almacena en BD."""
    id: int
    password_hash: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
