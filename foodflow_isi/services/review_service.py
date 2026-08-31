from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

import models
import schemas
from services.achievements_service import sprawdz_osiagniecia_uzytkownika


def get_restaurant_reviews(db: Session, rest_id: int) -> dict:
    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not restauracja:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restauracja nie istnieje.")

    opinie = db.query(models.Opinia).filter(
        models.Opinia.id_restauracja == rest_id
    ).order_by(models.Opinia.id_opinia.desc()).all()

    liczba_opinii = len(opinie)
    if liczba_opinii > 0:
        suma_ocen = sum([o.ocena for o in opinie])
        srednia_ocen = round(float(suma_ocen) / float(liczba_opinii), 1)
    else:
        srednia_ocen = 0.0

    opinie_out = []
    for op in opinie:
        uzytkownik = op.uzytkownik
        autor_nazwa = f"{uzytkownik.imie} {uzytkownik.nazwisko}" if uzytkownik else "Anonim"
        autor_awatar = uzytkownik.zdjecie_profilowe if uzytkownik else None

        opinie_out.append({
            "id_opinia": op.id_opinia,
            "id_uzytkownik": op.id_uzytkownik,
            "id_restauracja": op.id_restauracja,
            "ocena": op.ocena,
            "komentarz": op.komentarz,
            "autor_nazwa": autor_nazwa,
            "autor_awatar": autor_awatar
        })

    return {
        "id_restauracja": rest_id,
        "srednia_ocen": srednia_ocen,
        "liczba_opinii": liczba_opinii,
        "opinie": opinie_out
    }


def add_restaurant_review(
    db: Session,
    rest_id: int,
    dane: schemas.OpiniaCreate,
    current_user: models.Uzytkownik | None = None
) -> dict:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Musisz być zalogowany, aby dodać opinię."
        )

    if dane.ocena < 1 or dane.ocena > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ocena musi wynosić od 1 do 5 gwiazdek.")

    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not restauracja:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restauracja nie istnieje.")

    author_id = current_user.id_uzytkownik

    istniejaca_opinia = db.query(models.Opinia).filter(
        models.Opinia.id_restauracja == rest_id,
        models.Opinia.id_uzytkownik == author_id
    ).first()

    if istniejaca_opinia:
        istniejaca_opinia.ocena = dane.ocena
        istniejaca_opinia.komentarz = dane.komentarz
        db.commit()
        db.refresh(istniejaca_opinia)
        msg = "Twoja opinia została zaktualizowana!"
        opinia_id = istniejaca_opinia.id_opinia
    else:
        nowa_opinia = models.Opinia(
            id_uzytkownik=author_id,
            id_restauracja=rest_id,
            ocena=dane.ocena,
            komentarz=dane.komentarz
        )
        db.add(nowa_opinia)
        db.commit()
        db.refresh(nowa_opinia)
        msg = "Dziękujemy za dodanie opinii!"
        opinia_id = nowa_opinia.id_opinia

    sprawdz_osiagniecia_uzytkownika(author_id, db)

    return {
        "msg": msg,
        "id_opinia": opinia_id,
        "ocena": dane.ocena
    }


def delete_restaurant_review(
    db: Session,
    review_id: int,
    current_user: models.Uzytkownik | None = None
) -> dict:
    opinia = db.query(models.Opinia).filter(models.Opinia.id_opinia == review_id).first()
    if not opinia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opinia nie istnieje.")

    if not current_user or (current_user.id_typ_konta != 3 and opinia.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tej opinii.")

    db.delete(opinia)
    db.commit()
    return {"msg": "Opinia została pomyślnie usunięta."}
