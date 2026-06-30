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
    typ_platnosci: str
    id_posiadany_kupon: int | None = None

class DodajDoKoszyka(BaseModel):
    id_uzytkownik: int
    id_produkt: int
    ilosc: int

class AktualizujKoszyk(BaseModel):
    id_uzytkownik: int
    id_produkt: int
    ilosc: int

class UzytkownikCreate(BaseModel):
    imie: str = Field(..., min_length=2)
    nazwisko: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5, pattern="^.+@.+$")
    haslo: str = Field(..., min_length=4)
    is_owner: bool = False

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
    id_typ_konta: int | None = None

class RestauracjaCreateUpdate(BaseModel):
    nazwa: str
    opis: str | None = None
    adres: str | None = None
    numer_telefonu: int | None = None
    czynne: bool = False

class KuponOut(BaseModel):
    id_kupon: int
    nazwa: str
    opis: Optional[str] = None
    koszt_punktowy: int
    wartosc_znizki: Optional[str] = None
    ikona: Optional[str] = None

    class Config:
        from_attributes = True

class ZakupKuponu(BaseModel):
    id_uzytkownik: int
    id_kupon: int

class KategoriaOut(BaseModel):
    id_kategoria: int
    nazwa: str
    model_config = {"from_attributes": True}

class ProduktOut(BaseModel):
    id_produkt: int
    id_restauracja: int
    id_kategoria: int
    nazwa: str
    cena: float
    dostepny: bool
    kategoria: Optional[KategoriaOut] = None

    model_config = {"from_attributes": True}

class ProduktCreate(BaseModel):
    nazwa: str
    cena: float
    id_kategoria: int
    dostepny: bool = True

class OsiagniecieOut(BaseModel):
    id_osiagniecia: int
    nazwa: str
    opis: str | None = None
    warunek: str
    punkty: int
    ikona: str | None = None
    zdobyte: bool
    odebrane: bool

    class Config:
        from_attributes = True