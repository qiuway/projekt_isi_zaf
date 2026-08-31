import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas


def get_or_create_cart(db: Session, user_id: int) -> models.Koszyk:
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.id_uzytkownik == user_id,
        models.Koszyk.is_group == False
    ).first()
    if not koszyk:
        koszyk = models.Koszyk(id_uzytkownik=user_id, is_group=False)
        db.add(koszyk)
        db.commit()
        db.refresh(koszyk)
    return koszyk


def get_user_cart(db: Session, user_id: int) -> dict:
    koszyk = get_or_create_cart(db, user_id)
    
    wynik_pozycje = []
    laczna_suma = 0.0

    for poz in koszyk.pozycje:
        if poz.produkt:
            wartosc = float(poz.produkt.cena) * poz.ilosc
            laczna_suma += wartosc
            wynik_pozycje.append({
                "id_pozycja_koszyka": poz.id_pozycja_koszyka,
                "id_produkt": poz.id_produkt,
                "nazwa": poz.produkt.nazwa,
                "cena": float(poz.produkt.cena),
                "ilosc": poz.ilosc,
                "cena_calkowita": wartosc,
                "wartosc_calkowita": wartosc,
                "dostepny": poz.produkt.dostepny,
                "zdjecie": poz.produkt.zdjecie,
                "id_restauracja": poz.produkt.id_restauracja,
                "restauracja_nazwa": poz.produkt.restauracja.nazwa if poz.produkt.restauracja else None
            })

    return {
        "id_koszyk": koszyk.id_koszyk,
        "id_uzytkownik": user_id,
        "kod_grupy": None,
        "is_group": False,
        "suma": round(laczna_suma, 2),
        "pozycje": wynik_pozycje
    }


def add_item_to_cart(db: Session, dane: schemas.DodajDoKoszyka) -> dict:
    if dane.ilosc <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ilość musi być większa od 0.")

    produkt = db.query(models.Produkt).filter(models.Produkt.id_produkt == dane.id_produkt).first()
    if not produkt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produkt nie istnieje.")
    if not produkt.dostepny:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produkt jest chwilowo niedostępny.")

    koszyk = get_or_create_cart(db, dane.id_uzytkownik)

    pozycja = db.query(models.PozycjaWKoszyku).filter(
        models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk,
        models.PozycjaWKoszyku.id_produkt == dane.id_produkt,
        models.PozycjaWKoszyku.id_uzytkownik == dane.id_uzytkownik
    ).first()

    if pozycja:
        pozycja.ilosc += dane.ilosc
    else:
        pozycja = models.PozycjaWKoszyku(
            id_koszyk=koszyk.id_koszyk,
            id_produkt=dane.id_produkt,
            id_uzytkownik=dane.id_uzytkownik,
            ilosc=dane.ilosc
        )
        db.add(pozycja)

    db.commit()
    return {"msg": "Produkt dodany do koszyka."}


def update_cart_item(db: Session, dane: schemas.AktualizujKoszyk) -> dict:
    koszyk = get_or_create_cart(db, dane.id_uzytkownik)

    pozycja = db.query(models.PozycjaWKoszyku).filter(
        models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk,
        models.PozycjaWKoszyku.id_produkt == dane.id_produkt
    ).first()

    if not pozycja:
        if dane.ilosc <= 0:
            return {"msg": "Pozycja usunięta z koszyka."}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pozycja nie istnieje w koszyku.")

    if dane.ilosc <= 0:
        db.delete(pozycja)
        db.commit()
        return {"msg": "Pozycja usunięta z koszyka."}
    else:
        pozycja.ilosc = dane.ilosc
        db.commit()
        return {"msg": "Zaktualizowano ilość."}

def create_group_cart(db: Session, host_user_id: int) -> dict:
    group_cart = db.query(models.Koszyk).filter(
        models.Koszyk.id_uzytkownik == host_user_id,
        models.Koszyk.is_group == True
    ).first()

    if not group_cart:
        group_cart = models.Koszyk(
            id_uzytkownik=host_user_id,
            is_group=True,
            kod_grupy=f"FF-{uuid.uuid4().hex[:6].upper()}"
        )
        db.add(group_cart)
        db.commit()
        db.refresh(group_cart)

    istniejacy = db.query(models.UczestnikKoszyka).filter(
        models.UczestnikKoszyka.id_koszyk == group_cart.id_koszyk,
        models.UczestnikKoszyka.id_uzytkownik == host_user_id
    ).first()
    if not istniejacy:
        db.add(models.UczestnikKoszyka(id_koszyk=group_cart.id_koszyk, id_uzytkownik=host_user_id))
        db.commit()

    return get_group_cart(db, group_cart.kod_grupy)


def join_group_cart(db: Session, user_id: int, kod_grupy: str) -> dict:
    kod_czysty = kod_grupy.strip().upper()
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.kod_grupy == kod_czysty,
        models.Koszyk.is_group == True
    ).first()

    if not koszyk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Koszyk grupowy o podanym kodzie nie istnieje lub został zamknięty."
        )

    uczestnik = db.query(models.UczestnikKoszyka).filter(
        models.UczestnikKoszyka.id_koszyk == koszyk.id_koszyk,
        models.UczestnikKoszyka.id_uzytkownik == user_id
    ).first()

    if not uczestnik:
        db.add(models.UczestnikKoszyka(id_koszyk=koszyk.id_koszyk, id_uzytkownik=user_id))
        db.commit()

    return get_group_cart(db, kod_czysty)


def get_group_cart(db: Session, kod_grupy: str) -> dict:
    kod_czysty = kod_grupy.strip().upper()
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.kod_grupy == kod_czysty,
        models.Koszyk.is_group == True
    ).first()

    if not koszyk:
        zamowienie = db.query(models.Zamowienie).filter(
            models.Zamowienie.kod_zaproszenia == kod_czysty
        ).first()

        if zamowienie:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Gospodarz sfinalizował zamówienie! Koszyk grupowy został pomyślnie zamknięty."
            )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Koszyk grupowy nie istnieje lub został zamknięty."
        )

    host = koszyk.uzytkownik

    uczestnicy_db = db.query(models.UczestnikKoszyka).filter(
        models.UczestnikKoszyka.id_koszyk == koszyk.id_koszyk
    ).all()
    uczestnicy_map = {}
    if host:
        uczestnicy_map[host.id_uzytkownik] = host
    for u in uczestnicy_db:
        if u.uzytkownik:
            uczestnicy_map[u.uzytkownik.id_uzytkownik] = u.uzytkownik

    uczestnicy_list = [
        {
            "id_uzytkownik": u.id_uzytkownik,
            "imie": u.imie,
            "nazwisko": u.nazwisko,
            "email": u.email,
            "zdjecie_profilowe": u.zdjecie_profilowe
        }
        for u in uczestnicy_map.values()
    ]

    pozycje_out = []
    laczna_suma_dan = 0.0
    uzytkownicy_kwoty = {uid: 0.0 for uid in uczestnicy_map.keys()}

    for poz in koszyk.pozycje:
        if poz.produkt:
            wartosc = float(poz.produkt.cena) * poz.ilosc
            laczna_suma_dan += wartosc

            autor = poz.uzytkownik if poz.uzytkownik else host
            autor_id = autor.id_uzytkownik if autor else host.id_uzytkownik
            uzytkownicy_kwoty[autor_id] = uzytkownicy_kwoty.get(autor_id, 0.0) + wartosc

            pozycje_out.append({
                "id_pozycja_koszyka": poz.id_pozycja_koszyka,
                "id_produkt": poz.id_produkt,
                "nazwa": poz.produkt.nazwa,
                "cena": float(poz.produkt.cena),
                "ilosc": poz.ilosc,
                "cena_calkowita": round(wartosc, 2),
                "zdjecie": poz.produkt.zdjecie,
                "id_restauracja": poz.produkt.id_restauracja,
                "restauracja_nazwa": poz.produkt.restauracja.nazwa if poz.produkt.restauracja else None,
                "dodane_przez": {
                    "id_uzytkownik": autor.id_uzytkownik if autor else 0,
                    "imie": autor.imie if autor else "Uczestnik",
                    "nazwisko": autor.nazwisko if autor else "",
                    "email": autor.email if autor else "",
                    "zdjecie_profilowe": autor.zdjecie_profilowe if autor else None
                }
            })

    koszt_dostawy = 7.99 if laczna_suma_dan > 0 else 0.0
    liczba_uczestnikow = max(len(uczestnicy_map), 1)
    udzial_dostawa_na_glowe = round(koszt_dostawy / liczba_uczestnikow, 2)

    podsumowanie_uczestnikow = []
    for uid, u in uczestnicy_map.items():
        kwota_d = round(uzytkownicy_kwoty.get(uid, 0.0), 2)
        podsumowanie_uczestnikow.append({
            "id_uzytkownik": u.id_uzytkownik,
            "imie": u.imie,
            "nazwisko": u.nazwisko,
            "zdjecie_profilowe": u.zdjecie_profilowe,
            "kwota_dan": kwota_d,
            "udzial_dostawa": udzial_dostawa_na_glowe if kwota_d > 0 else 0.0,
            "suma_do_zwrotu": round(kwota_d + (udzial_dostawa_na_glowe if kwota_d > 0 else 0.0), 2)
        })

    suma_calkowita = round(laczna_suma_dan + koszt_dostawy, 2)

    return {
        "id_koszyk": koszyk.id_koszyk,
        "kod_grupy": koszyk.kod_grupy,
        "is_group": True,
        "host": {
            "id_uzytkownik": host.id_uzytkownik if host else 0,
            "imie": host.imie if host else "Gospodarz",
            "nazwisko": host.nazwisko if host else "",
            "email": host.email if host else "",
            "zdjecie_profilowe": host.zdjecie_profilowe if host else None
        },
        "uczestnicy": uczestnicy_list,
        "pozycje": pozycje_out,
        "suma_dan": round(laczna_suma_dan, 2),
        "koszt_dostawy": koszt_dostawy,
        "suma_calkowita": suma_calkowita,
        "podsumowanie_uczestnikow": podsumowanie_uczestnikow
    }


def add_item_to_group_cart(db: Session, user_id: int, kod_grupy: str, product_id: int, ilosc: int = 1, zastap_koszyk: bool = False) -> dict:
    if ilosc <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ilość musi być większa od 0.")

    kod_czysty = kod_grupy.strip().upper()
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.kod_grupy == kod_czysty,
        models.Koszyk.is_group == True
    ).first()

    if not koszyk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koszyk grupowy nie istnieje.")

    produkt = db.query(models.Produkt).filter(models.Produkt.id_produkt == product_id).first()
    if not produkt or not produkt.dostepny:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produkt jest niedostępny.")

    istniejacy_u = db.query(models.UczestnikKoszyka).filter(
        models.UczestnikKoszyka.id_koszyk == koszyk.id_koszyk,
        models.UczestnikKoszyka.id_uzytkownik == user_id
    ).first()
    if not istniejacy_u:
        db.add(models.UczestnikKoszyka(id_koszyk=koszyk.id_koszyk, id_uzytkownik=user_id))

    pozycja = db.query(models.PozycjaWKoszyku).filter(
        models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk,
        models.PozycjaWKoszyku.id_produkt == product_id,
        models.PozycjaWKoszyku.id_uzytkownik == user_id
    ).first()

    if pozycja:
        pozycja.ilosc += ilosc
    else:
        pozycja = models.PozycjaWKoszyku(
            id_koszyk=koszyk.id_koszyk,
            id_produkt=product_id,
            id_uzytkownik=user_id,
            ilosc=ilosc
        )
        db.add(pozycja)

    db.commit()
    return {"msg": "Produkt dodany do koszyka grupowego."}


def update_group_cart_item(db: Session, user_id: int, kod_grupy: str, pozycja_id: int, ilosc: int) -> dict:
    kod_czysty = kod_grupy.strip().upper()
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.kod_grupy == kod_czysty,
        models.Koszyk.is_group == True
    ).first()

    if not koszyk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koszyk grupowy nie istnieje.")

    pozycja = db.query(models.PozycjaWKoszyku).filter(
        models.PozycjaWKoszyku.id_pozycja_koszyka == pozycja_id,
        models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk
    ).first()

    if not pozycja:
        if ilosc <= 0:
            return {"msg": "Pozycja usunięta."}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pozycja nie istnieje.")

    if pozycja.id_uzytkownik != user_id and koszyk.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie możesz modyfikować dań dodanych przez innych uczestników."
        )

    if ilosc <= 0:
        db.delete(pozycja)
    else:
        pozycja.ilosc = ilosc

    db.commit()
    return {"msg": "Zaktualizowano pozycję."}


def leave_group_cart(db: Session, user_id: int, kod_grupy: str) -> dict:
    kod_czysty = kod_grupy.strip().upper()
    koszyk = db.query(models.Koszyk).filter(
        models.Koszyk.kod_grupy == kod_czysty,
        models.Koszyk.is_group == True
    ).first()

    if not koszyk:
        return {"msg": "Koszyk grupowy nie istnieje lub został już zamknięty."}

    if koszyk.id_uzytkownik == user_id:
        db.delete(koszyk)
    else:
        db.query(models.UczestnikKoszyka).filter(
            models.UczestnikKoszyka.id_koszyk == koszyk.id_koszyk,
            models.UczestnikKoszyka.id_uzytkownik == user_id
        ).delete()
        db.query(models.PozycjaWKoszyku).filter(
            models.PozycjaWKoszyku.id_koszyk == koszyk.id_koszyk,
            models.PozycjaWKoszyku.id_uzytkownik == user_id
        ).delete()

    db.commit()
    return {"msg": "Opuszczono koszyk grupowy."}

