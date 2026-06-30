from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from services.achievements_service import sprawdz_osiagniecia_uzytkownika

router = APIRouter()

@router.get("/uzytkownik/{user_id}/osiagniecia")
def pobierz_osiagniecia(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id_uzytkownik == user_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

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

@router.post("/uzytkownik/{user_id}/osiagniecia/{id_osiagniecia}/odbierz")
def odbierz_punkty_za_osiagniecie(
        user_id: int,
        id_osiagniecia: int,
        db: Session = Depends(get_db)
):
    sprawdz_osiagniecia_uzytkownika(user_id, db)

    zdobyte = db.query(models.ZdobyteOsiagniecie).filter(
        models.ZdobyteOsiagniecie.id_uzytkownik == user_id,
        models.ZdobyteOsiagniecie.id_osiagniecia == id_osiagniecia
    ).first()

    if not zdobyte:
        raise HTTPException(status_code=400, detail="Osiągnięcie nie zostało jeszcze zdobyte")

    if zdobyte.odebrane:
        raise HTTPException(status_code=400, detail="Punkty za to osiągnięcie zostały już odebrane")

    osiagniecie = db.query(models.Osiagniecie).filter(
        models.Osiagniecie.id_osiagniecia == id_osiagniecia
    ).first()

    user = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id_uzytkownik == user_id
    ).first()

    user.punkty += osiagniecie.punkty
    zdobyte.odebrane = True

    db.commit()
    db.refresh(user)

    return {
        "msg": "Odebrano punkty za osiągnięcie",
        "punkty": user.punkty
    }