import os
import uuid
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from typing import List

import models
import schemas

ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024


def get_products_by_restaurant(db: Session, rest_id: int) -> List[models.Produkt]:
    return db.query(models.Produkt).filter(models.Produkt.id_restauracja == rest_id).all()


def get_all_categories(db: Session) -> List[models.Kategoria]:
    return db.query(models.Kategoria).all()


def get_product_by_id(db: Session, product_id: int) -> models.Produkt:
    prod = db.query(models.Produkt).filter(models.Produkt.id_produkt == product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkt nie istnieje.")
    return prod


def create_product(
    db: Session,
    rest_id: int,
    dane: schemas.ProduktCreate,
    current_user: models.Uzytkownik | None = None
) -> models.Produkt:
    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not restauracja:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restauracja nie istnieje.")

    if not current_user or (current_user.id_typ_konta != 3 and restauracja.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do dodawania produktów w tej restauracji."
        )

    kategoria = db.query(models.Kategoria).filter(models.Kategoria.id_kategoria == dane.id_kategoria).first()
    if not kategoria:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Podana kategoria nie istnieje.")

    nowy_produkt = models.Produkt(
        id_restauracja=rest_id,
        id_kategoria=dane.id_kategoria,
        nazwa=dane.nazwa,
        cena=dane.cena,
        dostepny=dane.dostepny,
        zdjecie=dane.zdjecie
    )
    db.add(nowy_produkt)
    db.commit()
    db.refresh(nowy_produkt)
    return nowy_produkt


def update_product(
    db: Session,
    product_id: int,
    dane: schemas.ProduktCreate,
    current_user: models.Uzytkownik | None = None
) -> models.Produkt:
    prod = get_product_by_id(db, product_id)
    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == prod.id_restauracja).first()

    if not current_user or (current_user.id_typ_konta != 3 and restauracja and restauracja.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do edycji tego dania."
        )

    kategoria = db.query(models.Kategoria).filter(models.Kategoria.id_kategoria == dane.id_kategoria).first()
    if not kategoria:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Podana kategoria nie istnieje.")

    prod.nazwa = dane.nazwa
    prod.cena = dane.cena
    prod.id_kategoria = dane.id_kategoria
    prod.dostepny = dane.dostepny
    if dane.zdjecie is not None:
        prod.zdjecie = dane.zdjecie

    db.commit()
    db.refresh(prod)
    return prod


def upload_product_photo(
    db: Session,
    product_id: int,
    file: UploadFile,
    current_user: models.Uzytkownik | None = None
) -> str:
    prod = get_product_by_id(db, product_id)
    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == prod.id_restauracja).first()

    if not current_user or (current_user.id_typ_konta != 3 and restauracja and restauracja.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do zmiany zdjęcia tego dania."
        )

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_PHOTO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Niedozwolony format pliku ({ext}). Dozwolone: {', '.join(sorted(ALLOWED_PHOTO_EXTENSIONS))}"
        )

    contents = file.file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rozmiar pliku przekracza maksymalny dopuszczalny limit (5 MB)."
        )

    os.makedirs("static/products", exist_ok=True)
    filename = f"prod_{product_id}_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join("static", "products", filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    photo_url = f"/static/products/{filename}"
    prod.zdjecie = photo_url

    db.commit()
    db.refresh(prod)
    return photo_url


def delete_product(
    db: Session,
    product_id: int,
    current_user: models.Uzytkownik | None = None
) -> dict:
    prod = get_product_by_id(db, product_id)
    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == prod.id_restauracja).first()

    if not current_user or (current_user.id_typ_konta != 3 and restauracja and restauracja.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do usunięcia tego dania."
        )

    db.delete(prod)
    db.commit()
    return {"msg": "Produkt został usunięty z menu."}
