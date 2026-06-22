from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
from typing import List
import os
import shutil
from fastapi.staticfiles import StaticFiles

import models
import schemas
from database import get_db

app = FastAPI(title="FoodFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
    
    wybrany_typ_konta = 2 if user.is_owner else 1
    
    nowy_uzytkownik = models.Uzytkownik(
        imie=user.imie,
        nazwisko=user.nazwisko,
        email=user.email,
        haslo=user.haslo,
        id_typ_konta=wybrany_typ_konta,
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
        "imie": db_user.imie,
        "punkty": db_user.punkty
    }

@app.get("/uzytkownik/{user_id}/punkty")
def pobierz_punkty(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")

    return {"punkty": user.punkty}

@app.get("/kupony/")
def pobierz_kupony(db: Session = Depends(get_db)):
    kupony = db.query(models.KuponSklep).all()
    return kupony


@app.post("/kupony/kup")
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

    return {
        "msg": "Kupiono nagrodę",
        "punkty": user.punkty
    }


@app.get("/uzytkownik/{user_id}/kupony")
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

@app.get("/restauracje/zarzadzaj/{user_id}")
def pobierz_moje_restauracje(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")
        
    if user.id_typ_konta == 3:
        return db.query(models.Restauracja).all()
    elif user.id_typ_konta == 2:
        return db.query(models.Restauracja).filter(models.Restauracja.id_uzytkownik == user_id).all()
    else:
        return []

@app.post("/restauracje/zarzadzaj/{user_id}")
def dodaj_restauracje(user_id: int, rest: schemas.RestauracjaCreateUpdate, db: Session = Depends(get_db)):
    nowa = models.Restauracja(**rest.model_dump(), id_uzytkownik=user_id)
    db.add(nowa)
    db.commit()
    return {"msg": "Dodano restaurację"}

@app.put("/restauracje/zarzadzaj/{rest_id}")
def edytuj_restauracje(rest_id: int, rest: schemas.RestauracjaCreateUpdate, db: Session = Depends(get_db)):
    db_rest = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not db_rest:
        raise HTTPException(status_code=404)
    
    for key, value in rest.model_dump().items():
        setattr(db_rest, key, value)
        
    db.commit()
    return {"msg": "Zaktualizowano restaurację"}

@app.delete("/restauracje/zarzadzaj/{rest_id}")
def usun_restauracje(rest_id: int, db: Session = Depends(get_db)):
    db_rest = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if db_rest:
        db.delete(db_rest)
        db.commit()
    return {"msg": "Usunięto restaurację"}


@app.get("/restauracja/{rest_id}", response_model=schemas.RestauracjaOut)
def pobierz_restauracje(rest_id: int, db: Session = Depends(get_db)):
    rest = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restauracja nie istnieje")
    return rest

@app.get("/kategorie", response_model=List[schemas.KategoriaOut])
def pobierz_kategorie(db: Session = Depends(get_db)):
    return db.query(models.Kategoria).all()

@app.get("/restauracja/{rest_id}/produkty", response_model=List[schemas.ProduktOut])
def pobierz_produkty(rest_id: int, db: Session = Depends(get_db)):
    return db.query(models.Produkt).filter(models.Produkt.id_restauracja == rest_id).all()

@app.post("/restauracja/{rest_id}/produkty")
def dodaj_produkt(rest_id: int, prod: schemas.ProduktCreate, db: Session = Depends(get_db)):
    nowy_produkt = models.Produkt(
        id_restauracja=rest_id,
        id_kategoria=prod.id_kategoria,
        nazwa=prod.nazwa,
        cena=prod.cena,
        dostepny=prod.dostepny
    )
    db.add(nowy_produkt)
    db.commit()
    return {"msg": "Dodano produkt do menu"}

@app.put("/produkty/{prod_id}")
def edytuj_produkt(prod_id: int, prod: schemas.ProduktCreate, db: Session = Depends(get_db)):
    db_prod = db.query(models.Produkt).filter(models.Produkt.id_produkt == prod_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Produkt nie istnieje")
    
    db_prod.nazwa = prod.nazwa
    db_prod.cena = prod.cena
    db_prod.id_kategoria = prod.id_kategoria
    db_prod.dostepny = prod.dostepny
    
    db.commit()
    return {"msg": "Zaktualizowano produkt!"}

@app.delete("/produkty/{prod_id}")
def usun_produkt(prod_id: int, db: Session = Depends(get_db)):
    db_prod = db.query(models.Produkt).filter(models.Produkt.id_produkt == prod_id).first()
    if db_prod:
        db.delete(db_prod)
        db.commit()
    return {"msg": "Usunięto produkt!"}