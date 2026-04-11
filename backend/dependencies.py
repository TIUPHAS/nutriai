"""
Dependências compartilhadas do FastAPI.
Centraliza: sessão de banco, autenticação JWT, usuário atual.
"""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User  # ✅ Adicionar import do modelo User

load_dotenv()

# ── Configuração JWT ─────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY não definida no .env — defina antes de iniciar o servidor.")

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer()


# ── Sessão de banco ──────────────────────────────────────────────────────────

def get_db():
    """Cria e fecha a sessão de banco de dados a cada request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Autenticação ─────────────────────────────────────────────────────────────

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> int:
    """
    Extrai e valida o token JWT.
    Retorna o user_id (int) ou lança 401.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: campo 'sub' ausente.",
            )
        return int(user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )


def create_access_token(user_id: int, email: str) -> str:
    """Gera um JWT com expiração configurada."""
    # Corrigir o cálculo de expiração
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ✅ NOVA FUNÇÃO: Obter usuário completo (necessária para outros endpoints)
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtém o objeto User completo a partir do token JWT.
    Usado em endpoints que precisam dos dados do usuário.
    """
    user_id = get_current_user_id(credentials)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
        )
    
    return user
