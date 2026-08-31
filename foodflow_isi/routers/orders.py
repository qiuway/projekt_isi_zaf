from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from auth_jwt import get_current_user
from services import order_service

router = APIRouter(tags=["orders"])


@router.post("/zamowienia/")
def zloz_zamowienie(
    dane: schemas.TworzenieZamowienia,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != dane.id_uzytkownik:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do składania zamówień w imieniu innego użytkownika."
        )
    return order_service.create_order(db, dane)


@router.get("/uzytkownik/{user_id}/zamowienia")
def pobierz_zamowienia_uzytkownika(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do podglądu historii zamówień tego użytkownika."
        )
    return order_service.get_user_orders(db, user_id)


@router.get("/restauracja/{rest_id}/zamowienia")
def pobierz_zamowienia_restauracji(
    rest_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.get_restaurant_orders(db, rest_id, current_user)


@router.put("/zamowienia/{zam_id}/przyjmij")
def przyjmij_zamowienie(
    zam_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.update_order_status(db, zam_id, "przyjmij", current_user)


@router.put("/zamowienia/{zam_id}/odrzuc")
def odrzuc_zamowienie(
    zam_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.update_order_status(db, zam_id, "odrzuc", current_user)


@router.put("/zamowienia/{zam_id}/w_dostawie")
def w_dostawie_zamowienie(
    zam_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.update_order_status(db, zam_id, "w_dostawie", current_user)


@router.put("/zamowienia/{zam_id}/dostarczono")
def dostarczono_zamowienie(
    zam_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.update_order_status(db, zam_id, "dostarczono", current_user)


@router.put("/zamowienia/{zam_id}/zaakceptuj-platnosc")
def zaakceptuj_platnosc(
    zam_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.accept_order_payment(db, zam_id, current_user)


@router.get("/zamowienia/{zam_id}/rozliczenie")
def pobierz_rozliczenie_skladki(
    zam_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.get_order_settlement(db, zam_id, current_user.id_uzytkownik)


@router.put("/zamowienia/{zam_id}/rozliczenie/{target_user_id}/status-oplacenia")
def zmien_status_oplacenia_skladki(
    zam_id: int,
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return order_service.toggle_settlement_paid(db, zam_id, target_user_id, current_user)