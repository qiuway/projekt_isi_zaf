import pytest
from pydantic import ValidationError

import schemas


def test_rejestracja_wlasciciela_ma_flage_owner():
    user = schemas.UzytkownikCreate(
        imie="Jan",
        nazwisko="Kowalski",
        email="jan@example.com",
        haslo="test123",
        is_owner=True,
    )

    assert user.is_owner is True


def test_rejestracja_odrzuca_bledny_email():
    with pytest.raises(ValidationError):
        schemas.UzytkownikCreate(
            imie="Jan",
            nazwisko="Kowalski",
            email="bledny_email",
            haslo="test123",
        )


def test_tworzenie_zamowienia_przechowuje_pozycje_i_typ_platnosci():
    zamowienie = schemas.TworzenieZamowienia(
        id_uzytkownik=1,
        id_restauracja=1,
        pozycje=[schemas.PozycjaKoszyka(id_produkt=5, ilosc=2)],
        czy_skladka=False,
        typ_platnosci="offline",
    )

    assert zamowienie.pozycje[0].id_produkt == 5
    assert zamowienie.pozycje[0].ilosc == 2
    assert zamowienie.typ_platnosci == "offline"