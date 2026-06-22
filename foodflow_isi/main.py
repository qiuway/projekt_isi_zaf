from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid

import models
import schemas
from database import get_db

app = FastAPI(title="FoodFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Adresy frontendu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#pobranie listy restauracji
@app.get("/restauracje/", response_model=list[schemas.RestauracjaOut])
def pobierz_restauracje(db: Session = Depends(get_db)):
    return db.query(models.Restauracja).all()

#dodanie restauracji
@app.post("/restauracje/")
def dodaj_restauracje(nazwa: str, opis: str, adres: str, db: Session = Depends(get_db)):
    nowa_restauracja = models.Restauracja(nazwa=nazwa, opis=opis, czynne=True)
    db.add(nowa_restauracja)
    db.commit()
    return {"msg": "Dodano restaurację"}

#glowna logika biznesowa: skladanie zamowienia
@app.post("/zamowienia/")
def zloz_zamowienie(dane: schemas.TworzenieZamowienia, db: Session = Depends(get_db)):
    laczna_kwota = 0.0
    pozycje_do_zapisu = []

    #walidacja produktow i obliczanie kwoty
    for poz in dane.pozycje:
        produkt = db.query(models.Produkt).filter(
            models.Produkt.id_produkt == poz.id_produkt,
            models.Produkt.id_restauracja == dane.id_restauracja
        ).first()

        if not produkt or not produkt.dostepny:
            raise HTTPException(status_code=400, detail=f"Produkt {poz.id_produkt} jest niedostępny.")

        #pobieranie ceny z bazy
        wartosc_pozycji = float(produkt.cena) * poz.ilosc
        laczna_kwota += wartosc_pozycji

        pozycje_do_zapisu.append(
            models.PozycjaZamowienia(id_produkt=produkt.id_produkt, ilosc=poz.ilosc, cena=produkt.cena)
        )

    #walidacja skladki
    if dane.czy_skladka:
        if not dane.uczestnicy_skladki:
            raise HTTPException(status_code=400, detail="Brak uczestników składki.")

        suma_skladek = sum([u.kwota_deklarowana for u in dane.uczestnicy_skladki])
        if abs(suma_skladek - laczna_kwota) > 0.01:  # Margin błędu float
            raise HTTPException(status_code=400, detail="Suma składek nie pokrywa kwoty zamówienia!")

    #generowanie kodu dla zamowien grupowych
    kod_zap = str(uuid.uuid4())[:8] if dane.czy_skladka else None

    #zapis zamowienia
    nowe_zamowienie = models.Zamowienie(
        id_uzytkownik=dane.id_uzytkownik,
        id_restauracja=dane.id_restauracja,
        kwota=laczna_kwota,
        kod_zaproszenia=kod_zap
    )
    db.add(nowe_zamowienie)
    db.flush()

    #zapis pozycji zamowienia
    for p_zapis in pozycje_do_zapisu:
        p_zapis.id_zamowienia = nowe_zamowienie.id_zamowienia
        db.add(p_zapis)

    #zapis platnosci
    nowa_platnosc = models.Platnosc(
        id_zamowienia=nowe_zamowienie.id_zamowienia,
        kwota=laczna_kwota,
        typ=dane.czy_skladka
    )
    db.add(nowa_platnosc)
    db.flush()

    #obsluga tabeli osoby_placace
    if dane.czy_skladka:
        for u in dane.uczestnicy_skladki:
            osoba = models.OsobaPlacaca(
                id_platnosc=nowa_platnosc.id_platnosc,
                id_uzytkownik=u.id_uzytkownik,
                kwota=u.kwota_deklarowana
            )
            db.add(osoba)
    else:
        #placi tylko lider
        osoba = models.OsobaPlacaca(
            id_platnosc=nowa_platnosc.id_platnosc,
            id_uzytkownik=dane.id_uzytkownik,
            kwota=laczna_kwota
        )
        db.add(osoba)

    db.commit()

    return {
        "status": "Sukces",
        "id_zamowienia": nowe_zamowienie.id_zamowienia,
        "kwota_total": laczna_kwota,
        "kod_zaproszenia": kod_zap
    }

    # --- LOGIKA LOGOWANIA I REJESTRACJI ---

@app.post("/rejestracja")
def rejestracja(user: schemas.UzytkownikCreate, db: Session = Depends(get_db)):
    # 1. Sprawdzamy, czy email nie jest już w bazie
    istniejacy = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == user.email).first()
    if istniejacy:
        raise HTTPException(status_code=400, detail="Ten email jest już zajęty!")
    
    # 2. Zapisujemy do bazy
    nowy_uzytkownik = models.Uzytkownik(
        imie=user.imie,
        nazwisko=user.nazwisko,
        email=user.email,
        haslo=user.haslo, # UWAGA: Pamiętajcie, by w ostatecznej wersji projektu zahashować to hasło!
        punkty=0
    )
    db.add(nowy_uzytkownik)
    db.commit()
    return {"msg": "Konto zostało pomyślnie utworzone!"}

@app.post("/logowanie")
def logowanie(user: schemas.UzytkownikLogin, db: Session = Depends(get_db)):
    # 1. Szukamy użytkownika
    db_user = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == user.email).first()
    
    # 2. Sprawdzamy poprawność danych
    if not db_user or db_user.haslo != user.haslo:
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")
        
    return {
        "msg": f"Witaj {db_user.imie}, zalogowano pomyślnie!", 
        "user_id": db_user.id_uzytkownik,
        "imie": db_user.imie
    }