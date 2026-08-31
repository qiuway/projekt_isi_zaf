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


def test_dodawanie_i_aktualizacja_koszyka(client, seeded_catalog, auth_headers):
    user_id = seeded_catalog["user"].id_uzytkownik
    product_id = seeded_catalog["product"].id_produkt

    add_response = client.post("/koszyk/dodaj", json={
        "id_uzytkownik": user_id,
        "id_produkt": product_id,
        "ilosc": 2
    }, headers=auth_headers)

    assert add_response.status_code == 200

    cart_response = client.get(f"/koszyk/{user_id}", headers=auth_headers)
    assert cart_response.status_code == 200
    assert len(cart_response.json()["pozycje"]) == 1
    assert cart_response.json()["pozycje"][0]["ilosc"] == 2

    update_response = client.put("/koszyk/aktualizuj", json={
        "id_uzytkownik": user_id,
        "id_produkt": product_id,
        "ilosc": 0
    }, headers=auth_headers)

    assert update_response.status_code == 200

    empty_cart = client.get(f"/koszyk/{user_id}", headers=auth_headers)
    assert empty_cart.status_code == 200
    assert empty_cart.json()["pozycje"] == []


def test_zlozenie_zamowienia(client, seeded_catalog, auth_headers):
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
    }, headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "Sukces"
    assert "id_zamowienia" in response.json()


def test_zmiana_statusu_zamowienia(client, seeded_catalog, auth_headers):
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
    }, headers=auth_headers)

    assert order_response.status_code == 200

    order_id = order_response.json()["id_zamowienia"]

    reject_response = client.put(f"/zamowienia/{order_id}/odrzuc", headers=auth_headers)

    assert reject_response.status_code == 200

def test_upload_zdjecie_produktu(client, seeded_catalog, db_session, auth_headers):
    product_id = seeded_catalog["product"].id_produkt

    fake_img = b"\xff\xd8\xff\xe0\x00\x10JFIF"  # jpeg headers
    res_upload = client.post(
        f"/produkty/{product_id}/zdjecie",
        files={"file": ("pizza.jpg", fake_img, "image/jpeg")},
        headers=auth_headers
    )
    assert res_upload.status_code == 200
    assert "zdjecie_url" in res_upload.json()
    assert "/static/products/prod_" in res_upload.json()["zdjecie_url"]


def test_usuwanie_produktu(client, seeded_catalog, db_session, auth_headers):
    product_id = seeded_catalog["product"].id_produkt

    response = client.delete(f"/produkty/{product_id}", headers=auth_headers)

    assert response.status_code == 200

    deleted_product = db_session.query(models.Produkt).filter(
        models.Produkt.id_produkt == product_id
    ).first()

    assert deleted_product is None


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_platnosci_stripe_create_and_verify(client):
    res_create = client.post("/create-payment-intent", json={"amount": 49.99})
    assert res_create.status_code == 200
    data = res_create.json()
    assert "client_secret" in data
    assert "payment_intent_id" in data

    res_verify = client.get(f"/payments/verify/{data['payment_intent_id']}")
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["status"] == "succeeded"


def test_akceptacja_platnosci_offline(client, seeded_catalog, auth_headers):
    user_id = seeded_catalog["user"].id_uzytkownik
    rest_id = seeded_catalog["restaurant"].id_restauracja
    product_id = seeded_catalog["product"].id_produkt

    order_response = client.post("/zamowienia/", json={
        "id_uzytkownik": user_id,
        "id_restauracja": rest_id,
        "pozycje": [{"id_produkt": product_id, "ilosc": 1}],
        "czy_skladka": False,
        "typ_platnosci": "offline",
        "id_posiadany_kupon": None
    }, headers=auth_headers)
    assert order_response.status_code == 200
    order_id = order_response.json()["id_zamowienia"]

    accept_response = client.put(f"/zamowienia/{order_id}/zaakceptuj-platnosc", headers=auth_headers)
    assert accept_response.status_code == 200
    assert accept_response.json()["msg"] == "Płatność zatwierdzona"


def test_kupony_zakup_i_pobranie(client, seeded_catalog, db_session, auth_headers):
    user = seeded_catalog["user"]
    kupon = models.KuponSklep(
        nazwa="Rabat 10 PLN",
        opis="Test kuponu",
        koszt_punktowy=50,
        wartosc_znizki="10 zł",
        ikona="🏷️"
    )
    db_session.add(kupon)
    db_session.commit()
    db_session.refresh(kupon)

    res_kupony = client.get("/kupony/")
    assert res_kupony.status_code == 200
    assert len(res_kupony.json()) >= 1

    res_kup = client.post("/kupony/kup", json={
        "id_uzytkownik": user.id_uzytkownik,
        "id_kupon": kupon.id_kupon
    }, headers=auth_headers)
    assert res_kup.status_code == 200
    assert res_kup.json()["punkty"] == 50

    res_moje = client.get(f"/uzytkownik/{user.id_uzytkownik}/kupony", headers=auth_headers)
    assert res_moje.status_code == 200
    assert len(res_moje.json()) == 1
    assert res_moje.json()[0]["id_kupon"] == kupon.id_kupon


def test_profil_uzytkownika_nie_zwraca_hasla(client, seeded_catalog, auth_headers):
    user = seeded_catalog["user"]
    res = client.get(f"/uzytkownik/{user.id_uzytkownik}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "haslo" not in data
    assert "password" not in data
    assert data["email"] == "jan@example.com"


def test_upload_avatara_odrzuca_zle_rozszerzenie(client, seeded_catalog, auth_headers):
    user = seeded_catalog["user"]
    response = client.post(
        f"/uzytkownik/{user.id_uzytkownik}/avatar",
        files={"file": ("malicious.exe", b"dummy payload", "application/octet-stream")},
        headers=auth_headers
    )
    assert response.status_code == 400
    assert "Niedozwolony format" in response.json()["detail"]


def test_jwt_autoryzacja_me_profil(client):
    client.post("/rejestracja", json={
        "imie": "Ewa",
        "nazwisko": "Kowalska",
        "email": "ewa@example.com",
        "haslo": "tajnehaslo123",
        "is_owner": False
    })
    login_res = client.post("/logowanie", json={
        "email": "ewa@example.com",
        "haslo": "tajnehaslo123"
    })
    token = login_res.json()["access_token"]
    assert token is not None

    unauth = client.get("/uzytkownik/me/profil")
    assert unauth.status_code == 401

    auth = client.get("/uzytkownik/me/profil", headers={"Authorization": f"Bearer {token}"})
    assert auth.status_code == 200
    assert auth.json()["email"] == "ewa@example.com"