from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/kategorie", response_model=List[schemas.KategoriaOut])
def pobierz_kategorie(db: Session = Depends(get_db)):
    return db.query(models.Kategoria).all()

@router.get("/restauracja/{rest_id}/produkty", response_model=List[schemas.ProduktOut])
def pobierz_produkty(rest_id: int, db: Session = Depends(get_db)):
    return db.query(models.Produkt).filter(models.Produkt.id_restauracja == rest_id).all()

@router.post("/restauracja/{rest_id}/produkty")
def dodaj_produkt(rest_id: int, prod: schemas.ProduktCreate, db: Session = Depends(get_db)):
    nowy_produkt = models.Produkt(
        id_restauracja=rest_id,
        id_kategoria=prod.id_kategoria,
        nazwa=prod.nazwa,
        cena=prod.cena,
        dostepny=prod.dostepny
    )
    db.add(nowy_produkt)
    db.commit()
    return {"msg": "Dodano produkt do menu"}

@router.put("/produkty/{prod_id}")
def edytuj_produkt(prod_id: int, prod: schemas.ProduktCreate, db: Session = Depends(get_db)):
    db_prod = db.query(models.Produkt).filter(models.Produkt.id_produkt == prod_id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Produkt nie istnieje")

    db_prod.nazwa = prod.nazwa
    db_prod.cena = prod.cena
    db_prod.id_kategoria = prod.id_kategoria
    db_prod.dostepny = prod.dostepny

    db.commit()
    return {"msg": "Zaktualizowano produkt!"}

@router.delete("/produkty/{prod_id}")
def usun_produkt(prod_id: int, db: Session = Depends(get_db)):
    db_prod = db.query(models.Produkt).filter(models.Produkt.id_produkt == prod_id).first()
    if db_prod:
        db.delete(db_prod)
        db.commit()
    return {"msg": "Usunięto produkt!"}