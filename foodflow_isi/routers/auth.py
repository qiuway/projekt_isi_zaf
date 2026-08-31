import os
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import schemas
from database import get_db
from services import auth_service

router = APIRouter(tags=["auth"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.post("/rejestracja")
def rejestracja(user: schemas.UzytkownikCreate, db: Session = Depends(get_db)):
    return auth_service.register_user(db, user)


@router.post("/logowanie")
def logowanie(user: schemas.UzytkownikLogin, db: Session = Depends(get_db)):
    return auth_service.authenticate_user(db, user)


@router.get("/auth/google/login")
def google_login():
    data = auth_service.get_google_auth_url()
    return RedirectResponse(data["url"])


@router.get("/auth/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    res = auth_service.process_google_callback(db, code)
    user = res["user"]
    jwt_token = res["jwt_token"]

    return RedirectResponse(
        f"{FRONTEND_URL}?googleLogin=success&token={jwt_token}&userId={user.id_uzytkownik}&punkty={user.punkty or 0}"
    )