from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth_jwt import get_current_user
from services import review_service

router = APIRouter(tags=["reviews"])


@router.get("/restauracja/{rest_id}/opinie", response_model=schemas.RestaurantReviewsSummaryOut)
def pobierz_opinie_restauracji(rest_id: int, db: Session = Depends(get_db)):
    return review_service.get_restaurant_reviews(db, rest_id)


@router.post("/restauracja/{rest_id}/opinie")
def dodaj_opinie_restauracji(
    rest_id: int,
    dane: schemas.OpiniaCreate,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return review_service.add_restaurant_review(db, rest_id, dane, current_user)


@router.delete("/opinie/{review_id}")
def usun_opinie(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    return review_service.delete_restaurant_review(db, review_id, current_user)
