"""
Calculadora nutricional — TMB (Mifflin-St Jeor) e GET.
Salva automaticamente o resultado no perfil do usuário (UserProfile).
"""
 
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
 
from dependencies import get_db, get_current_user_id
from models import UserProfile
 
router = APIRouter(prefix="/calculator", tags=["calculadora"])
 
OBJETIVOS_AJUSTE = {
    "perda_leve":      -300,
    "perda_moderada":  -500,
    "manutencao":         0,
    "ganho_leve":       300,
    "ganho_moderado":   500,
}
 
FATORES_ATIVIDADE = {1.2, 1.375, 1.55, 1.725, 1.9}
 
 
class DadosCalculo(BaseModel):
    peso:      float   # kg
    altura:    float   # cm
    idade:     int     # anos
    sexo:      str     # "masculino" ou "feminino"
    atividade: float   # 1.2 / 1.375 / 1.55 / 1.725 / 1.9
    objetivo:  str     # ver OBJETIVOS_AJUSTE
 
    @field_validator("peso")
    @classmethod
    def peso_valido(cls, v):
        if not (20 <= v <= 500):
            raise ValueError("Peso deve estar entre 20 e 500 kg.")
        return v
 
    @field_validator("altura")
    @classmethod
    def altura_valida(cls, v):
        if not (100 <= v <= 250):
            raise ValueError("Altura deve estar entre 100 e 250 cm.")
        return v
 
    @field_validator("idade")
    @classmethod
    def idade_valida(cls, v):
        if not (10 <= v <= 120):
            raise ValueError("Idade deve estar entre 10 e 120 anos.")
        return v
 
    @field_validator("sexo")
    @classmethod
    def sexo_valido(cls, v):
        v = v.lower()
        if v not in ("masculino", "feminino"):
            raise ValueError("Sexo deve ser 'masculino' ou 'feminino'.")
        return v
 
    @field_validator("atividade")
    @classmethod
    def atividade_valida(cls, v):
        if v not in FATORES_ATIVIDADE:
            raise ValueError(f"Fator deve ser um de: {sorted(FATORES_ATIVIDADE)}")
        return v
 
    @field_validator("objetivo")
    @classmethod
    def objetivo_valido(cls, v):
        if v not in OBJETIVOS_AJUSTE:
            raise ValueError(f"Objetivo deve ser um de: {list(OBJETIVOS_AJUSTE.keys())}")
        return v
 
 
def _tmb(dados: DadosCalculo) -> float:
    """Fórmula Mifflin-St Jeor."""
    base = (10 * dados.peso) + (6.25 * dados.altura) - (5 * dados.idade)
    return base + 5 if dados.sexo == "masculino" else base - 161
 
 
@router.post("/tmb")
def calcular_tmb(dados: DadosCalculo):
    """Retorna apenas a TMB."""
    return {"tmb": round(_tmb(dados), 2)}
 
 
@router.post("/get")
def calcular_get(
    dados: DadosCalculo,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Retorna TMB, GET e meta calórica ajustada pelo objetivo.
    Salva automaticamente no perfil do usuário para uso no diário.
    """
    tmb   = _tmb(dados)
    get   = tmb * dados.atividade
    ajuste = OBJETIVOS_AJUSTE[dados.objetivo]
    meta  = get + ajuste
 
    # Macros recomendados
    proteina_g = round((meta * 0.30) / 4, 1)   # 30% das calorias
    carbo_g    = round((meta * 0.45) / 4, 1)   # 45% das calorias
    gordura_g  = round((meta * 0.25) / 9, 1)   # 25% das calorias
 
    # ── Salvar/atualizar perfil do usuário ───────────────────────────────────
    perfil = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if perfil:
        perfil.peso          = dados.peso
        perfil.altura        = dados.altura
        perfil.idade         = dados.idade
        perfil.sexo          = dados.sexo
        perfil.atividade     = dados.atividade
        perfil.objetivo      = dados.objetivo
        perfil.tmb           = round(tmb, 2)
        perfil.get_valor     = round(get, 2)
        perfil.meta_calorica = round(meta, 2)
        perfil.meta_proteina = proteina_g
        perfil.meta_carbo    = carbo_g
        perfil.meta_gordura  = gordura_g
    else:
        perfil = UserProfile(
            user_id      = user_id,
            peso         = dados.peso,
            altura       = dados.altura,
            idade        = dados.idade,
            sexo         = dados.sexo,
            atividade    = dados.atividade,
            objetivo     = dados.objetivo,
            tmb          = round(tmb, 2),
            get_valor    = round(get, 2),
            meta_calorica= round(meta, 2),
            meta_proteina= proteina_g,
            meta_carbo   = carbo_g,
            meta_gordura = gordura_g,
        )
        db.add(perfil)
    db.commit()
    # ─────────────────────────────────────────────────────────────────────────
 
    return {
        "tmb":           round(tmb, 2),
        "get":           round(get, 2),
        "meta_calorica": round(meta, 2),
        "macros_recomendados": {
            "proteina_g":    proteina_g,
            "carboidrato_g": carbo_g,
            "gordura_g":     gordura_g,
        },
        "perfil_salvo": True,
    }
 
 
@router.get("/perfil")
def obter_perfil(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Retorna o perfil nutricional salvo do usuário.
    Usado pelo diário para puxar as metas automaticamente.
    """
    perfil = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not perfil:
        return {"perfil": None}
 
    return {
        "perfil": {
            "peso":           perfil.peso,
            "altura":         perfil.altura,
            "idade":          perfil.idade,
            "sexo":           perfil.sexo,
            "atividade":      perfil.atividade,
            "objetivo":       perfil.objetivo,
            "tmb":            perfil.tmb,
            "get":            perfil.get_valor,
            "meta_calorica":  perfil.meta_calorica,
            "meta_proteina":  perfil.meta_proteina,
            "meta_carbo":     perfil.meta_carbo,
            "meta_gordura":   perfil.meta_gordura,
            "atualizado_em":  perfil.atualizado_em.isoformat() if perfil.atualizado_em else None,
        }
    }