import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import models
from database import get_db

SECRET_KEY = os.getenv("JWT_SECRET_KEY") or "wydzial-elektortechniki-automatyki-informatyki"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer(auto_error=False)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user_optional(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> models.Uzytkownik | None:
    if credentials:
        token = credentials.credentials
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: int | None = payload.get("user_id")
            if user_id is not None:
                user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
                if user:
                    return user
        except (jwt.PyJWTError, Exception):
            pass

    return None


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> models.Uzytkownik:
    user = get_current_user_optional(request, credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy token uwierzytelniający lub sesja wygasła",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(
    current_user: models.Uzytkownik = Depends(get_current_user)
) -> models.Uzytkownik:
    if current_user.id_typ_konta != 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień administratora."
        )
    return current_user


def require_owner_or_admin(
    current_user: models.Uzytkownik = Depends(get_current_user)
) -> models.Uzytkownik:
    if current_user.id_typ_konta not in (2, 3):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Wymagane uprawnienia właściciela restauracji lub administratora."
        )
    return current_user
