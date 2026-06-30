from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

import models
import schemas
from database import get_db
from services.achievements_service import sprawdz_osiagniecia_uzytkownika

router = APIRouter()

@router.post("/zamowienia/")
def zloz_zamowienie(dane: schemas.TworzenieZamowienia, db: Session = Depends(get_db)):
    laczna_kwota = 0.0
    pozycje_do_zapisu = []

    if not dane.pozycje:
        raise HTTPException(status_code=400, detail="Koszyk jest pusty.")

    pierwszy_produkt = db.query(models.Produkt).filter(models.Produkt.id_produkt == dane.pozycje[0].id_produkt).first()
    if not pierwszy_produkt:
        raise HTTPException(status_code=400, detail="Produkt nie istnieje w bazie danych.")

    rzeczywiste_id_restauracji = pierwszy_produkt.id_restauracja

    for poz in dane.pozycje:
        produkt = db.query(models.Produkt).filter(
            models.Produkt.id_produkt == poz.id_produkt
        ).first()

        if not produkt or not produkt.dostepny:
            raise HTTPException(status_code=400, detail=f"Produkt '{poz.id_produkt}' jest niedostępny.")

        if produkt.id_restauracja != rzeczywiste_id_restauracji:
            raise HTTPException(status_code=400, detail="Koszyk zawiera produkty z różnych restauracji!")

        wartosc_pozycji = float(produkt.cena) * poz.ilosc
        laczna_kwota += wartosc_pozycji

        pozycje_do_zapisu.append(
            models.PozycjaZamowienia(id_produkt=produkt.id_produkt, ilosc=poz.ilosc, cena=produkt.cena)
        )

    if dane.czy_skladka:
        if not dane.uczestnicy_skladki:
            raise HTTPException(status_code=400, detail="Brak uczestników składki.")

        suma_skladek = sum([u.kwota_deklarowana for u in dane.uczestnicy_skladki])
        if abs(suma_skladek - laczna_kwota) > 0.01:
            raise HTTPException(status_code=400, detail="Suma składek nie pokrywa kwoty zamówienia!")

    kod_zap = str(uuid.uuid4())[:8] if dane.czy_skladka else None

    nowe_zamowienie = models.Zamowienie(
        id_uzytkownik=dane.id_uzytkownik,
        id_restauracja=rzeczywiste_id_restauracji,
        kwota=laczna_kwota,
        kod_zaproszenia=kod_zap
    )
    db.add(nowe_zamowienie)
    db.flush()

    for p_zapis in pozycje_do_zapisu:
        p_zapis.id_zamowienia = nowe_zamowienie.id_zamowienia
        db.add(p_zapis)

    # określamy status płatności na podstawie metody
    if dane.typ_platnosci == "card":
        status_platnosci = "OPŁACONE"
    elif dane.typ_platnosci == "offline":
        status_platnosci = "OCZEKUJĄCA"
    elif dane.typ_platnosci == "on_delivery":
        status_platnosci = "PRZY_ODBIORZE"
    else:
        status_platnosci = "OCZEKUJĄCA"

    nowa_platnosc = models.Platnosc(
        id_zamowienia=nowe_zamowienie.id_zamowienia,
        kwota=laczna_kwota,
        typ=dane.czy_skladka,
        status_platnosci=status_platnosci
    )
    db.add(nowa_platnosc)
    db.flush()

    if dane.czy_skladka:
        for u in dane.uczestnicy_skladki:
            osoba = models.OsobaPlacaca(
                id_platnosc=nowa_platnosc.id_platnosc,
                id_uzytkownik=u.id_uzytkownik,
                kwota=u.kwota_deklarowana,
                czy_oplacone=True
            )
            db.add(osoba)
    else:
        osoba = models.OsobaPlacaca(
            id_platnosc=nowa_platnosc.id_platnosc,
            id_uzytkownik=dane.id_uzytkownik,
            kwota=laczna_kwota,
            czy_oplacone=True
        )
        db.add(osoba)

    if dane.id_posiadany_kupon:
        posiadany_kupon = db.query(models.PosiadanyKupon).filter(
            models.PosiadanyKupon.id_posiadany_kupon == dane.id_posiadany_kupon,
            models.PosiadanyKupon.id_uzytkownik == dane.id_uzytkownik,
            models.PosiadanyKupon.wykorzystany == False
        ).first()

        if not posiadany_kupon:
            raise HTTPException(
                status_code=400,
                detail="Wybrany rabat nie istnieje albo został już użyty"
            )

        posiadany_kupon.wykorzystany = True

    db.commit()
    sprawdz_osiagniecia_uzytkownika(dane.id_uzytkownik, db)

    return {
        "status": "Sukces",
        "id_zamowienia": nowe_zamowienie.id_zamowienia,
        "kwota_total": laczna_kwota,
        "kod_zaproszenia": kod_zap
    }

@router.put("/zamowienia/{zam_id}/przyjmij")
def przyjmij_zamowienie(zam_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == zam_id).first()
    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")
    platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == zam_id).first()
    if not platnosc:
        raise HTTPException(status_code=400, detail="Brak płatności")
    if platnosc.status_platnosci not in ["OPŁACONE", "ZAAKCEPTOWANA", "PRZY_ODBIORZE"]:
        raise HTTPException(status_code=400, detail="Płatność nie została zatwierdzona")
    if zamowienie.status_zamowienia != "ZŁOŻONE":
        raise HTTPException(status_code=400, detail="Zamówienie ma już inny status")
    zamowienie.status_zamowienia = "W_REALIZACJI"
    db.commit()
    return {"msg": "Zamówienie przyjęte do realizacji"}

@router.put("/zamowienia/{zam_id}/odrzuc")
def odrzuc_zamowienie(zam_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == zam_id).first()
    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")
    if zamowienie.status_zamowienia in ["ODRZUCONE", "DOSTARCZONE"]:
        raise HTTPException(status_code=400, detail="Nie można odrzucić zamówienia o tym statusie")
    zamowienie.status_zamowienia = "ODRZUCONE"
    platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == zam_id).first()
    if platnosc and platnosc.status_platnosci == "OPŁACONE":
        platnosc.status_platnosci = "OCZEKIWANIE_NA_ZWROT"
    db.commit()
    return {"msg": "Zamówienie odrzucone"}

@router.put("/zamowienia/{zam_id}/w_dostawie")
def w_dostawie_zamowienie(zam_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == zam_id).first()
    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")
    if zamowienie.status_zamowienia != "W_REALIZACJI":
        raise HTTPException(status_code=400, detail="Zamówienie musi być w realizacji")
    zamowienie.status_zamowienia = "W_DOSTAWIE"
    db.commit()
    return {"msg": "Zamówienie wysłane w dostawę"}

@router.put("/zamowienia/{zam_id}/dostarczono")
def dostarczono_zamowienie(zam_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == zam_id).first()
    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")
    if zamowienie.status_zamowienia != "W_DOSTAWIE":
        raise HTTPException(status_code=400, detail="Zamówienie musi być w dostawie")
    zamowienie.status_zamowienia = "DOSTARCZONE"
    db.commit()
    return {"msg": "Zamówienie dostarczone"}

@router.put("/zamowienia/{zam_id}/zaakceptuj-platnosc")
def zaakceptuj_platnosc(zam_id: int, db: Session = Depends(get_db)):
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == zam_id).first()
    if not zamowienie:
        raise HTTPException(status_code=404, detail="Zamówienie nie istnieje")
    platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == zam_id).first()
    if not platnosc:
        raise HTTPException(status_code=404, detail="Płatność nie istnieje")
    if platnosc.status_platnosci != "OCZEKUJĄCA":
        raise HTTPException(status_code=400, detail="Płatność nie oczekuje na akceptację")
    platnosc.status_platnosci = "ZAAKCEPTOWANA"
    db.commit()
    return {"msg": "Płatność zatwierdzona"}

@router.get("/uzytkownik/{user_id}/zamowienia")
def pobierz_zamowienia_uzytkownika(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    zamowienia = db.query(models.Zamowienie).filter(models.Zamowienie.id_uzytkownik == user_id).all()
    wynik = []
    for zam in zamowienia:
        restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == zam.id_restauracja).first()
        pozycje = db.query(models.PozycjaZamowienia).filter(models.PozycjaZamowienia.id_zamowienia == zam.id_zamowienia).all()
        pozycje_out = []
        for p in pozycje:
            produkt = db.query(models.Produkt).filter(models.Produkt.id_produkt == p.id_produkt).first()
            pozycje_out.append({
                "nazwa": produkt.nazwa if produkt else "Nieznany",
                "ilosc": p.ilosc,
                "cena": float(p.cena)
            })
        platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == zam.id_zamowienia).first()
        status_platnosci = platnosc.status_platnosci if platnosc else "NIEZNANY"
        wynik.append({
            "id_zamowienia": zam.id_zamowienia,
            "restauracja_nazwa": restauracja.nazwa if restauracja else "Nieznana",
            "data_zamowienia": zam.data_zamowienia,
            "kwota": float(zam.kwota),
            "status_zamowienia": zam.status_zamowienia,
            "status_platnosci": status_platnosci,
            "pozycje": pozycje_out
        })
    return wynik

@router.get("/restauracja/{rest_id}/zamowienia")
def pobierz_zamowienia_restauracji(rest_id: int, db: Session = Depends(get_db)):
    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not restauracja:
        raise HTTPException(status_code=404, detail="Restauracja nie istnieje")

    zamowienia = db.query(models.Zamowienie).filter(models.Zamowienie.id_restauracja == rest_id).all()
    wynik = []
    for zam in zamowienia:
        uzytkownik = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == zam.id_uzytkownik).first()
        pozycje = db.query(models.PozycjaZamowienia).filter(models.PozycjaZamowienia.id_zamowienia == zam.id_zamowienia).all()
        pozycje_out = []
        for p in pozycje:
            produkt = db.query(models.Produkt).filter(models.Produkt.id_produkt == p.id_produkt).first()
            pozycje_out.append({
                "nazwa": produkt.nazwa if produkt else "Nieznany",
                "ilosc": p.ilosc,
                "cena": float(p.cena)
            })
        platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == zam.id_zamowienia).first()
        status_platnosci = platnosc.status_platnosci if platnosc else "NIEZNANY"
        wynik.append({
            "id_zamowienia": zam.id_zamowienia,
            "klient": f"{uzytkownik.imie} {uzytkownik.nazwisko}" if uzytkownik else "Nieznany",
            "adres_dostawy": uzytkownik.adres if uzytkownik else "Brak",
            "data_zamowienia": zam.data_zamowienia,
            "kwota": float(zam.kwota),
            "status_zamowienia": zam.status_zamowienia,
            "status_platnosci": status_platnosci,
            "pozycje": pozycje_out
        })
    return wynik