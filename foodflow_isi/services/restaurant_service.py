from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas


def get_all_restaurants(db: Session) -> List[models.Restauracja]:
    return db.query(models.Restauracja).all()


def get_restaurant_by_id(db: Session, rest_id: int) -> models.Restauracja:
    rest = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not rest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restauracja nie istnieje.")
    return rest


def get_user_restaurants(db: Session, user_id: int) -> List[models.Restauracja]:
    return db.query(models.Restauracja).filter(models.Restauracja.id_uzytkownik == user_id).all()


def create_restaurant(db: Session, user_id: int, dane: schemas.RestauracjaCreateUpdate) -> models.Restauracja:
    nowa_restauracja = models.Restauracja(
        nazwa=dane.nazwa,
        opis=dane.opis,
        adres=dane.adres,
        numer_telefonu=dane.numer_telefonu,
        czynne=dane.czynne,
        id_uzytkownik=user_id
    )
    db.add(nowa_restauracja)
    db.commit()
    db.refresh(nowa_restauracja)
    return nowa_restauracja


def update_restaurant(
    db: Session,
    rest_id: int,
    dane: schemas.RestauracjaCreateUpdate,
    current_user: models.Uzytkownik | None = None
) -> models.Restauracja:
    rest = get_restaurant_by_id(db, rest_id)

    if not current_user or (current_user.id_typ_konta != 3 and rest.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do edycji tej restauracji."
        )

    rest.nazwa = dane.nazwa
    rest.opis = dane.opis
    rest.adres = dane.adres
    rest.numer_telefonu = dane.numer_telefonu
    rest.czynne = dane.czynne

    db.commit()
    db.refresh(rest)
    return rest


def delete_restaurant(
    db: Session,
    rest_id: int,
    current_user: models.Uzytkownik | None = None
) -> dict:
    rest = get_restaurant_by_id(db, rest_id)

    if not current_user or (current_user.id_typ_konta != 3 and rest.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do usunięcia tej restauracji."
        )

    db.query(models.Produkt).filter(models.Produkt.id_restauracja == rest_id).delete()
    db.delete(rest)
    db.commit()
    return {"msg": "Restauracja i jej menu zostały usunięte."}
