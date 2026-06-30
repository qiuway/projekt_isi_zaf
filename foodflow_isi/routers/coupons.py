from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.achievements_service import sprawdz_osiagniecia_uzytkownika

router = APIRouter()

@router.get("/kupony/")
def pobierz_kupony(db: Session = Depends(get_db)):
    kupony = db.query(models.KuponSklep).all()
    return kupony


@router.post("/kupony/kup")
def kup_kupon(dane: schemas.ZakupKuponu, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id_uzytkownik == dane.id_uzytkownik
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")

    kupon = db.query(models.KuponSklep).filter(
        models.KuponSklep.id_kupon == dane.id_kupon
    ).first()

    if not kupon:
        raise HTTPException(status_code=404, detail="Nie znaleziono kuponu")

    if user.punkty < kupon.koszt_punktowy:
        raise HTTPException(status_code=400, detail="Masz za mało punktów")

    user.punkty -= kupon.koszt_punktowy

    posiadany_kupon = models.PosiadanyKupon(
        id_uzytkownik=user.id_uzytkownik,
        id_kupon=kupon.id_kupon,
        wykorzystany=False
    )

    db.add(posiadany_kupon)
    db.commit()
    db.refresh(user)
    sprawdz_osiagniecia_uzytkownika(user.id_uzytkownik, db)

    return {
        "msg": "Kupiono nagrodę",
        "punkty": user.punkty
    }


@router.get("/uzytkownik/{user_id}/kupony")
def pobierz_kupony_uzytkownika(user_id: int, db: Session = Depends(get_db)):
    posiadane_kupony = db.query(models.PosiadanyKupon).filter(
        models.PosiadanyKupon.id_uzytkownik == user_id,
        models.PosiadanyKupon.wykorzystany == False
    ).all()

    wynik = []

    for posiadany in posiadane_kupony:
        kupon = posiadany.kupon

        wynik.append({
            "id_posiadany_kupon": posiadany.id_posiadany_kupon,
            "id_kupon": kupon.id_kupon,
            "nazwa": kupon.nazwa,
            "opis": kupon.opis,
            "koszt_punktowy": kupon.koszt_punktowy,
            "wartosc_znizki": kupon.wartosc_znizki,
            "ikona": kupon.ikona,
            "wykorzystany": posiadany.wykorzystany
        })

    return wynik