"""Testes do diário alimentar."""

from datetime import date

TODAY = str(date.today())

REFEICAO = {
    "nome": "Frango grelhado",
    "calorias": 250.0,
    "proteina": 30.0,
    "carbo": 5.0,
    "gordura": 8.0,
    "categoria": "almoco",
    "data": TODAY,
}


def test_adicionar_refeicao(client, auth_headers):
    resp = client.post("/diario/adicionar", json=REFEICAO, headers=auth_headers)
    assert resp.status_code == 201
    assert "id" in resp.json()


def test_listar_dia(client, auth_headers):
    client.post("/diario/adicionar", json=REFEICAO, headers=auth_headers)
    resp = client.get(f"/diario/dia/{TODAY}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "refeicoes" in data
    assert "totais" in data
    assert len(data["refeicoes"]) >= 1


def test_deletar_refeicao(client, auth_headers):
    add = client.post("/diario/adicionar", json=REFEICAO, headers=auth_headers)
    refeicao_id = add.json()["id"]
    resp = client.delete(f"/diario/refeicao/{refeicao_id}", headers=auth_headers)
    assert resp.status_code == 204


def test_deletar_refeicao_inexistente(client, auth_headers):
    resp = client.delete("/diario/refeicao/999999", headers=auth_headers)
    assert resp.status_code == 404


def test_calorias_negativas(client, auth_headers):
    resp = client.post("/diario/adicionar", json={**REFEICAO, "calorias": -10}, headers=auth_headers)
    assert resp.status_code == 422


def test_categoria_invalida(client, auth_headers):
    resp = client.post("/diario/adicionar", json={**REFEICAO, "categoria": "pizza"}, headers=auth_headers)
    assert resp.status_code == 422


def test_data_invalida(client, auth_headers):
    resp = client.post("/diario/adicionar", json={**REFEICAO, "data": "32-13-2025"}, headers=auth_headers)
    assert resp.status_code == 422
