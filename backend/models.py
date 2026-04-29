"""
Modelos SQLAlchemy — NutriAI.
Regras:
  - Todo ForeignKey tem index=True para queries rápidas.
  - Timestamps usam server_default=func.now() — o banco define, não o Python.
  - Campos sensíveis (senha) nunca expostos via relationship.
"""

from sqlalchemy import (
    Column, DateTime, Float, ForeignKey,
    Index, Integer, String, Text, func,
)
from database import Base


class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    nome        = Column(String(120), nullable=False)
    email       = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash  = Column(String(255), nullable=False)
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


class UserProfile(Base):
    """
    Perfil nutricional do usuário — salvo após usar a calculadora.
    Permite que o diário e o chatbot usem os dados sem re-perguntar.
    """
    __tablename__ = "user_profiles"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                             nullable=False, unique=True, index=True)
    peso            = Column(Float, nullable=True)
    altura          = Column(Float, nullable=True)
    idade           = Column(Integer, nullable=True)
    sexo            = Column(String(20), nullable=True)
    atividade       = Column(Float, nullable=True)
    objetivo        = Column(String(50), nullable=True)
    tmb             = Column(Float, nullable=True)
    get_valor       = Column(Float, nullable=True)   # GET é palavra reservada
    meta_calorica   = Column(Float, nullable=True)
    meta_proteina   = Column(Float, nullable=True)
    meta_carbo      = Column(Float, nullable=True)
    meta_gordura    = Column(Float, nullable=True)
    atualizado_em   = Column(DateTime, server_default=func.now(),
                             onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<UserProfile user_id={self.user_id} meta={self.meta_calorica}kcal>"


class DietHistory(Base):
    """Planos alimentares gerados e salvos pelo usuário."""
    __tablename__ = "diet_history"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                             nullable=False, index=True)
    titulo          = Column(String(200), default="Dieta personalizada")
    calorias        = Column(Float, nullable=False)
    dieta_gerada    = Column(Text, nullable=False)
    criado_em       = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<DietHistory id={self.id} user_id={self.user_id}>"


class DailyMeal(Base):
    """
    Registro diário de refeições — diário alimentar.
    Dados persistem no servidor (não localStorage).
    """
    __tablename__ = "daily_meals"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                         nullable=False, index=True)
    data        = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    nome        = Column(String(200), nullable=False)
    calorias    = Column(Float, nullable=False)
    proteina    = Column(Float, default=0.0)
    carbo       = Column(Float, default=0.0)
    gordura     = Column(Float, default=0.0)
    # categorias válidas: cafe, almoco, cafe_tarde, jantar, lanche, outro
    categoria   = Column(String(50), default="outro")
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)

    # Índice composto: todas as queries de diário filtram por (user_id, data)
    __table_args__ = (
        Index("ix_daily_meals_user_data", "user_id", "data"),
    )

    def __repr__(self):
        return f"<DailyMeal id={self.id} data={self.data} nome={self.nome}>"


class ConversationMessage(Base):
    """
    Histórico de conversas com o chatbot de IA.
    Permite contexto real entre mensagens e entre sessões.
    """
    __tablename__ = "conversation_messages"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                         nullable=False, index=True)
    role        = Column(String(20), nullable=False)   # "user" ou "assistant"
    content     = Column(Text, nullable=False)
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)

    # Índice composto: chatbot sempre filtra por user_id e ordena por criado_em
    __table_args__ = (
        Index("ix_conversation_user_time", "user_id", "criado_em"),
    )

    def __repr__(self):
        return f"<Message id={self.id} role={self.role}>"


class Alimento(Base):
    """Tabela de alimentos para consulta de macros."""
    __tablename__ = "alimentos"

    id                  = Column(Integer, primary_key=True, index=True)
    nome                = Column(String(100), unique=True, index=True, nullable=False)
    proteina_por_100g   = Column(Float, default=0.0)
    carbo_por_100g      = Column(Float, default=0.0)
    gordura_por_100g    = Column(Float, default=0.0)
    calorias_por_100g   = Column(Float, default=0.0)
    created_at          = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<Alimento id={self.id} nome={self.nome}>"
