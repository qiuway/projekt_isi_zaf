import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter()

@router.post("/koszyk/dodaj")
def dodaj_do_koszyka(dane: schemas.DodajDoKoszyka, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.id_uzytkownik == dane.id_uzytkownik
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    produkt = db.query(models.Produkt).filter(
        models.Produkt.id_produkt == dane.id_produkt
    ).first()

    if not produkt:
        raise HTTPException(status_code=404, detail="Produkt nie istnieje")

    if not produkt.dostepny:
        raise HTTPException(status_code=400, detail="Produkt jest niedostępny")

    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.id_uzytkownik == dane.id_uzytkownik
    ).first()

    if not koszyk:
        koszyk = models.Koszyk(id_uzytkownik=dane.id_uzytkownik)
        db.add(koszyk)
        db.commit()
        db.refresh(koszyk)

    pozycja = db.query(models.PozycjaWKoszyku).filter(
        models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk,
        models.PozycjaWKoszyku.id_produkt == dane.id_produkt
    ).first()

    if pozycja:
        pozycja.ilosc += dane.ilosc
    else:
        pozycja = models.PozycjaWKoszyku(
            id_koszyk=koszyk.id_koszyk,
            id_produkt=dane.id_produkt,
            ilosc=dane.ilosc
        )
        db.add(pozycja)

    db.commit()

    return {"msg": "Dodano produkt do koszyka"}

@router.get("/koszyk/{id_uzytkownik}")
def pobierz_koszyk(id_uzytkownik: int, db: Session = Depends(get_db)):
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.id_uzytkownik == id_uzytkownik
    ).first()

    if not koszyk:
        return {"pozycje": [], "suma": 0}

    pozycje = []
    suma = 0

    for pozycja in koszyk.pozycje:
        produkt = pozycja.produkt
        cena = float(produkt.cena)
        cena_calkowita = cena * pozycja.ilosc
        suma += cena_calkowita

        pozycje.append({
            "id_pozycja_koszyka": pozycja.id_pozycja_koszyka,
            "id_produkt": produkt.id_produkt,
            "nazwa": produkt.nazwa,
            "cena": cena,
            "ilosc": pozycja.ilosc,
            "cena_calkowita": cena_calkowita
        })

    return {"pozycje": pozycje, "suma": suma}

@router.put("/koszyk/aktualizuj")
def aktualizuj_koszyk(dane: schemas.AktualizujKoszyk, db: Session = Depends(get_db)):
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.id_uzytkownik == dane.id_uzytkownik
    ).first()

    if not koszyk:
        raise HTTPException(status_code=404, detail="Koszyk nie istnieje")

    pozycja = db.query(models.PozycjaWKoszyku).filter(
        models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk,
        models.PozycjaWKoszyku.id_produkt == dane.id_produkt
    ).first()

    if not pozycja:
        raise HTTPException(status_code=404, detail="Produktu nie ma w koszyku")

    if dane.ilosc <= 0:
        db.delete(pozycja)
    else:
        pozycja.ilosc = dane.ilosc

    db.commit()

    return {"msg": "Zaktualizowano koszyk"}

stripe.api_key = "sk_test_51TnE2bCBya6caqe3EjiviLotapIDcRGX4lJtu6WJ5tC6DbC8yGgOGC35T1haLmcZgaoGoNjuSSpmxkDtWUxgvcY500KUKDTkrX"

class PaymentIntentRequest(BaseModel):
    amount: float