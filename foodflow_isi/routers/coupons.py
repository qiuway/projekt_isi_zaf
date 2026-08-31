from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from auth_jwt import get_current_user
from services import coupon_service

router = APIRouter(tags=["coupons"])


@router.get("/kupony/", response_model=List[schemas.KuponOut])
def pobierz_kupony(db: Session = Depends(get_db)):
    return coupon_service.get_all_store_coupons(db)


@router.post("/kupony/kup")
def kup_kupon(
    dane: schemas.ZakupKuponu,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != dane.id_uzytkownik:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do zakupu kuponu z cudzego konta punktowego."
        )
    return coupon_service.buy_coupon_with_points(db, dane)


@router.get("/uzytkownik/{user_id}/kupony")
def pobierz_kupony_uzytkownika(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do podglądu kuponów tego użytkownika."
        )
    return coupon_service.get_user_active_coupons(db, user_id)