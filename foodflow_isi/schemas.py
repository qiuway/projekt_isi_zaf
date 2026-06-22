from pydantic import BaseModel
from typing import List, Optional

class RestauracjaOut(BaseModel):
    id_restauracja: int
    nazwa: str
    czynne: bool
    opis: str | None = None
    adres: str | None = None

    model_config = {"from_attributes": True}

class PozycjaKoszyka(BaseModel):
    id_produkt: int
    ilosc: int

class UczestnikSkladki(BaseModel):
    id_uzytkownik: int
    kwota_deklarowana: float

class TworzenieZamowienia(BaseModel):
    id_uzytkownik: int
    id_restauracja: int
    pozycje: List[PozycjaKoszyka]
    czy_skladka: bool
    uczestnicy_skladki: Optional[List[UczestnikSkladki]] = None

class UzytkownikCreate(BaseModel):
    imie: str
    nazwisko: str
    email: str
    haslo: str

class UzytkownikLogin(BaseModel):
    email: str
    haslo: str