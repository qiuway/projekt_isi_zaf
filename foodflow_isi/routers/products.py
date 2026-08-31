from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from auth_jwt import get_current_user
from services import product_service

router = APIRouter(tags=["products"])


@router.get("/kategorie", response_model=List[schemas.KategoriaOut])
def pobierz_kategorie(db: Session = Depends(get_db)):
    return product_service.get_all_categories(db)


@router.get("/restauracja/{rest_id}/produkty", response_model=List[schemas.ProduktOut])
def pobierz_produkty(rest_id: int, db: Session = Depends(get_db)):
    return product_service.get_products_by_restaurant(db, rest_id)


@router.post("/restauracja/{rest_id}/produkty")
def dodaj_produkt(
    rest_id: int,
    prod: schemas.ProduktCreate,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    product_service.create_product(db, rest_id, prod, current_user)
    return {"msg": "Dodano produkt do menu"}


@router.put("/produkty/{prod_id}")
def edytuj_produkt(
    prod_id: int,
    prod: schemas.ProduktCreate,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    product_service.update_product(db, prod_id, prod, current_user)
    return {"msg": "Zaktualizowano produkt!"}


@router.post("/produkty/{prod_id}/zdjecie")
def upload_zdjecie_produktu(
    prod_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    photo_url = product_service.upload_product_photo(db, prod_id, file, current_user)
    return {"msg": "Zdjęcie produktu zostało zaktualizowane!", "zdjecie_url": photo_url}


@router.delete("/produkty/{prod_id}")
def usun_produkt(
    prod_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return product_service.delete_product(db, prod_id, current_user)