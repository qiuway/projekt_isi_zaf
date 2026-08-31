from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

import models
import schemas


def get_all_users(
    db: Session,
    search: Optional[str] = None,
    role_filter: Optional[int] = None
) -> List[dict]:
    query = db.query(models.Uzytkownik)

    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            (func.coalesce(models.Uzytkownik.imie, '').ilike(s)) |
            (func.coalesce(models.Uzytkownik.nazwisko, '').ilike(s)) |
            (func.coalesce(models.Uzytkownik.email, '').ilike(s))
        )

    if role_filter is not None and role_filter > 0:
        query = query.filter(models.Uzytkownik.id_typ_konta == role_filter)

    users = query.order_by(models.Uzytkownik.id_uzytkownik.asc()).all()

    wyniki = []
    for u in users:
        liczba_zam = db.query(func.count(models.Zamowienie.id_zamowienia)).filter(
            models.Zamowienie.id_uzytkownik == u.id_uzytkownik
        ).scalar() or 0

        wyniki.append({
            "id_uzytkownik": u.id_uzytkownik,
            "imie": u.imie,
            "nazwisko": u.nazwisko,
            "email": u.email,
            "numer_telefonu": u.numer_telefonu,
            "adres": u.adres,
            "zdjecie_profilowe": u.zdjecie_profilowe,
            "id_typ_konta": u.id_typ_konta or 1,
            "punkty": u.punkty or 0,
            "liczba_zamowien": liczba_zam
        })
    return wyniki


def update_user_role(db: Session, target_user_id: int, new_role_id: int) -> dict:
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == target_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie istnieje.")

    if new_role_id not in (1, 2, 3):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowy identyfikator roli (1-Klient, 2-Właściciel, 3-Admin).")

    user.id_typ_konta = new_role_id
    db.commit()
    db.refresh(user)

    nazwy_rol = {1: "Klient", 2: "Właściciel restauracji", 3: "Administrator"}
    return {
        "msg": f"Rola użytkownika {user.email} została zmieniona na: {nazwy_rol.get(new_role_id)}.",
        "id_uzytkownik": user.id_uzytkownik,
        "id_typ_konta": user.id_typ_konta
    }


def delete_user(db: Session, target_user_id: int) -> dict:
    user = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == target_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie istnieje.")

    koszyk = db.query(models.Koszyk).filter(models.Koszyk.id_uzytkownik == target_user_id).first()
    if koszyk:
        db.query(models.PozycjaWKoszyku).filter(models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk).delete()
        db.delete(koszyk)

    db.query(models.PosiadanyKupon).filter(models.PosiadanyKupon.id_uzytkownik == target_user_id).delete()
    db.query(models.ZdobyteOsiagniecie).filter(models.ZdobyteOsiagniecie.id_uzytkownik == target_user_id).delete()

    db.query(models.Restauracja).filter(models.Restauracja.id_uzytkownik == target_user_id).update(
        {"id_uzytkownik": None}
    )

    db.delete(user)
    db.commit()
    return {"msg": f"Użytkownik #{target_user_id} został pomyślnie usunięty."}


def get_all_restaurants_admin(db: Session, search: Optional[str] = None) -> List[dict]:
    query = db.query(models.Restauracja)

    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            (func.coalesce(models.Restauracja.nazwa, '').ilike(s)) |
            (func.coalesce(models.Restauracja.adres, '').ilike(s)) |
            (func.coalesce(models.Restauracja.opis, '').ilike(s))
        )

    restauracje = query.order_by(models.Restauracja.id_restauracja.asc()).all()
    wyniki = []
    for r in restauracje:
        wlasciciel = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == r.id_uzytkownik).first() if r.id_uzytkownik else None
        liczba_dan = db.query(func.count(models.Produkt.id_produkt)).filter(models.Produkt.id_restauracja == r.id_restauracja).scalar() or 0
        liczba_zam = db.query(func.count(models.Zamowienie.id_zamowienia)).filter(models.Zamowienie.id_restauracja == r.id_restauracja).scalar() or 0

        wlasciciel_str = f"{wlasciciel.imie or ''} {wlasciciel.nazwisko or ''} ({wlasciciel.email})".strip() if wlasciciel else "Brak przypisanego właściciela"

        wyniki.append({
            "id_restauracja": r.id_restauracja,
            "nazwa": r.nazwa,
            "opis": r.opis,
            "adres": r.adres,
            "numer_telefonu": r.numer_telefonu,
            "czynne": bool(r.czynne),
            "id_uzytkownik": r.id_uzytkownik,
            "wlasciciel_nazwa": wlasciciel_str,
            "liczba_dan": liczba_dan,
            "liczba_zamowien": liczba_zam
        })
    return wyniki


def get_platform_stats(db: Session) -> dict:
    total_users = db.query(func.count(models.Uzytkownik.id_uzytkownik)).scalar() or 0
    total_orders = db.query(func.count(models.Zamowienie.id_zamowienia)).scalar() or 0
    total_revenue = db.query(func.sum(models.Zamowienie.kwota)).scalar() or 0.0
    total_restaurants = db.query(func.count(models.Restauracja.id_restauracja)).scalar() or 0
    total_products = db.query(func.count(models.Produkt.id_produkt)).scalar() or 0

    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_revenue": round(float(total_revenue), 2),
        "total_restaurants": total_restaurants,
        "total_products": total_products
    }
