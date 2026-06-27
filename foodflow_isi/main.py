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

import requests
from urllib.parse import urlencode
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse, HTMLResponse

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

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
        if abs(suma_skladek - laczna_kwota) > 0.01:
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

@app.get("/auth/google/login")
def google_login():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }

    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(google_auth_url)


@app.get("/auth/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
    )

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Błąd logowania Google")

    token_data = token_response.json()
    access_token = token_data.get("access_token")

    user_response = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )

    if user_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Nie udało się pobrać danych użytkownika Google")

    google_user = user_response.json()

    email = google_user.get("email")
    imie = google_user.get("given_name") or "Google"
    nazwisko = google_user.get("family_name") or "User"

    if not email:
        raise HTTPException(status_code=400, detail="Google nie zwrócił adresu email")

    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == email).first()

    if not user:
        user = models.Uzytkownik(
            imie=imie,
            nazwisko=nazwisko,
            email=email,
            haslo="GOOGLE_OAUTH",
            id_typ_konta=1,
            punkty=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return RedirectResponse(
        f"{FRONTEND_URL}?googleLogin=success&userId={user.id_uzytkownik}&punkty={user.punkty}"
)

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

@app.post("/koszyk/dodaj")
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

@app.get("/koszyk/{id_uzytkownik}")
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

@app.put("/koszyk/aktualizuj")
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