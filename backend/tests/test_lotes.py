from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def create_lote(client: TestClient, numero: str, preco: float) -> dict[str, object]:
    response = client.post("/lotes", json={"numero": numero, "preco": preco})
    assert response.status_code == 201
    return response.json()


def test_cria_lista_e_busca_lote_preservando_zeros(client: TestClient) -> None:
    created = create_lote(client, "07", 1850.00)

    assert created == {"id": 1, "numero": "07", "preco": 1850.0}
    assert client.post("/lotes", json={"numero": "08", "preco": 100}).status_code == 201

    listing = client.get("/lotes").json()
    assert listing["total"] == 2
    assert [item["numero"] for item in listing["itens"]] == ["08", "07"]

    detail = client.get("/lotes/1")
    assert detail.status_code == 200
    assert detail.json() == created


@pytest.mark.parametrize(
    "payload",
    [
        {"numero": "", "preco": 1},
        {"numero": "   ", "preco": 1},
        {"numero": "A1", "preco": 1},
        {"numero": "07-B", "preco": 1},
        {"numero": "01", "preco": 0},
        {"numero": "01", "preco": -1},
        {"numero": "01", "preco": "não é número"},
        {"numero": "01", "preco": 1.999},
        {"numero": "01", "preco": 100000000},
    ],
)
def test_rejeita_entrada_invalida(client: TestClient, payload: dict[str, object]) -> None:
    response = client.post("/lotes", json=payload)
    assert response.status_code == 422


def test_numero_de_lote_e_unico_apos_remover_espacos(client: TestClient) -> None:
    create_lote(client, " 01 ", 20)

    for duplicate in ("01", " 01 "):
        response = client.post("/lotes", json={"numero": duplicate, "preco": 20})
        assert response.status_code == 409
        assert response.json()["detail"] == "Já existe um lote com este número."

    assert client.post("/lotes", json={"numero": "001", "preco": 20}).status_code == 201


def test_lote_inexistente_retorna_404(client: TestClient) -> None:
    response = client.get("/lotes/99")
    assert response.status_code == 404
    assert response.json()["detail"] == "Lote não encontrado."


def test_paginacao_ordem_e_pagina_sem_resultado(client: TestClient) -> None:
    create_lote(client, "01", 100)
    create_lote(client, "02", 300)
    create_lote(client, "03", 200)

    ascending = client.get("/lotes?pagina=1&por_pagina=2&ordenar=preco&direcao=asc")
    assert ascending.status_code == 200
    assert ascending.json() == {
        "itens": [
            {"id": 1, "numero": "01", "preco": 100.0},
            {"id": 3, "numero": "03", "preco": 200.0},
        ],
        "total": 3,
        "pagina": 1,
        "por_pagina": 2,
        "total_paginas": 2,
    }

    descending = client.get("/lotes?pagina=1&por_pagina=3&ordenar=preco&direcao=desc")
    assert [item["preco"] for item in descending.json()["itens"]] == [300.0, 200.0, 100.0]

    empty_page = client.get("/lotes?pagina=3&por_pagina=2")
    assert empty_page.status_code == 200
    assert empty_page.json() == {
        "itens": [],
        "total": 3,
        "pagina": 3,
        "por_pagina": 2,
        "total_paginas": 2,
    }


def test_rejeita_limite_de_paginacao_invalido(client: TestClient) -> None:
    assert client.get("/lotes?por_pagina=101").status_code == 422
    assert client.get("/lotes?pagina=0").status_code == 422


def test_busca_lote_por_numero_exato(client: TestClient) -> None:
    create_lote(client, "07", 100)
    create_lote(client, "107", 200)
    create_lote(client, "20", 300)

    response = client.get("/lotes?busca=07&ordenar=numero&direcao=asc")

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["pagina"] == 1
    assert response.json()["total_paginas"] == 1
    assert [item["numero"] for item in response.json()["itens"]] == ["07"]


def test_busca_rejeita_caracteres_nao_numericos(client: TestClient) -> None:
    assert client.get("/lotes?busca=A1").status_code == 422
