import models
from auth_jwt import create_access_token


def test_protection_cart(client, seeded_catalog, db_session):
    user1 = seeded_catalog["user"]
    product = seeded_catalog["product"]

    user2 = models.Uzytkownik(
        imie="Krzysztof",
        nazwisko="Kowalski",
        email="krzysztof@example.com",
        haslo="haslo123",
        id_typ_konta=1,
        punkty=0
    )
    db_session.add(user2)
    db_session.commit()
    db_session.refresh(user2)

    user1_token = create_access_token({"user_id": user1.id_uzytkownik})
    user1_headers = {"Authorization": f"Bearer {user1_token}"}

    user2_token = create_access_token({"user_id": user2.id_uzytkownik})
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    res_unauth = client.get(f"/koszyk/{user1.id_uzytkownik}")
    assert res_unauth.status_code == 401

    res_forged = client.get(
        f"/koszyk/{user1.id_uzytkownik}",
        headers={"X-User-Id": str(user1.id_uzytkownik)}
    )
    assert res_forged.status_code == 401

    res_get = client.get(
        f"/koszyk/{user1.id_uzytkownik}",
        headers=user2_headers
    )
    assert res_get.status_code == 403

    res_post = client.post(
        "/koszyk/dodaj",
        json={
            "id_uzytkownik": user1.id_uzytkownik,
            "id_produkt": product.id_produkt,
            "ilosc": 1
        },
        headers=user2_headers
    )
    assert res_post.status_code == 403

    res_own = client.get(
        f"/koszyk/{user1.id_uzytkownik}",
        headers=user1_headers
    )
    assert res_own.status_code == 200


def test_protection_orders_and_coupons(client, seeded_catalog, db_session):
    user1 = seeded_catalog["user"]
    rest = seeded_catalog["restaurant"]
    product = seeded_catalog["product"]

    user2 = models.Uzytkownik(
        imie="Adam",
        nazwisko="Nowak",
        email="adam@example.com",
        haslo="haslo123",
        id_typ_konta=1,
        punkty=0
    )
    db_session.add(user2)
    db_session.commit()
    db_session.refresh(user2)

    user1_token = create_access_token({"user_id": user1.id_uzytkownik})
    user1_headers = {"Authorization": f"Bearer {user1_token}"}

    user2_token = create_access_token({"user_id": user2.id_uzytkownik})
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    res_unauth_order = client.post(
        "/zamowienia/",
        json={
            "id_uzytkownik": user1.id_uzytkownik,
            "id_restauracja": rest.id_restauracja,
            "pozycje": [{"id_produkt": product.id_produkt, "ilosc": 1}],
            "czy_skladka": False,
            "typ_platnosci": "gotowka"
        }
    )
    assert res_unauth_order.status_code == 401

    res_order = client.post(
        "/zamowienia/",
        json={
            "id_uzytkownik": user1.id_uzytkownik,
            "id_restauracja": rest.id_restauracja,
            "pozycje": [
                {
                    "id_produkt": product.id_produkt,
                    "ilosc": 1
                }
            ],
            "czy_skladka": False,
            "typ_platnosci": "gotowka"
        },
        headers=user2_headers
    )
    assert res_order.status_code == 403

    res_hist = client.get(
        f"/uzytkownik/{user1.id_uzytkownik}/zamowienia",
        headers=user2_headers
    )
    assert res_hist.status_code == 403

    res_own_hist = client.get(
        f"/uzytkownik/{user1.id_uzytkownik}/zamowienia",
        headers=user1_headers
    )
    assert res_own_hist.status_code == 200
