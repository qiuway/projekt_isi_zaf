from sqlalchemy import Column, Integer, String, Boolean, Numeric, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Uzytkownik(Base):
    __tablename__ = "uzytkownik"
    
    id_uzytkownik = Column(Integer, primary_key=True, index=True)
    imie = Column(String(30))
    nazwisko = Column(String(30))
    email = Column(String(50), unique=True)
    haslo = Column(String(32))
    numer_telefonu = Column(Integer, nullable=True)
    adres = Column(String(70), nullable=True)
    id_typ_konta = Column(Integer, nullable=True)
    
    punkty = Column(Integer, default=0)
    
    zdjecie_profilowe = Column(String(255), nullable=True)


class Restauracja(Base):
    __tablename__ = "restauracja"

    id_restauracja = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String(30))
    opis = Column(Text)
    czynne = Column(Boolean, default=True)

    produkty = relationship("Produkt", back_populates="restauracja")


class Produkt(Base):
    __tablename__ = "produkt"

    id_produkt = Column(Integer, primary_key=True, index=True)
    id_restauracja = Column(Integer, ForeignKey("restauracja.id_restauracja"))
    nazwa = Column(String(30))
    cena = Column(Numeric(10, 2))
    dostepny = Column(Boolean, default=True)

    restauracja = relationship("Restauracja", back_populates="produkty")


class Zamowienie(Base):
    __tablename__ = "zamowienia"

    id_zamowienia = Column(Integer, primary_key=True, index=True)
    id_uzytkownik = Column(Integer, ForeignKey("uzytkownik.id_uzytkownik"))
    id_restauracja = Column(Integer, ForeignKey("restauracja.id_restauracja"))
    kod_zaproszenia = Column(String(15), unique=True, nullable=True)
    kwota = Column(Numeric(10, 2))
    status_zamowienia = Column(String(20), default="ZŁOŻONE")
    data_zamowienia = Column(DateTime, default=datetime.utcnow)


class PozycjaZamowienia(Base):
    __tablename__ = "pozycje_zamowienia"

    id_pozycje_zamowienia = Column(Integer, primary_key=True, index=True)
    id_zamowienia = Column(Integer, ForeignKey("zamowienia.id_zamowienia"))
    id_produkt = Column(Integer, ForeignKey("produkt.id_produkt"))
    ilosc = Column(Integer)
    cena = Column(Numeric(10, 2))

class Platnosc(Base):
    __tablename__ = "platnosc"

    id_platnosc = Column(Integer, primary_key=True, index=True)
    id_zamowienia = Column(Integer, ForeignKey("zamowienia.id_zamowienia"))
    kwota = Column(Numeric(10, 2))
    typ = Column(Boolean)  # False = Indywidualna, True = Składka
    status_platnosci = Column(String(30), default="OCZEKUJĄCA")


class OsobaPlacaca(Base):
    __tablename__ = "osoby_placace"

    id_platnosc = Column(Integer, ForeignKey("platnosc.id_platnosc"), primary_key=True)
    id_uzytkownik = Column(Integer, ForeignKey("uzytkownik.id_uzytkownik"), primary_key=True)
    kwota = Column(Numeric(10, 2))
    czy_oplacone = Column(Boolean, default=False)

class KuponSklep(Base):
    __tablename__ = "kupony_sklep"

    id_kupon = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String(100), nullable=False)
    opis = Column(Text, nullable=True)
    koszt_punktowy = Column(Integer, nullable=False)
    wartosc_znizki = Column(String(50), nullable=True)
    ikona = Column(String(20), nullable=True)


class PosiadanyKupon(Base):
    __tablename__ = "posiadane_kupony"

    id_posiadany_kupon = Column(Integer, primary_key=True, index=True)
    id_uzytkownik = Column(Integer, ForeignKey("uzytkownik.id_uzytkownik"), nullable=False)
    id_kupon = Column(Integer, ForeignKey("kupony_sklep.id_kupon"), nullable=False)
    wykorzystany = Column(Boolean, default=False)

    kupon = relationship("KuponSklep")

