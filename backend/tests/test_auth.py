"""Testes de autenticação: registro e login."""


def test_register_success(client):
    resp = client.post("/auth/register", json={
        "nome": "Maria Silva",
        "email": "maria@example.com",
        "senha": "minhasenha",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["usuario"]["email"] == "maria@example.com"


def test_register_duplicate_email(client):
    payload = {"nome": "Dup User", "email": "dup@example.com", "senha": "senha123"}
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 400
    assert "já cadastrado" in resp.json()["detail"]


def test_register_nome_muito_curto(client):
    resp = client.post("/auth/register", json={
        "nome": "A",
        "email": "curto@example.com",
        "senha": "senha123",
    })
    assert resp.status_code == 422


def test_register_senha_curta(client):
    resp = client.post("/auth/register", json={
        "nome": "João",
        "email": "joao@example.com",
        "senha": "123",
    })
    assert resp.status_code == 422


def test_login_success(client):
    client.post("/auth/register", json={
        "nome": "Login Test",
        "email": "logintest@example.com",
        "senha": "senha123",
    })
    resp = client.post("/auth/login", json={
        "email": "logintest@example.com",
        "senha": "senha123",
    })
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "nome": "Wrong Pass",
        "email": "wrongpass@example.com",
        "senha": "correta123",
    })
    resp = client.post("/auth/login", json={
        "email": "wrongpass@example.com",
        "senha": "errada456",
    })
    assert resp.status_code == 401


def test_login_email_inexistente(client):
    resp = client.post("/auth/login", json={
        "email": "naoexiste@example.com",
        "senha": "qualquer",
    })
    assert resp.status_code == 401


def test_endpoint_sem_token(client):
    resp = client.get("/calculator/perfil")
    assert resp.status_code == 403
