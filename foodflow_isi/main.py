from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid

import os
import shutil
from fastapi.staticfiles import StaticFiles

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

os.makedirs("static/avatars", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/restauracje/", response_model=list[schemas.RestauracjaOut])
def pobierz_restauracje(db: Session = Depends(get_db)):
    return db.query(models.Restauracja).all()

@app.post("/restauracje/")
def dodaj_restauracje(nazwa: str, opis: str, adres: str, db: Session = Depends(get_db)):
    nowa_restauracja = models.Restauracja(nazwa=nazwa, opis=opis, czynne=True)
    db.add(nowa_restauracja)
    db.commit()
    return {"msg": "Dodano restaurację"}

@app.post("/zamowienia/")
def zloz_zamowienie(dane: schemas.TworzenieZamowienia, db: Session = Depends(get_db)):
    laczna_kwota = 0.0
    pozycje_do_zapisu = []

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

    if dane.czy_skladka:
        if not dane.uczestnicy_skladki:
            raise HTTPException(status_code=400, detail="Brak uczestników składki.")

        suma_skladek = sum([u.kwota_deklarowana for u in dane.uczestnicy_skladki])
        if abs(suma_skladek - laczna_kwota) > 0.01:  # Margin błędu float
            raise HTTPException(status_code=400, detail="Suma składek nie pokrywa kwoty zamówienia!")

    kod_zap = str(uuid.uuid4())[:8] if dane.czy_skladka else None

    nowe_zamowienie = models.Zamowienie(
        id_uzytkownik=dane.id_uzytkownik,
        id_restauracja=dane.id_restauracja,
        kwota=laczna_kwota,
        kod_zaproszenia=kod_zap
    )
    db.add(nowe_zamowienie)
    db.flush()

    for p_zapis in pozycje_do_zapisu:
        p_zapis.id_zamowienia = nowe_zamowienie.id_zamowienia
        db.add(p_zapis)

    nowa_platnosc = models.Platnosc(
        id_zamowienia=nowe_zamowienie.id_zamowienia,
        kwota=laczna_kwota,
        typ=dane.czy_skladka
    )
    db.add(nowa_platnosc)
    db.flush()

    if dane.czy_skladka:
        for u in dane.uczestnicy_skladki:
            osoba = models.OsobaPlacaca(
                id_platnosc=nowa_platnosc.id_platnosc,
                id_uzytkownik=u.id_uzytkownik,
                kwota=u.kwota_deklarowana
            )
            db.add(osoba)
    else:
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

@app.post("/rejestracja")
def rejestracja(user: schemas.UzytkownikCreate, db: Session = Depends(get_db)):

    istniejacy = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == user.email).first()
    if istniejacy:
        raise HTTPException(status_code=400, detail="Ten email jest już zajęty!")
    
    nowy_uzytkownik = models.Uzytkownik(
        imie=user.imie,
        nazwisko=user.nazwisko,
        email=user.email,
        haslo=user.haslo,
        punkty=0
    )
    db.add(nowy_uzytkownik)
    db.commit()
    return {"msg": "Konto zostało pomyślnie utworzone!"}

@app.post("/logowanie")
def logowanie(user: schemas.UzytkownikLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == user.email).first()
    
    if not db_user or db_user.haslo != user.haslo:
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")
        
    return {
        "msg": f"Witaj {db_user.imie}, zalogowano pomyślnie!", 
        "user_id": db_user.id_uzytkownik,
        "imie": db_user.imie
    }


@app.get("/uzytkownik/{user_id}")
def pobierz_profil(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")
    return user


@app.put("/uzytkownik/{user_id}")
def aktualizuj_profil(user_id: int, dane: schemas.UzytkownikUpdate, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")
        
    user.imie = dane.imie
    user.nazwisko = dane.nazwisko
    user.email = dane.email
    user.numer_telefonu = dane.numer_telefonu
    user.adres = dane.adres
    
    db.commit()
    return {"msg": "Profil zaktualizowany pomyślnie!"}

@app.post("/uzytkownik/{user_id}/avatar")
def upload_avatar(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    file_extension = os.path.splitext(file.filename)[1]
    filename = f"avatar_{user_id}{file_extension}"
    file_path = os.path.join("static/avatars", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    avatar_url = f"/static/avatars/{filename}"
    user.zdjecie_profilowe = avatar_url
    db.commit()

    return {"msg": "Zdjęcie profilowe zaktualizowane!", "avatar_url": avatar_url}