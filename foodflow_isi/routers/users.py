from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth_jwt import get_current_user
from services import user_service

router = APIRouter(tags=["users"])


@router.get("/uzytkownik/me/profil", response_model=schemas.UzytkownikOut)
def pobierz_moj_profil(current_user: models.Uzytkownik = Depends(get_current_user)):
    return current_user


@router.get("/uzytkownik/{user_id}/punkty")
def pobierz_punkty(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do podglądu punktów tego konta."
        )
    punkty = user_service.get_user_points(db, user_id)
    return {"punkty": punkty}


@router.get("/uzytkownik/{user_id}", response_model=schemas.UzytkownikOut)
def pobierz_profil(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return user_service.get_user_by_id(db, user_id)


@router.put("/uzytkownik/{user_id}")
def aktualizuj_profil(
    user_id: int,
    dane: schemas.UzytkownikUpdate,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do edycji tego profilu."
        )
    user_service.update_user_profile(db, user_id, dane)
    return {"msg": "Profil zaktualizowany pomyślnie!"}


@router.post("/uzytkownik/{user_id}/avatar")
def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do zmiany zdjęcia profilowego tego użytkownika."
        )
    avatar_url = user_service.save_user_avatar(db, user_id, file)
    return {"msg": "Zdjęcie profilowe zaktualizowane!", "avatar_url": avatar_url}