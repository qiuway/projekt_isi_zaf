import models
from auth_jwt import create_access_token


def test_restaurant_reviews_lifecycle(client, seeded_catalog, db_session, auth_headers):
    rest_id = seeded_catalog["restaurant"].id_restauracja
    user = seeded_catalog["user"]

    res_init = client.get(f"/restauracja/{rest_id}/opinie")
    assert res_init.status_code == 200
    data_init = res_init.json()
    assert data_init["liczba_opinii"] == 0
    assert data_init["srednia_ocen"] == 0.0

    res_add = client.post(f"/restauracja/{rest_id}/opinie", json={
        "id_uzytkownik": user.id_uzytkownik,
        "ocena": 5,
        "komentarz": "Doskonałe jedzenie i błyskawiczna dostawa!"
    }, headers=auth_headers)
    assert res_add.status_code == 200
    assert "id_opinia" in res_add.json()

    user2 = models.Uzytkownik(
        imie="Katarzyna",
        nazwisko="Zielińska",
        email="kasia@example.com",
        haslo="haslo123",
        id_typ_konta=1,
        punkty=0
    )
    db_session.add(user2)
    db_session.commit()
    db_session.refresh(user2)

    user2_token = create_access_token({"user_id": user2.id_uzytkownik})
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    res_add2 = client.post(f"/restauracja/{rest_id}/opinie", json={
        "id_uzytkownik": user2.id_uzytkownik,
        "ocena": 4,
        "komentarz": "Bardzo smacznie, polecam."
    }, headers=user2_headers)
    assert res_add2.status_code == 200

    res_summary = client.get(f"/restauracja/{rest_id}/opinie")
    assert res_summary.status_code == 200
    summary_data = res_summary.json()
    assert summary_data["liczba_opinii"] == 2
    assert summary_data["srednia_ocen"] == 4.5
    assert len(summary_data["opinie"]) == 2

    user2_review = [op for op in summary_data["opinie"] if op["id_uzytkownik"] == user2.id_uzytkownik][0]
    res_del = client.delete(
        f"/opinie/{user2_review['id_opinia']}",
        headers=user2_headers
    )
    assert res_del.status_code == 200

    res_after_del = client.get(f"/restauracja/{rest_id}/opinie")
    assert res_after_del.status_code == 200
    assert res_after_del.json()["liczba_opinii"] == 1
