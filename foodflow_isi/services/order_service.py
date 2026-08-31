import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from services.achievements_service import sprawdz_osiagniecia_uzytkownika


def create_order(db: Session, dane: schemas.TworzenieZamowienia) -> dict:
    if not dane.pozycje:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Koszyk jest pusty.")

    rest_items_map = {}
    laczna_kwota_dan = 0.0

    for poz in dane.pozycje:
        if poz.ilosc <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ilość pozycji musi być większa od 0.")

        produkt = db.query(models.Produkt).filter(
            models.Produkt.id_produkt == poz.id_produkt
        ).first()

        if not produkt or not produkt.dostepny:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Produkt '{poz.id_produkt}' jest niedostępny.")

        if produkt.id_restauracja not in rest_items_map:
            rest_items_map[produkt.id_restauracja] = []

        wartosc_pozycji = float(produkt.cena) * poz.ilosc
        laczna_kwota_dan += wartosc_pozycji

        rest_items_map[produkt.id_restauracja].append({
            "produkt": produkt,
            "ilosc": poz.ilosc,
            "cena": produkt.cena,
            "wartosc": wartosc_pozycji
        })

    koszt_dostawy = 7.99 if laczna_kwota_dan > 0 else 0.0
    rabat = 0.0

    if dane.id_posiadany_kupon:
        posiadany_kupon = db.query(models.PosiadanyKupon).filter(
            models.PosiadanyKupon.id_posiadany_kupon == dane.id_posiadany_kupon,
            models.PosiadanyKupon.id_uzytkownik == dane.id_uzytkownik,
            models.PosiadanyKupon.wykorzystany == False
        ).first()

        if not posiadany_kupon or not posiadany_kupon.kupon:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kupon jest nieprawidłowy lub został już wykorzystany.")

        wartosc_znizki = (posiadany_kupon.kupon.wartosc_znizki or "").lower()
        if "%" in wartosc_znizki:
            procent = float(wartosc_znizki.replace("%", "").replace(",", ".").strip())
            rabat = (laczna_kwota_dan * procent) / 100.0
        elif "zł" in wartosc_znizki:
            kwota_rabatu = float(wartosc_znizki.replace("zł", "").replace(",", ".").strip())
            rabat = min(kwota_rabatu, laczna_kwota_dan)
        elif "dostawa" in wartosc_znizki:
            rabat = koszt_dostawy

        posiadany_kupon.wykorzystany = True

    if dane.czy_skladka:
        uczestnictwo = db.query(models.UczestnikKoszyka).join(
            models.Koszyk, models.UczestnikKoszyka.id_koszyk == models.Koszyk.id_koszyk
        ).filter(
            models.UczestnikKoszyka.id_uzytkownik == dane.id_uzytkownik,
            models.Koszyk.is_group == True,
            models.Koszyk.id_uzytkownik != dane.id_uzytkownik
        ).first()

        if uczestnictwo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tylko gospodarz koszyka grupowego może złożyć i opłacić zamówienie."
            )

    kwota_po_rabacie = max(round(laczna_kwota_dan + koszt_dostawy - rabat, 2), 0.0)

    if dane.czy_skladka:
        group_koszyk_for_code = db.query(models.Koszyk).filter(
            models.Koszyk.id_uzytkownik == dane.id_uzytkownik,
            models.Koszyk.is_group == True
        ).first()
        kod_zaproszenia = group_koszyk_for_code.kod_grupy if (group_koszyk_for_code and group_koszyk_for_code.kod_grupy) else str(uuid.uuid4())[:8].upper()
    else:
        kod_zaproszenia = None

    typ_p = (dane.typ_platnosci or "").lower().strip()
    if typ_p in ("karta", "card", "online", "stripe"):
        status_platnosci_poczatkowy = "OPŁACONE"
    elif typ_p in ("on_delivery", "gotowka", "przy_odbiorze"):
        status_platnosci_poczatkowy = "PRZY_ODBIORZE"
    else:
        status_platnosci_poczatkowy = "OCZEKUJĄCA"

    utworzone_zamowienia = []
    glowna_platnosc = None

    for idx, (rest_id, items) in enumerate(rest_items_map.items()):
        kwota_dan_rest = sum(i["wartosc"] for i in items)
        if laczna_kwota_dan > 0:
            proporcja = kwota_dan_rest / laczna_kwota_dan
            kwota_zam = round(kwota_po_rabacie * proporcja, 2)
        else:
            kwota_zam = 0.0

        zamowienie = models.Zamowienie(
            id_uzytkownik=dane.id_uzytkownik,
            id_restauracja=rest_id,
            kod_zaproszenia=kod_zaproszenia,
            kwota=kwota_zam,
            status_zamowienia="ZŁOŻONE"
        )
        db.add(zamowienie)
        db.commit()
        db.refresh(zamowienie)
        utworzone_zamowienia.append(zamowienie)

        for it in items:
            poz_zam = models.PozycjaZamowienia(
                id_zamowienia=zamowienie.id_zamowienia,
                id_produkt=it["produkt"].id_produkt,
                ilosc=it["ilosc"],
                cena=it["cena"]
            )
            db.add(poz_zam)

        platnosc = models.Platnosc(
            id_zamowienia=zamowienie.id_zamowienia,
            kwota=kwota_zam,
            typ=dane.czy_skladka,
            status_platnosci=status_platnosci_poczatkowy
        )
        db.add(platnosc)
        db.commit()
        db.refresh(platnosc)

        if idx == 0:
            glowna_platnosc = platnosc

    if dane.czy_skladka and glowna_platnosc:
        if dane.uczestnicy_skladki:
            for ucz in dane.uczestnicy_skladki:
                osoba = models.OsobaPlacaca(
                    id_platnosc=glowna_platnosc.id_platnosc,
                    id_uzytkownik=ucz.id_uzytkownik,
                    kwota=round(ucz.kwota_deklarowana, 2),
                    czy_oplacone=(ucz.id_uzytkownik == dane.id_uzytkownik)
                )
                db.add(osoba)
        else:
            db.add(models.OsobaPlacaca(
                id_platnosc=glowna_platnosc.id_platnosc,
                id_uzytkownik=dane.id_uzytkownik,
                kwota=kwota_po_rabacie,
                czy_oplacone=True
            ))

    if dane.czy_skladka:
        group_koszyk = db.query(models.Koszyk).filter(
            models.Koszyk.kod_grupy == kod_zaproszenia,
            models.Koszyk.is_group == True
        ).first()
        if not group_koszyk:
            group_koszyk = db.query(models.Koszyk).filter(
                models.Koszyk.id_uzytkownik == dane.id_uzytkownik,
                models.Koszyk.is_group == True
            ).first()
        if group_koszyk:
            db.delete(group_koszyk)
    else:
        private_koszyk = db.query(models.Koszyk).filter(
            models.Koszyk.id_uzytkownik == dane.id_uzytkownik,
            models.Koszyk.is_group == False
        ).first()
        if private_koszyk:
            db.query(models.PozycjaWKoszyku).filter(models.PozycjaWKoszyku.id_koszyk == private_koszyk.id_koszyk).delete()

    db.commit()

    sprawdz_osiagniecia_uzytkownika(dane.id_uzytkownik, db)

    nowe_zamowienie = utworzone_zamowienia[0]

    return {
        "status": "Sukces",
        "msg": "Zamówienie zostało pomyślnie złożone!",
        "id_zamowienia": nowe_zamowienie.id_zamowienia,
        "kwota": kwota_po_rabacie,
        "rabat": round(rabat, 2),
        "kod_zaproszenia": kod_zaproszenia,
        "status_platnosci": status_platnosci_poczatkowy,
        "czy_skladka": dane.czy_skladka
    }


def get_user_orders(db: Session, user_id: int) -> List[dict]:
    zamowienia_host = db.query(models.Zamowienie).filter(
        models.Zamowienie.id_uzytkownik == user_id
    ).all()

    zamowienia_uczestnik = db.query(models.Zamowienie).join(
        models.Platnosc, models.Zamowienie.id_zamowienia == models.Platnosc.id_zamowienia
    ).join(
        models.OsobaPlacaca, models.Platnosc.id_platnosc == models.OsobaPlacaca.id_platnosc
    ).filter(
        models.OsobaPlacaca.id_uzytkownik == user_id
    ).all()

    unikalne_zam = {z.id_zamowienia: z for z in (zamowienia_host + zamowienia_uczestnik)}
    posortowane = sorted(
        unikalne_zam.values(),
        key=lambda z: z.data_zamowienia.isoformat() if z.data_zamowienia else "",
        reverse=True
    )

    wyniki = []
    for zam in posortowane:
        restauracja = db.query(models.Restauracja).filter(
            models.Restauracja.id_restauracja == zam.id_restauracja
        ).first()

        platnosc = db.query(models.Platnosc).filter(
            models.Platnosc.id_zamowienia == zam.id_zamowienia
        ).first()

        pozycje_db = db.query(models.PozycjaZamowienia).filter(
            models.PozycjaZamowienia.id_zamowienia == zam.id_zamowienia
        ).all()

        pozycje_out = []
        for p in pozycje_db:
            prod = db.query(models.Produkt).filter(models.Produkt.id_produkt == p.id_produkt).first()
            pozycje_out.append({
                "nazwa": prod.nazwa if prod else "Nieznany produkt",
                "ilosc": p.ilosc,
                "cena": float(p.cena)
            })

        czy_skladka = bool(platnosc.typ if platnosc else False)
        jest_hostem = (zam.id_uzytkownik == user_id)

        wyniki.append({
            "id_zamowienia": zam.id_zamowienia,
            "restauracja_nazwa": restauracja.nazwa if restauracja else "Nieznana restauracja",
            "data_zamowienia": zam.data_zamowienia.isoformat() if zam.data_zamowienia else "",
            "kwota": float(zam.kwota),
            "status_zamowienia": zam.status_zamowienia,
            "status_platnosci": platnosc.status_platnosci if platnosc else "BRAK",
            "czy_skladka": czy_skladka,
            "kod_zaproszenia": zam.kod_zaproszenia,
            "jest_hostem": jest_hostem,
            "pozycje": pozycje_out
        })
    return wyniki


def get_restaurant_orders(
    db: Session,
    rest_id: int,
    current_user: models.Uzytkownik | None = None
) -> List[dict]:
    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == rest_id).first()
    if not restauracja:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restauracja nie istnieje.")

    if not current_user or (current_user.id_typ_konta != 3 and restauracja.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do przeglądania zamówień tej restauracji.")

    zamowienia = db.query(models.Zamowienie).filter(
        models.Zamowienie.id_restauracja == rest_id
    ).order_by(models.Zamowienie.data_zamowienia.desc()).all()

    wyniki = []
    for zam in zamowienia:
        klient = db.query(models.Uzytkownik).filter(models.Uzytkownik.id_uzytkownik == zam.id_uzytkownik).first()
        platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == zam.id_zamowienia).first()
        pozycje_db = db.query(models.PozycjaZamowienia).filter(models.PozycjaZamowienia.id_zamowienia == zam.id_zamowienia).all()

        pozycje_out = []
        for p in pozycje_db:
            prod = db.query(models.Produkt).filter(models.Produkt.id_produkt == p.id_produkt).first()
            pozycje_out.append({
                "nazwa": prod.nazwa if prod else "Nieznany produkt",
                "ilosc": p.ilosc,
                "cena": float(p.cena)
            })

        klient_nazwa = f"{klient.imie} {klient.nazwisko}" if klient else "Anonim"
        adres_klienta = klient.adres if klient and klient.adres else "Brak adresu"

        wyniki.append({
            "id_zamowienia": zam.id_zamowienia,
            "klient": klient_nazwa,
            "adres_dostawy": adres_klienta,
            "data_zamowienia": zam.data_zamowienia.isoformat() if zam.data_zamowienia else "",
            "kwota": float(zam.kwota),
            "status_zamowienia": zam.status_zamowienia,
            "status_platnosci": platnosc.status_platnosci if platnosc else "BRAK",
            "czy_skladka": bool(platnosc.typ if platnosc else False),
            "kod_zaproszenia": zam.kod_zaproszenia,
            "pozycje": pozycje_out
        })
    return wyniki


def update_order_status(
    db: Session,
    order_id: int,
    action: str,
    current_user: models.Uzytkownik | None = None
) -> dict:
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == order_id).first()
    if not zamowienie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zamówienie nie istnieje.")

    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == zamowienie.id_restauracja).first()
    if not current_user or (current_user.id_typ_konta != 3 and restauracja and restauracja.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do zmiany statusu zamówienia w tym lokalu.")

    platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == order_id).first()

    if action == "przyjmij":
        zamowienie.status_zamowienia = "W_REALIZACJI"
    elif action == "w_dostawie":
        zamowienie.status_zamowienia = "W_DOSTAWIE"
    elif action == "dostarczono":
        zamowienie.status_zamowienia = "DOSTARCZONE"
    elif action == "odrzuc":
        zamowienie.status_zamowienia = "ODRZUCONE"
        if platnosc:
            if platnosc.status_platnosci == "OPŁACONE":
                platnosc.status_platnosci = "OCZEKIWANIE_NA_ZWROT"
            else:
                platnosc.status_platnosci = "ANULOWANA"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowa akcja zmiany statusu.")

    db.commit()
    return {"msg": f"Status zamówienia #{order_id} zmieniony na {zamowienie.status_zamowienia}."}


def accept_order_payment(
    db: Session,
    order_id: int,
    current_user: models.Uzytkownik | None = None
) -> dict:
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == order_id).first()
    if not zamowienie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zamówienie nie istnieje.")

    restauracja = db.query(models.Restauracja).filter(models.Restauracja.id_restauracja == zamowienie.id_restauracja).first()
    if not current_user or (current_user.id_typ_konta != 3 and restauracja and restauracja.id_uzytkownik != current_user.id_uzytkownik):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do zatwierdzenia płatności.")

    platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == order_id).first()
    if not platnosc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Płatność nie istnieje.")

    platnosc.status_platnosci = "OPŁACONE"
    db.commit()
    return {"msg": "Płatność zatwierdzona"}


def get_order_settlement(db: Session, order_id: int, current_user_id: int) -> dict:
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == order_id).first()
    if not zamowienie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zamówienie nie istnieje.")

    platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == order_id).first()
    if not platnosc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Płatność nie istnieje.")

    host = zamowienie.uzytkownik
    jestes_hostem = (zamowienie.id_uzytkownik == current_user_id)

    if zamowienie.kod_zaproszenia:
        powiazane_zamowienia = db.query(models.Zamowienie).filter(
            models.Zamowienie.kod_zaproszenia == zamowienie.kod_zaproszenia
        ).all()
        laczna_kwota_calkowita = round(sum(float(z.kwota) for z in powiazane_zamowienia), 2)
        zam_ids = [z.id_zamowienia for z in powiazane_zamowienia]
        platnosci_ids = [p.id_platnosc for p in db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia.in_(zam_ids)).all()]
        osoby_db = db.query(models.OsobaPlacaca).filter(models.OsobaPlacaca.id_platnosc.in_(platnosci_ids)).all()
    else:
        laczna_kwota_calkowita = float(zamowienie.kwota)
        osoby_db = db.query(models.OsobaPlacaca).filter(models.OsobaPlacaca.id_platnosc == platnosc.id_platnosc).all()

    osoby_out = []
    twoja_kwota = 0.0
    twoje_czy_oplacone = False

    for o in osoby_db:
        u = o.uzytkownik
        is_h = (o.id_uzytkownik == zamowienie.id_uzytkownik)
        kw = float(o.kwota)
        if o.id_uzytkownik == current_user_id:
            twoja_kwota = kw
            twoje_czy_oplacone = o.czy_oplacone

        osoby_out.append({
            "id_uzytkownik": o.id_uzytkownik,
            "imie": u.imie if u else "Uczestnik",
            "nazwisko": u.nazwisko if u else "",
            "zdjecie_profilowe": u.zdjecie_profilowe if u else None,
            "numer_telefonu": u.numer_telefonu if u else None,
            "kwota": round(kw, 2),
            "czy_oplacone": o.czy_oplacone,
            "jest_hostem": is_h
        })

    if jestes_hostem and twoja_kwota == 0.0:
        twoje_czy_oplacone = True

    return {
        "id_zamowienia": zamowienie.id_zamowienia,
        "kod_zaproszenia": zamowienie.kod_zaproszenia,
        "kwota_calkowita": laczna_kwota_calkowita,
        "status_zamowienia": zamowienie.status_zamowienia,
        "status_platnosci": platnosc.status_platnosci,
        "host": {
            "id_uzytkownik": host.id_uzytkownik if host else 0,
            "imie": host.imie if host else "Gospodarz",
            "nazwisko": host.nazwisko if host else "",
            "email": host.email if host else "",
            "zdjecie_profilowe": host.zdjecie_profilowe if host else None
        },
        "twoja_kwota": round(twoja_kwota, 2),
        "twoje_czy_oplacone": twoje_czy_oplacone,
        "jestes_hostem": jestes_hostem,
        "osoby_placace": osoby_out
    }


def toggle_settlement_paid(db: Session, order_id: int, target_user_id: int, current_user: models.Uzytkownik) -> dict:
    zamowienie = db.query(models.Zamowienie).filter(models.Zamowienie.id_zamowienia == order_id).first()
    if not zamowienie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zamówienie nie istnieje.")

    if current_user.id_typ_konta != 3 and zamowienie.id_uzytkownik != current_user.id_uzytkownik:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tylko gospodarz zamówienia może potwierdzić otrzymanie wpłaty."
        )

    if zamowienie.kod_zaproszenia:
        powiazane_zamowienia = db.query(models.Zamowienie).filter(
            models.Zamowienie.kod_zaproszenia == zamowienie.kod_zaproszenia
        ).all()
        zam_ids = [z.id_zamowienia for z in powiazane_zamowienia]
        platnosci_ids = [p.id_platnosc for p in db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia.in_(zam_ids)).all()]
        osoba = db.query(models.OsobaPlacaca).filter(
            models.OsobaPlacaca.id_platnosc.in_(platnosci_ids),
            models.OsobaPlacaca.id_uzytkownik == target_user_id
        ).first()
    else:
        platnosc = db.query(models.Platnosc).filter(models.Platnosc.id_zamowienia == order_id).first()
        if not platnosc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Płatność nie istnieje.")
        osoba = db.query(models.OsobaPlacaca).filter(
            models.OsobaPlacaca.id_platnosc == platnosc.id_platnosc,
            models.OsobaPlacaca.id_uzytkownik == target_user_id
        ).first()

    if not osoba:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Osoba nie została znaleziona na liście składki.")

    osoba.czy_oplacone = not osoba.czy_oplacone
    db.commit()

    return {
        "msg": "Status opłacenia zaktualizowany",
        "id_uzytkownik": target_user_id,
        "czy_oplacone": osoba.czy_oplacone
    }
