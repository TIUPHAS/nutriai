"""
Rotas do histórico de planos alimentares.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from dependencies import get_current_user_id, get_db
from models import DietHistory

router = APIRouter(prefix="/historico", tags=["historico"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class DietaSalvar(BaseModel):
    calorias: float
    dieta_gerada: str
    titulo: str = "Dieta personalizada"


class DietaResponse(BaseModel):
    id: int
    titulo: str
    calorias: float
    dieta_gerada: str
    criado_em: str

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/salvar", status_code=status.HTTP_201_CREATED)
def salvar_dieta(
    payload: DietaSalvar,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dieta = DietHistory(
        user_id=user_id,
        calorias=payload.calorias,
        dieta_gerada=payload.dieta_gerada,
        titulo=payload.titulo,
    )
    db.add(dieta)
    db.commit()
    db.refresh(dieta)

    return {
        "mensagem": "Dieta salva com sucesso.",
        "id": dieta.id,
        "criado_em": dieta.criado_em.isoformat(),
    }


@router.get("/listar")
def listar_dietas(
    limite: int = 10,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dietas = (
        db.query(DietHistory)
        .filter(DietHistory.user_id == user_id)
        .order_by(DietHistory.criado_em.desc())
        .limit(limite)
        .all()
    )
    return [
        DietaResponse(
            id=d.id,
            titulo=d.titulo,
            calorias=d.calorias,
            dieta_gerada=d.dieta_gerada,
            criado_em=d.criado_em.isoformat(),
        )
        for d in dietas
    ]


@router.get("/{dieta_id}")
def buscar_dieta(
    dieta_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dieta = (
        db.query(DietHistory)
        .filter(DietHistory.id == dieta_id, DietHistory.user_id == user_id)
        .first()
    )
    if not dieta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dieta não encontrada.",
        )
    return DietaResponse(
        id=dieta.id,
        titulo=dieta.titulo,
        calorias=dieta.calorias,
        dieta_gerada=dieta.dieta_gerada,
        criado_em=dieta.criado_em.isoformat(),
    )


@router.delete("/{dieta_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_dieta(
    dieta_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dieta = (
        db.query(DietHistory)
        .filter(DietHistory.id == dieta_id, DietHistory.user_id == user_id)
        .first()
    )
    if not dieta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dieta não encontrada.",
        )
    db.delete(dieta)
    db.commit()
