from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import get_db
from auth_jwt import require_admin
from services import admin_service, coupon_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/uzytkownicy", response_model=List[schemas.AdminUserOut])
def pobierz_wszystkich_uzytkownikow(
    search: Optional[str] = Query(None),
    role: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return admin_service.get_all_users(db, search, role)


@router.put("/uzytkownicy/{user_id}/rola")
def zmien_role_uzytkownika(
    user_id: int,
    dane: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return admin_service.update_user_role(db, user_id, dane.id_typ_konta)


@router.delete("/uzytkownicy/{user_id}")
def usun_uzytkownika(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return admin_service.delete_user(db, user_id)


@router.get("/restauracje")
def pobierz_wszystkie_restauracje_admin(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return admin_service.get_all_restaurants_admin(db, search)


@router.get("/statystyki", response_model=schemas.PlatformStatsOut)
def pobierz_statystyki_platformy(
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return admin_service.get_platform_stats(db)


@router.post("/kupony", response_model=schemas.KuponOut)
def dodaj_kupon_sklepu(
    dane: schemas.KuponCreateUpdate,
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return coupon_service.create_store_coupon(db, dane)


@router.put("/kupony/{coupon_id}", response_model=schemas.KuponOut)
def edytuj_kupon_sklepu(
    coupon_id: int,
    dane: schemas.KuponCreateUpdate,
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return coupon_service.update_store_coupon(db, coupon_id, dane)


@router.delete("/kupony/{coupon_id}")
def usun_kupon_sklepu(
    coupon_id: int,
    db: Session = Depends(get_db),
    admin: models.Uzytkownik = Depends(require_admin)
):
    return coupon_service.delete_store_coupon(db, coupon_id)
