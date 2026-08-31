from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from services.achievements_service import sprawdz_osiagniecia_uzytkownika


def get_all_store_coupons(db: Session) -> List[models.KuponSklep]:
    return db.query(models.KuponSklep).order_by(models.KuponSklep.koszt_punktowy.asc()).all()


def create_store_coupon(db: Session, dane: schemas.KuponCreateUpdate) -> models.KuponSklep:
    nowy_kupon = models.KuponSklep(
        nazwa=dane.nazwa,
        opis=dane.opis,
        koszt_punktowy=dane.koszt_punktowy,
        wartosc_znizki=dane.wartosc_znizki,
        ikona=dane.ikona or "🏷️"
    )
    db.add(nowy_kupon)
    db.commit()
    db.refresh(nowy_kupon)
    return nowy_kupon


def update_store_coupon(db: Session, coupon_id: int, dane: schemas.KuponCreateUpdate) -> models.KuponSklep:
    kupon = db.query(models.KuponSklep).filter(models.KuponSklep.id_kupon == coupon_id).first()
    if not kupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kupon nie istnieje.")

    kupon.nazwa = dane.nazwa
    kupon.opis = dane.opis
    kupon.koszt_punktowy = dane.koszt_punktowy
    kupon.wartosc_znizki = dane.wartosc_znizki
    if dane.ikona:
        kupon.ikona = dane.ikona

    db.commit()
    db.refresh(kupon)
    return kupon


def delete_store_coupon(db: Session, coupon_id: int) -> dict:
    kupon = db.query(models.KuponSklep).filter(models.KuponSklep.id_kupon == coupon_id).first()
    if not kupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kupon nie istnieje.")

    db.query(models.PosiadanyKupon).filter(models.PosiadanyKupon.id_kupon == coupon_id).delete()
    db.delete(kupon)
    db.commit()
    return {"msg": "Kupon ze sklepu został pomyślnie usunięty."}


def buy_coupon_with_points(db: Session, dane: schemas.ZakupKuponu) -> dict:
    uzytkownik = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == dane.id_uzytkownik).first()
    if not uzytkownik:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie istnieje.")

    kupon = db.query(models.KuponSklep).filter(models.KuponSklep.id_kupon == dane.id_kupon).first()
    if not kupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kupon nie istnieje.")

    if (uzytkownik.punkty or 0) < kupon.koszt_punktowy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Niewystarczająca liczba punktów. Wymagane: {kupon.koszt_punktowy}, Posiadane: {uzytkownik.punkty or 0}"
        )

    uzytkownik.punkty = (uzytkownik.punkty or 0) - kupon.koszt_punktowy

    posiadany = models.PosiadanyKupon(
        id_uzytkownik=dane.id_uzytkownik,
        id_kupon=dane.id_kupon,
        wykorzystany=False
    )
    db.add(posiadany)
    db.commit()
    db.refresh(uzytkownik)

    sprawdz_osiagniecia_uzytkownika(uzytkownik.id_uzytkownik, db)

    return {
        "msg": "Kupon zakupiony pomyślnie!",
        "punkty": uzytkownik.punkty
    }


def get_user_active_coupons(db: Session, user_id: int) -> List[dict]:
    posiadane = db.query(models.PosiadanyKupon).filter(
        models.PosiadanyKupon.id_uzytkownik == user_id,
        models.PosiadanyKupon.wykorzystany == False
    ).all()

    wyniki = []
    for pk in posiadane:
        if pk.kupon:
            wyniki.append({
                "id_posiadany_kupon": pk.id_posiadany_kupon,
                "id_kupon": pk.kupon.id_kupon,
                "nazwa": pk.kupon.nazwa,
                "opis": pk.kupon.opis,
                "wartosc_znizki": pk.kupon.wartosc_znizki,
                "ikona": pk.kupon.ikona
            })
    return wyniki
