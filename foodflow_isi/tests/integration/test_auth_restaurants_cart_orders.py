import models


def test_rejestracja_i_logowanie(client):
    response = client.post("/rejestracja", json={
        "imie": "Adam",
        "nazwisko": "Nowak",
        "email": "adam@example.com",
        "haslo": "test123",
        "is_owner": True
    })

    assert response.status_code == 200

    login = client.post("/logowanie", json={
        "email": "adam@example.com",
        "haslo": "test123"
    })

    assert login.status_code == 200
    assert login.json()["imie"] == "Adam"
    assert "user_id" in login.json()


def test_rejestracja_blokuje_duplikat_emaila(client):
    payload = {
        "imie": "Adam",
        "nazwisko": "Nowak",
        "email": "adam@example.com",
        "haslo": "test123",
        "is_owner": False
    }

    response_1 = client.post("/rejestracja", json=payload)
    response_2 = client.post("/rejestracja", json=payload)

    assert response_1.status_code == 200
    assert response_2.status_code == 400


def test_pobieranie_restauracji_i_produktow(client, seeded_catalog):
    rest_id = seeded_catalog["restaurant"].id_restauracja

    restaurants = client.get("/restauracje/")
    assert restaurants.status_code == 200
    assert len(restaurants.json()) == 1

    products = client.get(f"/restauracja/{rest_id}/produkty")
    assert products.status_code == 200
    assert len(products.json()) == 1
    assert products.json()[0]["nazwa"] == "Burger"


def test_dodawanie_i_aktualizacja_koszyka(client, seeded_catalog):
    user_id = seeded_catalog["user"].id_uzytkownik
    product_id = seeded_catalog["product"].id_produkt

    add_response = client.post("/koszyk/dodaj", json={
        "id_uzytkownik": user_id,
        "id_produkt": product_id,
        "ilosc": 2
    })

    assert add_response.status_code == 200

    cart_response = client.get(f"/koszyk/{user_id}")
    assert cart_response.status_code == 200
    assert len(cart_response.json()["pozycje"]) == 1
    assert cart_response.json()["pozycje"][0]["ilosc"] == 2

    update_response = client.put("/koszyk/aktualizuj", json={
        "id_uzytkownik": user_id,
        "id_produkt": product_id,
        "ilosc": 0
    })

    assert update_response.status_code == 200

    empty_cart = client.get(f"/koszyk/{user_id}")
    assert empty_cart.status_code == 200
    assert empty_cart.json()["pozycje"] == []


def test_zlozenie_zamowienia(client, seeded_catalog):
    user_id = seeded_catalog["user"].id_uzytkownik
    rest_id = seeded_catalog["restaurant"].id_restauracja
    product_id = seeded_catalog["product"].id_produkt

    response = client.post("/zamowienia/", json={
        "id_uzytkownik": user_id,
        "id_restauracja": rest_id,
        "pozycje": [
            {
                "id_produkt": product_id,
                "ilosc": 2
            }
        ],
        "czy_skladka": False,
        "typ_platnosci": "on_delivery",
        "id_posiadany_kupon": None
    })

    assert response.status_code == 200
    assert response.json()["status"] == "Sukces"
    assert "id_zamowienia" in response.json()


def test_zmiana_statusu_zamowienia(client, seeded_catalog):
    user_id = seeded_catalog["user"].id_uzytkownik
    rest_id = seeded_catalog["restaurant"].id_restauracja
    product_id = seeded_catalog["product"].id_produkt

    order_response = client.post("/zamowienia/", json={
        "id_uzytkownik": user_id,
        "id_restauracja": rest_id,
        "pozycje": [
            {
                "id_produkt": product_id,
                "ilosc": 1
            }
        ],
        "czy_skladka": False,
        "typ_platnosci": "offline",
        "id_posiadany_kupon": None
    })

    assert order_response.status_code == 200

    order_id = order_response.json()["id_zamowienia"]

    reject_response = client.put(f"/zamowienia/{order_id}/odrzuc")

    assert reject_response.status_code == 200

def test_usuwanie_produktu(client, seeded_catalog, db_session):
    product_id = seeded_catalog["product"].id_produkt

    response = client.delete(f"/produkty/{product_id}")

    assert response.status_code == 200

    deleted_product = db_session.query(models.Produkt).filter(
        models.Produkt.id_produkt == product_id
    ).first()

    assert deleted_product is None