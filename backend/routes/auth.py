"""
Rotas de autenticação: register e login.
Usa dependencies.py — sem duplicação de get_db ou SECRET_KEY.
"""

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

from dependencies import get_db, create_access_token
from limiter import limiter
from models import User

router = APIRouter(prefix="/auth", tags=["autenticacao"])


# ── Schemas de entrada ────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    nome: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    senha: str = Field(..., min_length=6, max_length=128)

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Nome deve ter pelo menos 2 caracteres.")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    senha: str = Field(..., max_length=128)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    """Cria um novo usuário. Retorna 400 se email já cadastrado."""
    
    # Verificar se email já existe
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado.",
        )

    # Hash da senha
    hashed = bcrypt.hashpw(payload.senha.encode("utf-8"), bcrypt.gensalt())
    
    # Criar usuário
    user = User(
        nome=payload.nome.strip(),
        email=payload.email,
        senha_hash=hashed.decode("utf-8"),  # Ajuste para o nome do campo no seu modelo
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    # Gerar token usando a função do dependencies.py
    token = create_access_token(user.id, user.email)
    
    return {
        "token": token,
        "usuario": {"id": user.id, "nome": user.nome, "email": user.email},
    }


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    """Autentica e retorna JWT."""
    
    # Buscar usuário
    user = db.query(User).filter(User.email == payload.email).first()
    
    # Verificar se usuário existe
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos.",
        )
    
    # Verificar senha
    senha_bytes = payload.senha.encode("utf-8")
    senha_hash_bytes = user.senha_hash.encode("utf-8")  # Ajuste para o nome do campo
    
    if not bcrypt.checkpw(senha_bytes, senha_hash_bytes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos.",
        )

    # Gerar token usando a função do dependencies.py
    token = create_access_token(user.id, user.email)
    
    return {
        "token": token,
        "usuario": {"id": user.id, "nome": user.nome, "email": user.email},
    }