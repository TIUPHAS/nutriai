"""
Fixtures compartilhadas pelos testes.
Usa SQLite em memória para não tocar no banco de produção.
"""

import os
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-only")
os.environ.setdefault("GROQ_API_KEY", "fake-groq-key")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from dependencies import get_db
from main import app

TEST_DATABASE_URL = "sqlite:///./test_nutriai.db"

engine_test = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionTest = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = SessionTest()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)
    import os as _os
    if _os.path.exists("test_nutriai.db"):
        _os.remove("test_nutriai.db")


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers(client):
    """Registra um usuário de teste e retorna o header Authorization."""
    resp = client.post("/auth/register", json={
        "nome": "Teste User",
        "email": "teste@nutriai.com",
        "senha": "senha123",
    })
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}
