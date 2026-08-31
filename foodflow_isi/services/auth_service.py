import os
import requests
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth_jwt import create_access_token
from security import hash_password, verify_password
from services.achievements_service import sprawdz_osiagniecia_uzytkownika


def register_user(db: Session, dane: schemas.UzytkownikCreate) -> dict:
    istniejacy = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == dane.email).first()
    if istniejacy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Użytkownik o podanym adresie email już istnieje."
        )

    typ_konta = 2 if dane.is_owner else 1

    nowy_uzytkownik = models.Uzytkownik(
        imie=dane.imie,
        nazwisko=dane.nazwisko,
        email=dane.email,
        haslo=hash_password(dane.haslo),
        id_typ_konta=typ_konta,
        punkty=0
    )
    db.add(nowy_uzytkownik)
    db.commit()
    db.refresh(nowy_uzytkownik)

    nowy_koszyk = models.Koszyk(id_uzytkownik=nowy_uzytkownik.id_uzytkownik)
    db.add(nowy_koszyk)
    db.commit()

    sprawdz_osiagniecia_uzytkownika(nowy_uzytkownik.id_uzytkownik, db)

    access_token = create_access_token(data={
        "user_id": nowy_uzytkownik.id_uzytkownik,
        "email": nowy_uzytkownik.email,
        "role": nowy_uzytkownik.id_typ_konta
    })

    return {
        "msg": "Użytkownik zarejestrowany pomyślnie",
        "id_uzytkownik": nowy_uzytkownik.id_uzytkownik,
        "email": nowy_uzytkownik.email,
        "id_typ_konta": nowy_uzytkownik.id_typ_konta,
        "punkty": nowy_uzytkownik.punkty,
        "access_token": access_token,
        "token_type": "bearer"
    }


def authenticate_user(db: Session, dane: schemas.UzytkownikLogin) -> dict:
    uzytkownik = db.query(models.Uzytkownik).filter(
        models.Uzytkownik.email == dane.email
    ).first()

    if not uzytkownik:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Błędny email lub hasło."
        )

    if not uzytkownik.haslo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="To konto zostało utworzone za pomocą Google. Zaloguj się przez Google."
        )

    if not verify_password(dane.haslo, uzytkownik.haslo):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Błędny email lub hasło."
        )

    if not uzytkownik.haslo.startswith("pbkdf2_sha256$"):
        uzytkownik.haslo = hash_password(dane.haslo)
        db.commit()

    access_token = create_access_token(data={
        "user_id": uzytkownik.id_uzytkownik,
        "email": uzytkownik.email,
        "role": uzytkownik.id_typ_konta
    })

    return {
        "msg": "Zalogowano pomyślnie",
        "id_uzytkownik": uzytkownik.id_uzytkownik,
        "user_id": uzytkownik.id_uzytkownik,
        "imie": uzytkownik.imie,
        "nazwisko": uzytkownik.nazwisko,
        "email": uzytkownik.email,
        "id_typ_konta": uzytkownik.id_typ_konta,
        "punkty": uzytkownik.punkty,
        "access_token": access_token,
        "token_type": "bearer"
    }


def get_google_auth_url() -> dict:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Brak konfiguracji GOOGLE_CLIENT_ID w zmiennych środowiskowych."
        )
    
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"redirect_uri={redirect_uri}&"
        f"prompt=select_account"
    )
    return {"url": url}


def process_google_callback(db: Session, code: str) -> dict:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    token_res = requests.post(token_url, data=token_data)
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Nie udało się pobrać tokenu od Google.")

    access_token_google = token_res.json().get("access_token")
    user_info_res = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token_google}"}
    )
    if user_info_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Nie udało się pobrać danych profilu Google.")

    google_user = user_info_res.json()
    email = google_user.get("email")
    imie = google_user.get("given_name", "Google")
    nazwisko = google_user.get("family_name", "User")
    picture = google_user.get("picture")

    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.email == email).first()

    if not user:
        user = models.Uzytkownik(
            imie=imie,
            nazwisko=nazwisko,
            email=email,
            haslo=None,
            id_typ_konta=1,
            punkty=0,
            zdjecie_profilowe=picture
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        nowy_koszyk = models.Koszyk(id_uzytkownik=user.id_uzytkownik)
        db.add(nowy_koszyk)
        db.commit()
        sprawdz_osiagniecia_uzytkownika(user.id_uzytkownik, db)
    elif picture and not user.zdjecie_profilowe:
        user.zdjecie_profilowe = picture
        db.commit()

    jwt_token = create_access_token(data={
        "user_id": user.id_uzytkownik,
        "email": user.email,
        "role": user.id_typ_konta
    })

    return {
        "user": user,
        "jwt_token": jwt_token
    }
