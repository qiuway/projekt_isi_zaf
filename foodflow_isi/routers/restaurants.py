from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from auth_jwt import get_current_user, require_owner_or_admin
from services import restaurant_service

router = APIRouter(tags=["restaurants"])


@router.get("/restauracje/", response_model=List[schemas.RestauracjaOut])
def pobierz_wszystkie_restauracje(db: Session = Depends(get_db)):
    return restaurant_service.get_all_restaurants(db)


@router.get("/restauracje/zarzadzaj/{user_id}", response_model=List[schemas.RestauracjaOut])
def pobierz_moje_restauracje(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do przeglądania restauracji innego użytkownika."
        )
    if current_user.id_typ_konta == 3:
        return restaurant_service.get_all_restaurants(db)
    return restaurant_service.get_user_restaurants(db, user_id)


@router.post("/restauracje/zarzadzaj/{user_id}")
def dodaj_restauracje(
    user_id: int,
    rest: schemas.RestauracjaCreateUpdate,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(require_owner_or_admin)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do tworzenia restauracji dla innego użytkownika."
        )
    restaurant_service.create_restaurant(db, user_id, rest)
    return {"msg": "Dodano restaurację"}


@router.put("/restauracje/zarzadzaj/{rest_id}")
def edytuj_restauracje(
    rest_id: int,
    rest: schemas.RestauracjaCreateUpdate,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    restaurant_service.update_restaurant(db, rest_id, rest, current_user)
    return {"msg": "Zaktualizowano restaurację"}


@router.delete("/restauracje/zarzadzaj/{rest_id}")
def usun_restauracje(
    rest_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return restaurant_service.delete_restaurant(db, rest_id, current_user)


@router.get("/restauracja/{rest_id}", response_model=schemas.RestauracjaOut)
def pobierz_restauracje(rest_id: int, db: Session = Depends(get_db)):
    return restaurant_service.get_restaurant_by_id(db, rest_id)
