import models
from services.achievements_service import sprawdz_osiagniecia_uzytkownika


def test_osiagniecie_profil_uzupelniony_zostaje_przyznane(db_session):
    user = models.Uzytkownik(
        imie="Jan",
        nazwisko="Kowalski",
        email="jan@example.com",
        haslo="test123",
        adres="Testowa 1",
        id_typ_konta=1,
    )
    achievement = models.Osiagniecie(
        nazwa="Uzupełniony profil",
        opis="Test",
        warunek="profil_uzupelniony",
        punkty=10,
        ikona="🏆",
    )
    db_session.add_all([user, achievement])
    db_session.commit()
    db_session.refresh(user)

    sprawdz_osiagniecia_uzytkownika(user.id_uzytkownik, db_session)

    zdobyte = db_session.query(models.ZdobyteOsiagniecie).filter_by(
        id_uzytkownik=user.id_uzytkownik,
        id_osiagniecia=achievement.id_osiagniecia,
    ).first()

    assert zdobyte is not None
    assert zdobyte.odebrane is False


def test_osiagniecie_nie_dubluje_sie_po_ponownym_sprawdzeniu(db_session):
    user = models.Uzytkownik(
        imie="Jan",
        nazwisko="Kowalski",
        email="jan@example.com",
        haslo="test123",
        adres="Testowa 1",
        id_typ_konta=1,
    )
    achievement = models.Osiagniecie(
        nazwa="Uzupełniony profil",
        opis="Test",
        warunek="profil_uzupelniony",
        punkty=10,
        ikona="🏆",
    )
    db_session.add_all([user, achievement])
    db_session.commit()
    db_session.refresh(user)

    sprawdz_osiagniecia_uzytkownika(user.id_uzytkownik, db_session)
    sprawdz_osiagniecia_uzytkownika(user.id_uzytkownik, db_session)

    liczba = db_session.query(models.ZdobyteOsiagniecie).filter_by(
        id_uzytkownik=user.id_uzytkownik,
        id_osiagniecia=achievement.id_osiagniecia,
    ).count()

    assert liczba == 1