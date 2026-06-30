from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/restauracje/", response_model=list[schemas.RestauracjaOut])
def pobierz_wszystkie_restauracje(db: Session = Depends(get_db)):
    return db.query(models.Restauracja).all()

@router.get("/restauracje/zarzadzaj/{user_id}")
def pobierz_moje_restauracje(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Nie znaleziono użytkownika")

    if user.id_typ_konta == 3:
        return db.query(models.Restauracja).all()
    elif user.id_typ_konta == 2:
        return db.query(models.Restauracja).filter(models.Restauracja.id_uzytkownik == user_id).all()
    else:
        return []

@router.post("/restauracje/zarzadzaj/{user_id}")
def dodaj_restauracje(user_id: int, rest: schemas.RestauracjaCreateUpdate, db: Session = Depends(get_db)):
    nowa = models.Restauracja(**rest.model_dump(), id_uzytkownik=user_id)
    db.add(nowa)
    db.commit()
    return {"msg": "Dodano restaurację"}

@router.put("/restauracje/zarzadzaj/{rest_id}")
def edytuj_restauracje(rest_id: int, rest: schemas.RestauracjaCreateUpdate, db: Session = Depends(get_db)):
    db_rest = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not db_rest:
        raise HTTPException(status_code=404)

    for key, value in rest.model_dump().items():
        setattr(db_rest, key, value)

    db.commit()
    return {"msg": "Zaktualizowano restaurację"}

@router.delete("/restauracje/zarzadzaj/{rest_id}")
def usun_restauracje(rest_id: int, db: Session = Depends(get_db)):
    db_rest = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if db_rest:
        db.delete(db_rest)
        db.commit()
    return {"msg": "Usunięto restaurację"}

@router.get("/restauracja/{rest_id}", response_model=schemas.RestauracjaOut)
def pobierz_restauracje(rest_id: int, db: Session = Depends(get_db)):
    rest = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not rest:
        raise HTTPException(status_code=404, detail="Restauracja nie istnieje")
    return rest
