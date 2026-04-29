"""Testes da calculadora nutricional: TMB e GET."""

DADOS_VALIDOS = {
    "peso": 70.0,
    "altura": 175.0,
    "idade": 30,
    "sexo": "masculino",
    "atividade": 1.55,
    "objetivo": "manutencao",
}


def test_tmb_masculino(client):
    resp = client.post("/calculator/tmb", json=DADOS_VALIDOS)
    assert resp.status_code == 200
    tmb = resp.json()["tmb"]
    # Mifflin-St Jeor: (10*70) + (6.25*175) - (5*30) + 5 = 1698.75
    assert abs(tmb - 1698.75) < 1.0


def test_tmb_feminino(client):
    dados = {**DADOS_VALIDOS, "sexo": "feminino"}
    resp = client.post("/calculator/tmb", json=dados)
    assert resp.status_code == 200
    tmb = resp.json()["tmb"]
    # Mifflin-St Jeor feminino: (10*70) + (6.25*175) - (5*30) - 161 = 1532.75
    assert abs(tmb - 1532.75) < 1.0


def test_get_retorna_campos_obrigatorios(client, auth_headers):
    resp = client.post("/calculator/get", json=DADOS_VALIDOS, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "tmb" in data
    assert "get" in data
    assert "meta_calorica" in data
    assert "macros_recomendados" in data
    assert data["perfil_salvo"] is True


def test_get_objetivo_perda(client, auth_headers):
    dados = {**DADOS_VALIDOS, "objetivo": "perda_moderada"}
    resp = client.post("/calculator/get", json=dados, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["meta_calorica"] == data["get"] - 500


def test_peso_invalido(client):
    resp = client.post("/calculator/tmb", json={**DADOS_VALIDOS, "peso": 10})
    assert resp.status_code == 422


def test_altura_invalida(client):
    resp = client.post("/calculator/tmb", json={**DADOS_VALIDOS, "altura": 50})
    assert resp.status_code == 422


def test_sexo_invalido(client):
    resp = client.post("/calculator/tmb", json={**DADOS_VALIDOS, "sexo": "outro"})
    assert resp.status_code == 422


def test_atividade_invalida(client):
    resp = client.post("/calculator/tmb", json={**DADOS_VALIDOS, "atividade": 2.5})
    assert resp.status_code == 422


def test_objetivo_invalido(client):
    resp = client.post("/calculator/get", json={**DADOS_VALIDOS, "objetivo": "invalido"}, headers=auth_headers)
    assert resp.status_code == 422


def test_perfil_salvo_apos_get(client, auth_headers):
    client.post("/calculator/get", json=DADOS_VALIDOS, headers=auth_headers)
    resp = client.get("/calculator/perfil", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["perfil"] is not None
