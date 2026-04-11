"""
NutriAI — ponto de entrada da API FastAPI.

Para rodar localmente:
    uvicorn main:app --reload

Documentação interativa:
    http://localhost:8000/docs
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routes import auth, calculadora, chatbot, diario, historico, alimento

load_dotenv()

app = FastAPI(
    title="NutriAI API",
    version="2.1.0",
    description="Backend do NutriAI — planos alimentares e chatbot nutricional com IA.",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Banco de dados ────────────────────────────────────────────────────────────
@app.on_event("startup")
def criar_tabelas():
    """Cria todas as tabelas definidas em models.py caso não existam."""
    Base.metadata.create_all(bind=engine)

# ── Rotas ─────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(calculadora.router)
app.include_router(historico.router)
app.include_router(chatbot.router)
app.include_router(diario.router)
app.include_router(alimento.router)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["status"])
def root():
    return {"status": "online", "versao": "2.1.0", "docs": "/docs"}

@app.get("/health", tags=["status"])
def health():
    return {"status": "ok"}
