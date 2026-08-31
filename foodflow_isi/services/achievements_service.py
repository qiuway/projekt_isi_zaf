from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models


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


def get_user_achievements(db: Session, user_id: int) -> List[dict]:
    user = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id_uzytkownik == user_id
    ).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie istnieje")

    sprawdz_osiagniecia_uzytkownika(user_id, db)

    wszystkie = db.query(models.Osiagniecie).all()
    wynik = []

    for osiagniecie in wszystkie:
        zdobyte = db.query(models.ZdobyteOsiagniecie).filter(
            models.ZdobyteOsiagniecie.id_uzytkownik == user_id,
            models.ZdobyteOsiagniecie.id_osiagniecia == osiagniecie.id_osiagniecia
        ).first()

        wynik.append({
            "id_osiagniecia": osiagniecie.id_osiagniecia,
            "nazwa": osiagniecie.nazwa,
            "opis": osiagniecie.opis,
            "warunek": osiagniecie.warunek,
            "punkty": osiagniecie.punkty,
            "ikona": osiagniecie.ikona,
            "zdobyte": zdobyte is not None,
            "odebrane": zdobyte.odebrane if zdobyte else False
        })

    return wynik


def claim_achievement_reward(db: Session, user_id: int, achievement_id: int) -> dict:
    sprawdz_osiagniecia_uzytkownika(user_id, db)

    zdobyte = db.query(models.ZdobyteOsiagniecie).filter(
        models.ZdobyteOsiagniecie.id_uzytkownik == user_id,
        models.ZdobyteOsiagniecie.id_osiagniecia == achievement_id
    ).first()

    if not zdobyte:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Osiągnięcie nie zostało jeszcze zdobyte"
        )

    if zdobyte.odebrane:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Punkty za to osiągnięcie zostały już odebrane"
        )

    osiagniecie = db.query(models.Osiagniecie).filter(
        models.Osiagniecie.id_osiagniecia == achievement_id
    ).first()
    if not osiagniecie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Osiągnięcie nie istnieje"
        )

    user = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id_uzytkownik == user_id
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Użytkownik nie istnieje"
        )

    user.punkty = (user.punkty or 0) + osiagniecie.punkty
    zdobyte.odebrane = True

    db.commit()
    db.refresh(user)

    return {
        "msg": "Odebrano punkty za osiągnięcie",
        "punkty": user.punkty
    }