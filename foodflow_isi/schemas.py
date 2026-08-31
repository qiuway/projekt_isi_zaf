from pydantic import BaseModel, Field
from typing import List, Optional

class RestauracjaOut(BaseModel):
    id_restauracja: int
    nazwa: str
    czynne: bool
    opis: str | None = None
    adres: str | None = None
    numer_telefonu: int | None = None
    id_uzytkownik: int | None = None

    model_config = {"from_attributes": True}

class UczestnikSkladki(BaseModel):
    id_uzytkownik: int
    kwota_deklarowana: float

class PozycjaKoszyka(BaseModel):
    id_produkt: int
    ilosc: int

class TworzenieZamowienia(BaseModel):
    id_uzytkownik: int
    id_restauracja: Optional[int] = None
    pozycje: List[PozycjaKoszyka]
    czy_skladka: bool
    uczestnicy_skladki: Optional[List[UczestnikSkladki]] = None
    typ_platnosci: str
    id_posiadany_kupon: int | None = None

class DodajDoKoszyka(BaseModel):
    id_uzytkownik: int
    id_produkt: int
    ilosc: int
    zastap_koszyk: bool = False

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
    id_typ_konta: int | None = None
    punkty: int | None = 0

    model_config = {"from_attributes": True}

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

    model_config = {"from_attributes": True}

class KuponCreateUpdate(BaseModel):
    nazwa: str
    opis: Optional[str] = None
    koszt_punktowy: int = Field(..., ge=0)
    wartosc_znizki: Optional[str] = None
    ikona: Optional[str] = "🏷️"

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
    zdjecie: Optional[str] = None
    kategoria: Optional[KategoriaOut] = None

    model_config = {"from_attributes": True}

class ProduktCreate(BaseModel):
    nazwa: str
    cena: float
    id_kategoria: int
    dostepny: bool = True
    zdjecie: Optional[str] = None

class OsiagniecieOut(BaseModel):
    id_osiagniecia: int
    nazwa: str
    opis: str | None = None
    warunek: str
    punkty: int
    ikona: str | None = None
    zdobyte: bool
    odebrane: bool

    model_config = {"from_attributes": True}

class UserRoleUpdate(BaseModel):
    id_typ_konta: int = Field(..., ge=1, le=3)

class AdminUserOut(BaseModel):
    id_uzytkownik: int
    imie: str
    nazwisko: str
    email: str
    numer_telefonu: int | None = None
    adres: str | None = None
    zdjecie_profilowe: str | None = None
    id_typ_konta: int | None = None
    punkty: int | None = 0
    liczba_zamowien: int = 0

    model_config = {"from_attributes": True}

class PlatformStatsOut(BaseModel):
    total_users: int
    total_orders: int
    total_revenue: float
    total_restaurants: int
    total_products: int

class OpiniaCreate(BaseModel):
    id_uzytkownik: int
    ocena: int = Field(..., ge=1, le=5)
    komentarz: Optional[str] = None

class OpiniaOut(BaseModel):
    id_opinia: int
    id_uzytkownik: int
    id_restauracja: int
    ocena: int
    komentarz: Optional[str] = None
    autor_nazwa: Optional[str] = None
    autor_awatar: Optional[str] = None

    model_config = {"from_attributes": True}

class RestaurantReviewsSummaryOut(BaseModel):
    id_restauracja: int
    srednia_ocen: float
    liczba_opinii: int
    opinie: List[OpiniaOut] = []


class UzytkownikMiniOut(BaseModel):
    id_uzytkownik: int
    imie: str
    nazwisko: str
    email: str
    zdjecie_profilowe: Optional[str] = None

    model_config = {"from_attributes": True}


class DolaczDoGrupy(BaseModel):
    kod_grupy: str


class DodajDoGrupyPozycja(BaseModel):
    id_produkt: int
    ilosc: int = 1
    zastap_koszyk: bool = False


class AktualizujGrupePozycja(BaseModel):
    id_pozycja_koszyka: int
    ilosc: int


class PozycjaGrupowaOut(BaseModel):
    id_pozycja_koszyka: int
    id_produkt: int
    nazwa: str
    cena: float
    ilosc: int
    cena_calkowita: float
    zdjecie: Optional[str] = None
    id_restauracja: Optional[int] = None
    restauracja_nazwa: Optional[str] = None
    dodane_przez: UzytkownikMiniOut


class UczestnikPodsumowanie(BaseModel):
    id_uzytkownik: int
    imie: str
    nazwisko: str
    zdjecie_profilowe: Optional[str] = None
    kwota_dan: float
    udzial_dostawa: float
    suma_do_zwrotu: float


class KoszykGrupowyOut(BaseModel):
    id_koszyk: int
    kod_grupy: str
    is_group: bool
    host: UzytkownikMiniOut
    uczestnicy: List[UzytkownikMiniOut]
    pozycje: List[PozycjaGrupowaOut]
    suma_dan: float
    koszt_dostawy: float
    suma_calkowita: float
    podsumowanie_uczestnikow: List[UczestnikPodsumowanie]


class OsobaPlacacaSzczegolyOut(BaseModel):
    id_uzytkownik: int
    imie: str
    nazwisko: str
    zdjecie_profilowe: Optional[str] = None
    numer_telefonu: Optional[int] = None
    kwota: float
    czy_oplacone: bool
    jest_hostem: bool


class RozliczenieSkladkiOut(BaseModel):
    id_zamowienia: int
    kod_zaproszenia: Optional[str] = None
    kwota_calkowita: float
    status_zamowienia: str
    status_platnosci: str
    host: UzytkownikMiniOut
    twoja_kwota: float
    twoje_czy_oplacone: bool
    jestes_hostem: bool
    osoby_placace: List[OsobaPlacacaSzczegolyOut]