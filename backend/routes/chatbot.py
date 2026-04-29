"""
Chatbot NutriAI com IA real via Groq.
 
Endpoints:
  POST   /chat/mensagem  → envia mensagem, recebe resposta da IA
  GET    /chat/historico → mensagens salvas do usuário (persistidas no banco)
  DELETE /chat/limpar    → apaga histórico e começa nova conversa
"""
 
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from groq import Groq
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from dependencies import get_current_user_id, get_db
from limiter import limiter
from models import ConversationMessage
 
load_dotenv()
 
router = APIRouter(prefix="/chat", tags=["chatbot"])
 
GROQ_API_KEY         = os.getenv("GROQ_API_KEY")
GROQ_MODEL           = "llama-3.3-70b-versatile"
MAX_CONTEXT_MESSAGES = 12
MAX_TOKENS_RESPONSE  = 1024
 
SYSTEM_PROMPT = """Você é NutriAI, um assistente nutricional especializado e empático.
 
Seu perfil:
- Tom: acolhedor, encorajador, sem julgamentos
- Linguagem: português brasileiro claro, sem jargões desnecessários
- Base: ciência nutricional atualizada (OMS, ANVISA, SBEM)
 
O que você FAZ:
- Orienta sobre alimentação saudável, macronutrientes, micronutrientes
- Sugere refeições, lanches e receitas saudáveis
- Explica cálculos (TMB, GET, déficit/superávit calórico)
- Adapta sugestões a preferências (vegetariano, vegano, sem glúten etc.)
- Motiva o usuário em direção aos objetivos de saúde
- Quando tiver o perfil do usuário disponível, use os dados para personalizar as respostas
 
O que você NÃO faz:
- Diagnosticar doenças ou substituir consulta médica/nutricional presencial
- Indicar suplementos específicos com dosagens
- Criar dietas restritivas sem contexto clínico
 
Quando o usuário mencionar condição médica, recomende consulta com profissional
E ainda assim dê orientações gerais úteis.
 
Seja conciso: respostas entre 3-8 parágrafos. Use listas quando ajudar a clareza."""
 
 
class MensagemInput(BaseModel):
    mensagem: str = Field(..., min_length=1, max_length=2000)
 
 
def _get_context(user_id: int, db: Session) -> list[dict]:
    mensagens = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.user_id == user_id)
        .order_by(ConversationMessage.criado_em.desc())
        .limit(MAX_CONTEXT_MESSAGES)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in reversed(mensagens)]
 
 
def _get_perfil_context(user_id: int, db: Session) -> str:
    """
    Tenta buscar perfil do usuário para personalizar respostas.
    NUNCA quebra o chat - retorna string vazia em qualquer erro.
    """
    try:
        from models import UserProfile
        perfil = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        if not perfil or not perfil.meta_calorica:
            return ""
        objetivos_map = {
            "perda_leve":     "perda de peso leve (-300 kcal)",
            "perda_moderada": "perda de peso moderada (-500 kcal)",
            "manutencao":     "manutenção do peso",
            "ganho_leve":     "ganho de massa leve (+300 kcal)",
            "ganho_moderado": "ganho de massa moderado (+500 kcal)",
        }
        objetivo_texto = objetivos_map.get(perfil.objetivo or "", perfil.objetivo or "não definido")
        return f"""
 
--- PERFIL DO USUÁRIO ---
Peso: {perfil.peso}kg | Altura: {perfil.altura}cm | Idade: {perfil.idade} anos | Sexo: {perfil.sexo}
TMB: {perfil.tmb} kcal | GET: {perfil.get_valor} kcal | Objetivo: {objetivo_texto}
Meta calórica: {perfil.meta_calorica} kcal
Macros: Proteína {perfil.meta_proteina}g | Carbo {perfil.meta_carbo}g | Gordura {perfil.meta_gordura}g
---"""
    except Exception:
        return ""
 
 
def _save_messages(user_id: int, user_text: str, assistant_text: str, db: Session):
    """Salva as duas mensagens em um único commit."""
    db.add(ConversationMessage(user_id=user_id, role="user",      content=user_text))
    db.add(ConversationMessage(user_id=user_id, role="assistant", content=assistant_text))
    db.commit()
 
 
def _call_groq(messages: list[dict], system_prompt: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY não configurada. Defina no arquivo .env.",
        )
    client = Groq(api_key=GROQ_API_KEY)
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "system", "content": system_prompt}] + messages,
            max_tokens=MAX_TOKENS_RESPONSE,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro ao contatar Groq: {str(e)}",
        )
 
 
@router.post("/mensagem")
@limiter.limit("15/minute")
async def enviar_mensagem(
    request: Request,
    payload: MensagemInput,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    texto = payload.mensagem.strip()
    if not texto:
        raise HTTPException(status_code=422, detail="Mensagem não pode estar vazia.")
 
    contexto = _get_context(user_id, db)
    contexto.append({"role": "user", "content": texto})
    system_completo = SYSTEM_PROMPT + _get_perfil_context(user_id, db)
    resposta = _call_groq(contexto, system_completo)
    _save_messages(user_id, texto, resposta, db)
 
    return {"resposta": resposta, "modelo": GROQ_MODEL}
 
 
@router.get("/historico")
def listar_historico(
    limite: int = 50,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    mensagens = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.user_id == user_id)
        .order_by(ConversationMessage.criado_em.asc())
        .limit(limite)
        .all()
    )
    return [
        {"id": m.id, "role": m.role, "content": m.content, "criado_em": m.criado_em.isoformat()}
        for m in mensagens
    ]
 
 
@router.delete("/limpar", status_code=204)
def limpar_historico(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    db.query(ConversationMessage).filter(ConversationMessage.user_id == user_id).delete()
    db.commit()
 