from pydantic import BaseModel
from typing import List, Optional
from pydantic import BaseModel, Field

class RestauracjaOut(BaseModel):
    id_restauracja: int
    nazwa: str
    czynne: bool
    opis: str | None = None
    adres: str | None = None

    model_config = {"from_attributes": True}

class UczestnikSkladki(BaseModel):
    id_uzytkownik: int
    kwota_deklarowana: float

class PozycjaKoszyka(BaseModel):
    id_produkt: int
    ilosc: int

class TworzenieZamowienia(BaseModel):
    id_uzytkownik: int
    id_restauracja: int
    pozycje: List[PozycjaKoszyka]
    czy_skladka: bool
    uczestnicy_skladki: Optional[List[UczestnikSkladki]] = None

class UzytkownikCreate(BaseModel):
    imie: str = Field(..., min_length=2)
    nazwisko: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5, pattern="^.+@.+$")
    haslo: str = Field(..., min_length=4)

class UzytkownikLogin(BaseModel):
    email: str
    haslo: str

class UzytkownikUpdate(BaseModel):
    imie: str
    nazwisko: str
    email: str
    numer_telefonu: int | None = None
    adres: str | None = None

class UzytkownikOut(BaseModel):
    id_uzytkownik: int
    imie: str
    nazwisko: str
    email: str
    numer_telefonu: int | None = None
    adres: str | None = None
    zdjecie_profilowe: str | None = None

    model_config = {"from_attributes": True}