from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import shutil

import models
import schemas
from database import get_db
from services.achievements_service import sprawdz_osiagniecia_uzytkownika

router = APIRouter()

@router.get("/uzytkownik/{user_id}/punkty")
def pobierz_punkty(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")

    return {"punkty": user.punkty}

@router.get("/uzytkownik/{user_id}")
def pobierz_profil(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")
    return user


@router.put("/uzytkownik/{user_id}")
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
    sprawdz_osiagniecia_uzytkownika(user_id, db)
    return {"msg": "Profil zaktualizowany pomyślnie!"}

@router.post("/uzytkownik/{user_id}/avatar")
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
    sprawdz_osiagniecia_uzytkownika(user_id, db)

    return {"msg": "Zdjęcie profilowe zaktualizowane!", "avatar_url": avatar_url}