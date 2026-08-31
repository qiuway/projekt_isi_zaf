from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth_jwt import get_current_user
from services import cart_service

router = APIRouter(tags=["cart"])


@router.post("/koszyk/dodaj")
def dodaj_do_koszyka(
    dane: schemas.DodajDoKoszyka,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != dane.id_uzytkownik:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do dodawania dań do cudzego koszyka."
        )
    return cart_service.add_item_to_cart(db, dane)


@router.get("/koszyk/{id_uzytkownik}")
def pobierz_koszyk(
    id_uzytkownik: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != id_uzytkownik:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do podglądu cudzego koszyka."
        )
    return cart_service.get_user_cart(db, id_uzytkownik)


@router.put("/koszyk/aktualizuj")
def aktualizuj_koszyk(
    dane: schemas.AktualizujKoszyk,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != dane.id_uzytkownik:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do modyfikacji cudzego koszyka."
        )
    return cart_service.update_cart_item(db, dane)

@router.post("/koszyk/grupa/utworz")
def utworz_koszyk_grupowy(
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return cart_service.create_group_cart(db, current_user.id_uzytkownik)


@router.post("/koszyk/grupa/dolacz")
def dolacz_do_koszyka_grupowego(
    dane: schemas.DolaczDoGrupy,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return cart_service.join_group_cart(db, current_user.id_uzytkownik, dane.kod_grupy)


@router.get("/koszyk/grupa/{kod_grupy}")
def pobierz_koszyk_grupowy(
    kod_grupy: str,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return cart_service.get_group_cart(db, kod_grupy)


@router.post("/koszyk/grupa/{kod_grupy}/dodaj")
def dodaj_do_koszyka_grupowego(
    kod_grupy: str,
    dane: schemas.DodajDoGrupyPozycja,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return cart_service.add_item_to_group_cart(
        db, current_user.id_uzytkownik, kod_grupy, dane.id_produkt, dane.ilosc, dane.zastap_koszyk
    )


@router.put("/koszyk/grupa/{kod_grupy}/pozycja")
def aktualizuj_pozycje_grupowa(
    kod_grupy: str,
    dane: schemas.AktualizujGrupePozycja,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return cart_service.update_group_cart_item(
        db, current_user.id_uzytkownik, kod_grupy, dane.id_pozycja_koszyka, dane.ilosc
    )


@router.post("/koszyk/grupa/{kod_grupy}/opusc")
def opusc_koszyk_grupowy(
    kod_grupy: str,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return cart_service.leave_group_cart(db, current_user.id_uzytkownik, kod_grupy)