"""
Rotas para consulta e cálculo de macronutrientes dos alimentos.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from dependencies import get_db, get_current_user
from models import Alimento, User

router = APIRouter(prefix="/alimento", tags=["alimento"])


# Schemas
class CalculoRequest(BaseModel):
    nome: str
    peso: float  # em gramas


class CalculoResponse(BaseModel):
    nome: str
    peso: float
    proteina: float
    carbo: float
    gordura: float
    calorias: float


@router.post("/calcular", response_model=CalculoResponse)
async def calcular_macros(
    req: CalculoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calcula os macronutrientes de um alimento baseado no peso informado.
    Busca o alimento no banco de dados (case-insensitive).
    """
    # Buscar alimento no banco (case-insensitive)
    alimento = db.query(Alimento).filter(
        func.lower(Alimento.nome) == func.lower(req.nome)
    ).first()
    
    if not alimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alimento '{req.nome}' não encontrado no banco de dados"
        )
    
    # Validar peso
    if req.peso <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O peso deve ser maior que zero"
        )
    
    # Calcular fator de multiplicação (base 100g)
    fator = req.peso / 100.0
    
    # Calcular macros para o peso informado
    proteina = alimento.proteina_por_100g * fator
    carbo = alimento.carbo_por_100g * fator
    gordura = alimento.gordura_por_100g * fator
    
    # Calcular calorias (4 kcal/g proteína, 4 kcal/g carbo, 9 kcal/g gordura)
    calorias = (proteina * 4) + (carbo * 4) + (gordura * 9)
    
    return CalculoResponse(
        nome=alimento.nome,
        peso=req.peso,
        proteina=round(proteina, 1),
        carbo=round(carbo, 1),
        gordura=round(gordura, 1),
        calorias=round(calorias, 1)
    )


@router.get("/buscar")
async def buscar_alimentos(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca alimentos por nome (para autocomplete).
    """
    if len(q) < 2:
        return []
    
    alimentos = db.query(Alimento).filter(
        Alimento.nome.ilike(f"%{q}%")
    ).limit(10).all()
    
    return [
        {
            "id": a.id,
            "nome": a.nome,
            "proteina": a.proteina_por_100g,
            "carbo": a.carbo_por_100g,
            "gordura": a.gordura_por_100g,
            "calorias": a.calorias_por_100g
        }
        for a in alimentos
    ]