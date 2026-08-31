import os
import shutil
import uuid
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

import models
import schemas
from services.achievements_service import sprawdz_osiagniecia_uzytkownika

ALLOWED_AVATAR_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def get_user_by_id(db: Session, user_id: int) -> models.Uzytkownik:
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie istnieje.")
    return user


def update_user_profile(db: Session, user_id: int, dane: schemas.UzytkownikUpdate) -> models.Uzytkownik:
    user = get_user_by_id(db, user_id)

    if dane.email and dane.email != user.email:
        istniejacy = db.query(models.Uzytkownik).filter(
            models.Uzytkownik.email == dane.email,
            models.Uzytkownik.id_uzytkownik != user_id
        ).first()
        if istniejacy:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Podany adres email jest już zajęty przez inne konto."
            )
        user.email = dane.email

    user.imie = dane.imie
    user.nazwisko = dane.nazwisko
    user.numer_telefonu = dane.numer_telefonu
    user.adres = dane.adres

    db.commit()
    db.refresh(user)

    sprawdz_osiagniecia_uzytkownika(user_id, db)
    return user


MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 mb


def save_user_avatar(db: Session, user_id: int, file: UploadFile) -> str:
    user = get_user_by_id(db, user_id)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Niedozwolony format pliku ({ext}). Dozwolone: {', '.join(sorted(ALLOWED_AVATAR_EXTENSIONS))}"
        )

    contents = file.file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rozmiar pliku przekracza maksymalny dopuszczalny limit (5 MB)."
        )

    os.makedirs("static/avatars", exist_ok=True)
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join("static", "avatars", filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    avatar_url = f"/static/avatars/{filename}"
    user.zdjecie_profilowe = avatar_url

    db.commit()
    sprawdz_osiagniecia_uzytkownika(user_id, db)

    return avatar_url


def get_user_points(db: Session, user_id: int) -> int:
    user = get_user_by_id(db, user_id)
    return user.punkty or 0
