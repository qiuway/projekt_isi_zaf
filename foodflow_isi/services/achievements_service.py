import models
from sqlalchemy.orm import Session


def sprawdz_osiagniecia_uzytkownika(user_id: int, db: Session):
    user = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id_uzytkownik == user_id
    ).first()

    if not user:
        return

    osiagniecia = db.query(models.Osiagniecie).all()

    for osiagniecie in osiagniecia:
        juz_istnieje = db.query(models.ZdobyteOsiagniecie).filter(
            models.ZdobyteOsiagniecie.id_uzytkownik == user_id,
            models.ZdobyteOsiagniecie.id_osiagniecia == osiagniecie.id_osiagniecia
        ).first()

        if juz_istnieje:
            continue

        warunek_spelniony = False

        if osiagniecie.warunek == "pierwszy_kupon":
            liczba = db.query(models.PosiadanyKupon).filter(
                models.PosiadanyKupon.id_uzytkownik == user_id
            ).count()
            warunek_spelniony = liczba >= 1

        elif osiagniecie.warunek == "profil_uzupelniony":
            warunek_spelniony = bool(user.imie and user.nazwisko and user.email and user.adres)

        elif osiagniecie.warunek == "avatar_dodany":
            warunek_spelniony = bool(user.zdjecie_profilowe)

        elif osiagniecie.warunek == "pierwsze_zamowienie":
            liczba = db.query(models.Zamowienie).filter(
                models.Zamowienie.id_uzytkownik == user_id
            ).count()
            warunek_spelniony = liczba >= 1

        elif osiagniecie.warunek == "trzy_zamowienia":
            liczba = db.query(models.Zamowienie).filter(
                models.Zamowienie.id_uzytkownik == user_id
            ).count()
            warunek_spelniony = liczba >= 3

        if warunek_spelniony:
            zdobyte = models.ZdobyteOsiagniecie(
                id_uzytkownik=user_id,
                id_osiagniecia=osiagniecie.id_osiagniecia,
                odebrane=False
            )
            db.add(zdobyte)

    db.commit()