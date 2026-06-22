CREATE TABLE typ_konta (
    id_typ_konta INT PRIMARY KEY,
    nazwa VARCHAR(30)
);

CREATE TABLE uzytkownik (
    id_uzytkownik SERIAL PRIMARY KEY,
    imie VARCHAR(30),
    nazwisko VARCHAR(30),
    email VARCHAR(50) UNIQUE,
    haslo VARCHAR(32),
    numer_telefonu INT,
    adres VARCHAR(70),
    punkty INT,
    id_typ_konta INT,
    Foreign Key (id_typ_konta) REFERENCES typ_konta(id_typ_konta)
);

CREATE TABLE osiagniecia (
    id_osiagniecia INT PRIMARY KEY,
    nazwa VARCHAR(40),
    opis TEXT
);

CREATE TABLE zdobyte_osiagniecia (
    id_uzytkownik INT,
    id_osiagniecia INT,
    data_zdobycia DATE,
    PRIMARY KEY(id_uzytkownik, id_osiagniecia),
    Foreign Key (id_uzytkownik) REFERENCES uzytkownik(id_uzytkownik),
    Foreign Key (id_osiagniecia) REFERENCES osiagniecia(id_osiagniecia)
);

CREATE TABLE kupony_sklep (
    id_kupon INT PRIMARY KEY,
    nazwa VARCHAR(50)
);

CREATE TABLE posiadane_kupony (
    id_kupon INT,
    id_uzytkownik INT,
    status_kuponu BOOLEAN,
    Foreign Key (id_kupon) REFERENCES kupony_sklep(id_kupon),
    Foreign Key (id_uzytkownik) REFERENCES uzytkownik(id_uzytkownik)
);

CREATE TABLE restauracja (
    id_restauracja SERIAL PRIMARY KEY,
    nazwa VARCHAR(30),
    opis TEXT,
    adres VARCHAR(70),
    numer_telefonu INT,
    czynne BOOLEAN
);

CREATE TABLE opinie (
    id_opinia SERIAL PRIMARY KEY,
    id_uzytkownik INT,
    id_restauracja INT,
    ocena SMALLINT,
    komentarz TEXT,
    Foreign Key (id_uzytkownik) REFERENCES uzytkownik(id_uzytkownik),
    Foreign Key (id_restauracja) REFERENCES restauracja(id_restauracja)
);

CREATE TABLE kategoria (
    id_kategoria INT PRIMARY KEY,
    nazwa VARCHAR(30) NOT NULL
);

CREATE TABLE produkt (
    id_produkt SERIAL PRIMARY KEY,
    id_restauracja INT,
    id_kategoria INT,
    nazwa VARCHAR(30),
    cena DECIMAL(10,2),
    dostepny BOOLEAN,
    Foreign Key (id_restauracja) REFERENCES restauracja(id_restauracja),
    Foreign Key (id_kategoria) REFERENCES kategoria(id_kategoria)
);

CREATE TABLE zamowienia (
    id_zamowienia SERIAL PRIMARY KEY,
    id_uzytkownik INT,
    id_restauracja INT,
    kod_zaproszenia VARCHAR(15) UNIQUE,
    kwota DECIMAL(10, 2),
    status_zamowienia VARCHAR(20),
    data_zamowienia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Foreign Key (id_uzytkownik) REFERENCES uzytkownik(id_uzytkownik),
    Foreign Key (id_restauracja) REFERENCES restauracja(id_restauracja)
);

CREATE TABLE pozycje_zamowienia (
    id_pozycje_zamowienia SERIAL PRIMARY KEY,
    id_zamowienia INT,
    id_produkt INT,
    ilosc INT,
    cena DECIMAL(10,2),
    Foreign Key (id_zamowienia) REFERENCES zamowienia(id_zamowienia),
    Foreign Key (id_produkt) REFERENCES produkt(id_produkt)
);

CREATE TABLE platnosc (
    id_platnosc SERIAL PRIMARY KEY,
    id_zamowienia INT,
    kwota DECIMAL (10, 2),
    typ BOOLEAN, --indywidualna lub składka
    status_platnosci VARCHAR(30),
    Foreign Key (id_zamowienia) REFERENCES zamowienia(id_zamowienia)
);

CREATE TABLE osoby_placace (
    id_platnosc INT,
    id_uzytkownik INT,
    kwota DECIMAL(10, 2),
    czy_oplacone BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(id_platnosc, id_uzytkownik),
    Foreign Key (id_platnosc) REFERENCES platnosc(id_platnosc),
    Foreign Key (id_uzytkownik) REFERENCES uzytkownik(id_uzytkownik)
);
