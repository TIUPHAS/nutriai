"""
Diário alimentar — rotas para registro diário de refeições.
Dados persistem no banco (não localStorage).
"""

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from dependencies import get_current_user_id, get_db
from models import DailyMeal

router = APIRouter(prefix="/diario", tags=["diario"])

# cafe_tarde adicionada para alinhar com o frontend
CATEGORIAS_VALIDAS = {"cafe", "almoco", "cafe_tarde", "jantar", "lanche", "outro"}


# ── Schemas ───────────────────────────────────────────────────────────────────

class RefeicaoInput(BaseModel):
    nome:      str
    calorias:  float
    proteina:  float = 0.0
    carbo:     float = 0.0
    gordura:   float = 0.0
    categoria: str   = "outro"
    data:      str   # formato YYYY-MM-DD

    @field_validator("calorias", "proteina", "carbo", "gordura")
    @classmethod
    def nao_negativo(cls, v):
        if v < 0:
            raise ValueError("Valores nutricionais não podem ser negativos.")
        return round(v, 1)

    @field_validator("categoria")
    @classmethod
    def categoria_valida(cls, v):
        if v.lower() not in CATEGORIAS_VALIDAS:
            raise ValueError(f"Categoria deve ser uma de: {', '.join(sorted(CATEGORIAS_VALIDAS))}")
        return v.lower()

    @field_validator("data")
    @classmethod
    def data_valida(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("Data deve estar no formato YYYY-MM-DD.")
        return v


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/adicionar", status_code=status.HTTP_201_CREATED)
def adicionar_refeicao(
    payload: RefeicaoInput,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Adiciona uma refeição ao diário do dia especificado."""
    refeicao = DailyMeal(
        user_id  = user_id,
        data     = payload.data,
        nome     = payload.nome.strip(),
        calorias = payload.calorias,
        proteina = payload.proteina,
        carbo    = payload.carbo,
        gordura  = payload.gordura,
        categoria= payload.categoria,
    )
    db.add(refeicao)
    db.commit()
    db.refresh(refeicao)

    return {
        "id":         refeicao.id,
        "mensagem":   "Refeição adicionada.",
        "criado_em":  refeicao.criado_em.isoformat(),
    }


@router.get("/dia/{data}")
def listar_dia(
    data: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Retorna todas as refeições de um dia + totais de macros.
    data: YYYY-MM-DD
    """
    try:
        date.fromisoformat(data)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Data inválida. Use YYYY-MM-DD.",
        )

    refeicoes = (
        db.query(DailyMeal)
        .filter(DailyMeal.user_id == user_id, DailyMeal.data == data)
        .order_by(DailyMeal.criado_em)
        .all()
    )

    totais = {
        "calorias": round(sum(r.calorias for r in refeicoes), 1),
        "proteina": round(sum(r.proteina for r in refeicoes), 1),
        "carbo":    round(sum(r.carbo    for r in refeicoes), 1),
        "gordura":  round(sum(r.gordura  for r in refeicoes), 1),
    }

    return {
        "data":      data,
        "totais":    totais,
        "refeicoes": [
            {
                "id":        r.id,
                "nome":      r.nome,
                "calorias":  r.calorias,
                "proteina":  r.proteina,
                "carbo":     r.carbo,
                "gordura":   r.gordura,
                "categoria": r.categoria,
                "criado_em": r.criado_em.isoformat(),
            }
            for r in refeicoes
        ],
    }


@router.get("/semana")
def resumo_semana(
    data_inicio: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Retorna calorias totais por dia nos 7 dias a partir de data_inicio.
    Usado pelo gráfico semanal no diário.
    data_inicio: YYYY-MM-DD
    """
    try:
        inicio = date.fromisoformat(data_inicio)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Data inválida. Use YYYY-MM-DD.",
        )

    dias = [str(inicio + timedelta(days=i)) for i in range(7)]

    resultados = (
        db.query(DailyMeal.data, func.sum(DailyMeal.calorias).label("total"))
        .filter(DailyMeal.user_id == user_id, DailyMeal.data.in_(dias))
        .group_by(DailyMeal.data)
        .all()
    )

    cals_por_dia = {r.data: round(r.total, 1) for r in resultados}

    return [
        {"data": d, "calorias": cals_por_dia.get(d, 0.0)}
        for d in dias
    ]


@router.delete("/refeicao/{refeicao_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_refeicao(
    refeicao_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove uma refeição do diário. Só o dono pode deletar."""
    refeicao = (
        db.query(DailyMeal)
        .filter(DailyMeal.id == refeicao_id, DailyMeal.user_id == user_id)
        .first()
    )
    if not refeicao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refeição não encontrada.",
        )
    db.delete(refeicao)
    db.commit()
