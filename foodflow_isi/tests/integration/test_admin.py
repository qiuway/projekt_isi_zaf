import models
from auth_jwt import create_access_token


def test_admin_endpoints_require_admin_role(client, seeded_catalog):
    user = seeded_catalog["user"]
    token_user = create_access_token(data={
        "user_id": user.id_uzytkownik,
        "email": user.email,
        "role": 1
    })

    res = client.get("/admin/uzytkownicy", headers={"Authorization": f"Bearer {token_user}"})
    assert res.status_code == 403

    res_stats = client.get("/admin/statystyki", headers={"Authorization": f"Bearer {token_user}"})
    assert res_stats.status_code == 403


def test_admin_get_users_change_role_and_stats(client, seeded_catalog, db_session):
    admin = models.Uzytkownik(
        imie="Admin",
        nazwisko="Systemowy",
        email="superadmin@foodflow.pl",
        haslo="admin123",
        id_typ_konta=3,
        punkty=1000
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    token_admin = create_access_token(data={
        "user_id": admin.id_uzytkownik,
        "email": admin.email,
        "role": 3
    })

    headers = {"Authorization": f"Bearer {token_admin}"}

    res_users = client.get("/admin/uzytkownicy", headers=headers)
    assert res_users.status_code == 200
    users_data = res_users.json()
    assert len(users_data) >= 2

    user = seeded_catalog["user"]
    res_role = client.put(
        f"/admin/uzytkownicy/{user.id_uzytkownik}/rola",
        json={"id_typ_konta": 2},
        headers=headers
    )
    assert res_role.status_code == 200
    assert res_role.json()["id_typ_konta"] == 2

    res_stats = client.get("/admin/statystyki", headers=headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert "total_users" in stats
    assert "total_orders" in stats
    assert "total_revenue" in stats
    assert "total_restaurants" in stats
    assert stats["total_users"] >= 2


def test_admin_manage_store_coupons(client, db_session):
    admin = models.Uzytkownik(
        imie="Admin",
        nazwisko="Kupony",
        email="admin_kupony@foodflow.pl",
        haslo="admin123",
        id_typ_konta=3,
        punkty=1000
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)

    token_admin = create_access_token(data={
        "user_id": admin.id_uzytkownik,
        "email": admin.email,
        "role": 3
    })
    headers = {"Authorization": f"Bearer {token_admin}"}

    res_create = client.post(
        "/admin/kupony",
        json={
            "nazwa": "Super Rabat 20%",
            "opis": "Zniżka 20% na całe zamówienie",
            "koszt_punktowy": 120,
            "wartosc_znizki": "20%",
            "ikona": "🎁"
        },
        headers=headers
    )
    assert res_create.status_code == 200
    coupon_data = res_create.json()
    assert coupon_data["nazwa"] == "Super Rabat 20%"
    assert coupon_data["koszt_punktowy"] == 120
    coupon_id = coupon_data["id_kupon"]

    res_update = client.put(
        f"/admin/kupony/{coupon_id}",
        json={
            "nazwa": "Super Rabat 25%",
            "opis": "Zniżka 25% na całe zamówienie",
            "koszt_punktowy": 150,
            "wartosc_znizki": "25%",
            "ikona": "🎉"
        },
        headers=headers
    )
    assert res_update.status_code == 200
    assert res_update.json()["nazwa"] == "Super Rabat 25%"
    assert res_update.json()["koszt_punktowy"] == 150

    res_del = client.delete(f"/admin/kupony/{coupon_id}", headers=headers)
    assert res_del.status_code == 200

