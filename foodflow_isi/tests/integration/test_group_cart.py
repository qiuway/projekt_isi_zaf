import models
from auth_jwt import create_access_token


def test_group_cart_full_flow(client, seeded_catalog, db_session):
    host = models.Uzytkownik(
        imie="Kamil",
        nazwisko="Host",
        email="kamil_host@test.com",
        haslo="test1234",
        id_typ_konta=1,
        punkty=100
    )
    guest = models.Uzytkownik(
        imie="Jan",
        nazwisko="Kowalski",
        email="jankowalski@test.com",
        haslo="test1234",
        id_typ_konta=1,
        punkty=50
    )
    db_session.add_all([host, guest])
    db_session.commit()
    db_session.refresh(host)
    db_session.refresh(guest)

    host_token = create_access_token({"user_id": host.id_uzytkownik, "email": host.email, "role": 1})
    guest_token = create_access_token({"user_id": guest.id_uzytkownik, "email": guest.email, "role": 1})

    host_headers = {"Authorization": f"Bearer {host_token}"}
    guest_headers = {"Authorization": f"Bearer {guest_token}"}

    res_create = client.post("/koszyk/grupa/utworz", headers=host_headers)
    assert res_create.status_code == 200
    data_group = res_create.json()
    assert "kod_grupy" in data_group
    kod_grupy = data_group["kod_grupy"]
    assert kod_grupy.startswith("FF-")
    assert data_group["is_group"] is True
    assert len(data_group["uczestnicy"]) == 1
    assert data_group["uczestnicy"][0]["email"] == host.email

    res_join = client.post("/koszyk/grupa/dolacz", json={"kod_grupy": kod_grupy}, headers=guest_headers)
    assert res_join.status_code == 200
    data_joined = res_join.json()
    assert len(data_joined["uczestnicy"]) == 2

    product_id = seeded_catalog["product"].id_produkt
    res_add_host = client.post(
        f"/koszyk/grupa/{kod_grupy}/dodaj",
        json={"id_produkt": product_id, "ilosc": 1},
        headers=host_headers
    )
    assert res_add_host.status_code == 200

    res_add_guest = client.post(
        f"/koszyk/grupa/{kod_grupy}/dodaj",
        json={"id_produkt": product_id, "ilosc": 2},
        headers=guest_headers
    )
    assert res_add_guest.status_code == 200

    res_get = client.get(f"/koszyk/grupa/{kod_grupy}", headers=host_headers)
    assert res_get.status_code == 200
    cart_state = res_get.json()
    assert len(cart_state["pozycje"]) == 2
    autorzy = [p["dodane_przez"]["id_uzytkownik"] for p in cart_state["pozycje"]]
    assert host.id_uzytkownik in autorzy
    assert guest.id_uzytkownik in autorzy

    res_private_cart = client.get(f"/koszyk/{host.id_uzytkownik}", headers=host_headers)
    assert res_private_cart.status_code == 200
    assert len(res_private_cart.json()["pozycje"]) == 0

    res_guest_order = client.post("/zamowienia/", json={
        "id_uzytkownik": guest.id_uzytkownik,
        "id_restauracja": seeded_catalog["restaurant"].id_restauracja,
        "pozycje": [
            {"id_produkt": product_id, "ilosc": 3}
        ],
        "czy_skladka": True,
        "uczestnicy_skladki": [
            {"id_uzytkownik": host.id_uzytkownik, "kwota_deklarowana": 50.0},
            {"id_uzytkownik": guest.id_uzytkownik, "kwota_deklarowana": 100.0}
        ],
        "typ_platnosci": "karta"
    }, headers=guest_headers)
    assert res_guest_order.status_code == 403

    res_order = client.post("/zamowienia/", json={
        "id_uzytkownik": host.id_uzytkownik,
        "id_restauracja": seeded_catalog["restaurant"].id_restauracja,
        "pozycje": [
            {"id_produkt": product_id, "ilosc": 3}
        ],
        "czy_skladka": True,
        "uczestnicy_skladki": [
            {"id_uzytkownik": host.id_uzytkownik, "kwota_deklarowana": 50.0},
            {"id_uzytkownik": guest.id_uzytkownik, "kwota_deklarowana": 100.0}
        ],
        "typ_platnosci": "karta"
    }, headers=host_headers)
    assert res_order.status_code == 200
    order_data = res_order.json()
    order_id = order_data["id_zamowienia"]
    assert order_data["czy_skladka"] is True

    res_settlement = client.get(f"/zamowienia/{order_id}/rozliczenie", headers=guest_headers)
    assert res_settlement.status_code == 200
    settlement = res_settlement.json()
    assert settlement["id_zamowienia"] == order_id
    assert settlement["twoja_kwota"] == 100.0
    assert settlement["twoje_czy_oplacone"] is False
    assert len(settlement["osoby_placace"]) == 2

    res_toggle = client.put(
        f"/zamowienia/{order_id}/rozliczenie/{guest.id_uzytkownik}/status-oplacenia",
        headers=host_headers
    )
    assert res_toggle.status_code == 200
    assert res_toggle.json()["czy_oplacone"] is True

    res_settlement_2 = client.get(f"/zamowienia/{order_id}/rozliczenie", headers=guest_headers)
    assert res_settlement_2.status_code == 200
    assert res_settlement_2.json()["twoje_czy_oplacone"] is True


def test_cart_isolation_and_replace(client, seeded_catalog, db_session):
    user = models.Uzytkownik(
        imie="Tester",
        nazwisko="Koszyka",
        email="tester_cart@test.com",
        haslo="test1234",
        id_typ_konta=1
    )
    owner = seeded_catalog["user"]
    rest2 = models.Restauracja(nazwa="Restauracja 2", czynne=True, id_uzytkownik=owner.id_uzytkownik)
    db_session.add_all([user, rest2])
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(rest2)

    cat = seeded_catalog["category"]
    prod2 = models.Produkt(
        id_restauracja=rest2.id_restauracja,
        id_kategoria=cat.id_kategoria,
        nazwa="Burger 2",
        cena=25.0,
        dostepny=True
    )
    db_session.add(prod2)
    db_session.commit()
    db_session.refresh(prod2)

    user_token = create_access_token({"user_id": user.id_uzytkownik, "email": user.email, "role": 1})
    headers = {"Authorization": f"Bearer {user_token}"}

    prod1_id = seeded_catalog["product"].id_produkt
    res1 = client.post("/koszyk/dodaj", json={"id_uzytkownik": user.id_uzytkownik, "id_produkt": prod1_id, "ilosc": 1}, headers=headers)
    assert res1.status_code == 200

    res_group = client.post("/koszyk/grupa/utworz", headers=headers)
    assert res_group.status_code == 200
    kod_grupy = res_group.json()["kod_grupy"]

    res_add_g = client.post(f"/koszyk/grupa/{kod_grupy}/dodaj", json={"id_produkt": prod2.id_produkt, "ilosc": 1}, headers=headers)
    assert res_add_g.status_code == 200

    res_private = client.get(f"/koszyk/{user.id_uzytkownik}", headers=headers)
    assert res_private.status_code == 200
    assert len(res_private.json()["pozycje"]) == 1
    assert res_private.json()["pozycje"][0]["id_produkt"] == prod1_id

    res_group_cart = client.get(f"/koszyk/grupa/{kod_grupy}", headers=headers)
    assert res_group_cart.status_code == 200
    assert len(res_group_cart.json()["pozycje"]) == 1
    assert res_group_cart.json()["pozycje"][0]["id_produkt"] == prod2.id_produkt

    res_add_multi = client.post("/koszyk/dodaj", json={"id_uzytkownik": user.id_uzytkownik, "id_produkt": prod2.id_produkt, "ilosc": 2}, headers=headers)
    assert res_add_multi.status_code == 200
    res_private_after = client.get(f"/koszyk/{user.id_uzytkownik}", headers=headers)
    assert len(res_private_after.json()["pozycje"]) == 2

    res_order_multi = client.post("/zamowienia/", json={
        "id_uzytkownik": user.id_uzytkownik,
        "pozycje": [
            {"id_produkt": prod1_id, "ilosc": 1},
            {"id_produkt": prod2.id_produkt, "ilosc": 2}
        ],
        "czy_skladka": False,
        "typ_platnosci": "karta"
    }, headers=headers)
    assert res_order_multi.status_code == 200

    res_order_group_multi = client.post("/zamowienia/", json={
        "id_uzytkownik": user.id_uzytkownik,
        "pozycje": [
            {"id_produkt": prod1_id, "ilosc": 1},
            {"id_produkt": prod2.id_produkt, "ilosc": 2}
        ],
        "czy_skladka": True,
        "uczestnicy_skladki": [
            {"id_uzytkownik": user.id_uzytkownik, "kwota_deklarowana": 60.0}
        ],
        "typ_platnosci": "karta"
    }, headers=headers)
    assert res_order_group_multi.status_code == 200
    group_order_data = res_order_group_multi.json()
    assert group_order_data["czy_skladka"] is True

    res_settle = client.get(f"/zamowienia/{group_order_data['id_zamowienia']}/rozliczenie", headers=headers)
    assert res_settle.status_code == 200
    assert len(res_settle.json()["osoby_placace"]) >= 1

