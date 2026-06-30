from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from urllib.parse import urlencode
import requests
import os

import models
import schemas
from database import get_db

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

@router.post("/rejestracja")
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

@router.post("/logowanie")
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

@router.get("/auth/google/login")
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


@router.get("/auth/google/callback")
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