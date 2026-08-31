--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.zdobyte_osiagniecia DROP CONSTRAINT IF EXISTS zdobyte_osiagniecia_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.zdobyte_osiagniecia DROP CONSTRAINT IF EXISTS zdobyte_osiagniecia_id_osiagniecia_fkey;
ALTER TABLE IF EXISTS ONLY public.zamowienia DROP CONSTRAINT IF EXISTS zamowienia_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.zamowienia DROP CONSTRAINT IF EXISTS zamowienia_id_restauracja_fkey;
ALTER TABLE IF EXISTS ONLY public.uzytkownik DROP CONSTRAINT IF EXISTS uzytkownik_id_typ_konta_fkey;
ALTER TABLE IF EXISTS ONLY public.uczestnicy_koszyka DROP CONSTRAINT IF EXISTS uczestnicy_koszyka_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.uczestnicy_koszyka DROP CONSTRAINT IF EXISTS uczestnicy_koszyka_id_koszyk_fkey;
ALTER TABLE IF EXISTS ONLY public.restauracja DROP CONSTRAINT IF EXISTS restauracja_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.produkt DROP CONSTRAINT IF EXISTS produkt_id_restauracja_fkey;
ALTER TABLE IF EXISTS ONLY public.produkt DROP CONSTRAINT IF EXISTS produkt_id_kategoria_fkey;
ALTER TABLE IF EXISTS ONLY public.pozycje_zamowienia DROP CONSTRAINT IF EXISTS pozycje_zamowienia_id_zamowienia_fkey;
ALTER TABLE IF EXISTS ONLY public.pozycje_zamowienia DROP CONSTRAINT IF EXISTS pozycje_zamowienia_id_produkt_fkey;
ALTER TABLE IF EXISTS ONLY public.pozycje_koszyka DROP CONSTRAINT IF EXISTS pozycje_koszyka_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.pozycje_koszyka DROP CONSTRAINT IF EXISTS pozycje_koszyka_id_produkt_fkey;
ALTER TABLE IF EXISTS ONLY public.pozycje_koszyka DROP CONSTRAINT IF EXISTS pozycje_koszyka_id_koszyk_fkey;
ALTER TABLE IF EXISTS ONLY public.posiadane_kupony DROP CONSTRAINT IF EXISTS posiadane_kupony_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.posiadane_kupony DROP CONSTRAINT IF EXISTS posiadane_kupony_id_kupon_fkey;
ALTER TABLE IF EXISTS ONLY public.platnosc DROP CONSTRAINT IF EXISTS platnosc_id_zamowienia_fkey;
ALTER TABLE IF EXISTS ONLY public.osoby_placace DROP CONSTRAINT IF EXISTS osoby_placace_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.osoby_placace DROP CONSTRAINT IF EXISTS osoby_placace_id_platnosc_fkey;
ALTER TABLE IF EXISTS ONLY public.opinie DROP CONSTRAINT IF EXISTS opinie_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.opinie DROP CONSTRAINT IF EXISTS opinie_id_restauracja_fkey;
ALTER TABLE IF EXISTS ONLY public.koszyk DROP CONSTRAINT IF EXISTS koszyk_id_uzytkownik_fkey;
ALTER TABLE IF EXISTS ONLY public.zdobyte_osiagniecia DROP CONSTRAINT IF EXISTS zdobyte_osiagniecia_pkey;
ALTER TABLE IF EXISTS ONLY public.zamowienia DROP CONSTRAINT IF EXISTS zamowienia_pkey;
ALTER TABLE IF EXISTS ONLY public.uzytkownik DROP CONSTRAINT IF EXISTS uzytkownik_pkey;
ALTER TABLE IF EXISTS ONLY public.uzytkownik DROP CONSTRAINT IF EXISTS uzytkownik_email_key;
ALTER TABLE IF EXISTS ONLY public.uczestnicy_koszyka DROP CONSTRAINT IF EXISTS uczestnicy_koszyka_pkey;
ALTER TABLE IF EXISTS ONLY public.typ_konta DROP CONSTRAINT IF EXISTS typ_konta_pkey;
ALTER TABLE IF EXISTS ONLY public.restauracja DROP CONSTRAINT IF EXISTS restauracja_pkey;
ALTER TABLE IF EXISTS ONLY public.produkt DROP CONSTRAINT IF EXISTS produkt_pkey;
ALTER TABLE IF EXISTS ONLY public.pozycje_zamowienia DROP CONSTRAINT IF EXISTS pozycje_zamowienia_pkey;
ALTER TABLE IF EXISTS ONLY public.pozycje_koszyka DROP CONSTRAINT IF EXISTS pozycje_koszyka_pkey;
ALTER TABLE IF EXISTS ONLY public.posiadane_kupony DROP CONSTRAINT IF EXISTS posiadane_kupony_pkey;
ALTER TABLE IF EXISTS ONLY public.platnosc DROP CONSTRAINT IF EXISTS platnosc_pkey;
ALTER TABLE IF EXISTS ONLY public.osoby_placace DROP CONSTRAINT IF EXISTS osoby_placace_pkey;
ALTER TABLE IF EXISTS ONLY public.osiagniecia DROP CONSTRAINT IF EXISTS osiagniecia_pkey;
ALTER TABLE IF EXISTS ONLY public.opinie DROP CONSTRAINT IF EXISTS opinie_pkey;
ALTER TABLE IF EXISTS ONLY public.kupony_sklep DROP CONSTRAINT IF EXISTS kupony_sklep_pkey;
ALTER TABLE IF EXISTS ONLY public.koszyk DROP CONSTRAINT IF EXISTS koszyk_pkey;
ALTER TABLE IF EXISTS ONLY public.kategoria DROP CONSTRAINT IF EXISTS kategoria_pkey;
ALTER TABLE IF EXISTS public.zdobyte_osiagniecia ALTER COLUMN id_zdobyte_osiagniecie DROP DEFAULT;
ALTER TABLE IF EXISTS public.zamowienia ALTER COLUMN id_zamowienia DROP DEFAULT;
ALTER TABLE IF EXISTS public.uzytkownik ALTER COLUMN id_uzytkownik DROP DEFAULT;
ALTER TABLE IF EXISTS public.uczestnicy_koszyka ALTER COLUMN id_uczestnik DROP DEFAULT;
ALTER TABLE IF EXISTS public.restauracja ALTER COLUMN id_restauracja DROP DEFAULT;
ALTER TABLE IF EXISTS public.produkt ALTER COLUMN id_produkt DROP DEFAULT;
ALTER TABLE IF EXISTS public.pozycje_zamowienia ALTER COLUMN id_pozycje_zamowienia DROP DEFAULT;
ALTER TABLE IF EXISTS public.pozycje_koszyka ALTER COLUMN id_pozycja_koszyka DROP DEFAULT;
ALTER TABLE IF EXISTS public.posiadane_kupony ALTER COLUMN id_posiadany_kupon DROP DEFAULT;
ALTER TABLE IF EXISTS public.platnosc ALTER COLUMN id_platnosc DROP DEFAULT;
ALTER TABLE IF EXISTS public.osiagniecia ALTER COLUMN id_osiagniecia DROP DEFAULT;
ALTER TABLE IF EXISTS public.opinie ALTER COLUMN id_opinia DROP DEFAULT;
ALTER TABLE IF EXISTS public.kupony_sklep ALTER COLUMN id_kupon DROP DEFAULT;
ALTER TABLE IF EXISTS public.koszyk ALTER COLUMN id_koszyk DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq;
DROP TABLE IF EXISTS public.zdobyte_osiagniecia;
DROP SEQUENCE IF EXISTS public.zamowienia_id_zamowienia_seq;
DROP TABLE IF EXISTS public.zamowienia;
DROP SEQUENCE IF EXISTS public.uzytkownik_id_uzytkownik_seq;
DROP TABLE IF EXISTS public.uzytkownik;
DROP SEQUENCE IF EXISTS public.uczestnicy_koszyka_id_uczestnik_seq;
DROP TABLE IF EXISTS public.uczestnicy_koszyka;
DROP TABLE IF EXISTS public.typ_konta;
DROP SEQUENCE IF EXISTS public.restauracja_id_restauracja_seq;
DROP TABLE IF EXISTS public.restauracja;
DROP SEQUENCE IF EXISTS public.produkt_id_produkt_seq;
DROP TABLE IF EXISTS public.produkt;
DROP SEQUENCE IF EXISTS public.pozycje_zamowienia_id_pozycje_zamowienia_seq;
DROP TABLE IF EXISTS public.pozycje_zamowienia;
DROP SEQUENCE IF EXISTS public.pozycje_koszyka_id_pozycja_koszyka_seq;
DROP TABLE IF EXISTS public.pozycje_koszyka;
DROP SEQUENCE IF EXISTS public.posiadane_kupony_id_posiadany_kupon_seq;
DROP TABLE IF EXISTS public.posiadane_kupony;
DROP SEQUENCE IF EXISTS public.platnosc_id_platnosc_seq;
DROP TABLE IF EXISTS public.platnosc;
DROP TABLE IF EXISTS public.osoby_placace;
DROP SEQUENCE IF EXISTS public.osiagniecia_id_osiagniecia_seq;
DROP TABLE IF EXISTS public.osiagniecia;
DROP SEQUENCE IF EXISTS public.opinie_id_opinia_seq;
DROP TABLE IF EXISTS public.opinie;
DROP SEQUENCE IF EXISTS public.kupony_sklep_id_kupon_seq;
DROP TABLE IF EXISTS public.kupony_sklep;
DROP SEQUENCE IF EXISTS public.koszyk_id_koszyk_seq;
DROP TABLE IF EXISTS public.koszyk;
DROP TABLE IF EXISTS public.kategoria;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: kategoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kategoria (
    id_kategoria integer NOT NULL,
    nazwa character varying(30) NOT NULL
);


--
-- Name: koszyk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.koszyk (
    id_koszyk integer NOT NULL,
    id_uzytkownik integer,
    kod_grupy character varying(15),
    is_group boolean DEFAULT false
);


--
-- Name: koszyk_id_koszyk_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.koszyk_id_koszyk_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: koszyk_id_koszyk_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.koszyk_id_koszyk_seq OWNED BY public.koszyk.id_koszyk;


--
-- Name: kupony_sklep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kupony_sklep (
    id_kupon integer NOT NULL,
    nazwa character varying(100),
    opis text,
    koszt_punktowy integer,
    wartosc_znizki character varying(50),
    ikona character varying(20)
);


--
-- Name: kupony_sklep_id_kupon_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kupony_sklep_id_kupon_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kupony_sklep_id_kupon_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kupony_sklep_id_kupon_seq OWNED BY public.kupony_sklep.id_kupon;


--
-- Name: opinie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opinie (
    id_opinia integer NOT NULL,
    id_uzytkownik integer,
    id_restauracja integer,
    ocena smallint,
    komentarz text
);


--
-- Name: opinie_id_opinia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.opinie_id_opinia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: opinie_id_opinia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.opinie_id_opinia_seq OWNED BY public.opinie.id_opinia;


--
-- Name: osiagniecia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.osiagniecia (
    id_osiagniecia integer NOT NULL,
    nazwa character varying(100) NOT NULL,
    opis text,
    warunek character varying(100) NOT NULL,
    punkty integer NOT NULL,
    ikona character varying(20)
);


--
-- Name: osiagniecia_id_osiagniecia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.osiagniecia_id_osiagniecia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: osiagniecia_id_osiagniecia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.osiagniecia_id_osiagniecia_seq OWNED BY public.osiagniecia.id_osiagniecia;


--
-- Name: osoby_placace; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.osoby_placace (
    id_platnosc integer NOT NULL,
    id_uzytkownik integer NOT NULL,
    kwota numeric(10,2),
    czy_oplacone boolean DEFAULT false
);


--
-- Name: platnosc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platnosc (
    id_platnosc integer NOT NULL,
    id_zamowienia integer,
    kwota numeric(10,2),
    typ boolean,
    status_platnosci character varying(30)
);


--
-- Name: platnosc_id_platnosc_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.platnosc_id_platnosc_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: platnosc_id_platnosc_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.platnosc_id_platnosc_seq OWNED BY public.platnosc.id_platnosc;


--
-- Name: posiadane_kupony; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posiadane_kupony (
    id_posiadany_kupon integer NOT NULL,
    id_uzytkownik integer,
    id_kupon integer,
    wykorzystany boolean DEFAULT false
);


--
-- Name: posiadane_kupony_id_posiadany_kupon_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posiadane_kupony_id_posiadany_kupon_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posiadane_kupony_id_posiadany_kupon_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posiadane_kupony_id_posiadany_kupon_seq OWNED BY public.posiadane_kupony.id_posiadany_kupon;


--
-- Name: pozycje_koszyka; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pozycje_koszyka (
    id_pozycja_koszyka integer NOT NULL,
    id_koszyk integer,
    id_produkt integer,
    ilosc integer,
    id_uzytkownik integer
);


--
-- Name: pozycje_koszyka_id_pozycja_koszyka_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pozycje_koszyka_id_pozycja_koszyka_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pozycje_koszyka_id_pozycja_koszyka_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pozycje_koszyka_id_pozycja_koszyka_seq OWNED BY public.pozycje_koszyka.id_pozycja_koszyka;


--
-- Name: pozycje_zamowienia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pozycje_zamowienia (
    id_pozycje_zamowienia integer NOT NULL,
    id_zamowienia integer,
    id_produkt integer,
    ilosc integer,
    cena numeric(10,2)
);


--
-- Name: pozycje_zamowienia_id_pozycje_zamowienia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pozycje_zamowienia_id_pozycje_zamowienia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pozycje_zamowienia_id_pozycje_zamowienia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pozycje_zamowienia_id_pozycje_zamowienia_seq OWNED BY public.pozycje_zamowienia.id_pozycje_zamowienia;


--
-- Name: produkt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produkt (
    id_produkt integer NOT NULL,
    id_restauracja integer,
    id_kategoria integer,
    nazwa character varying(30),
    cena numeric(10,2),
    dostepny boolean,
    zdjecie character varying(255)
);


--
-- Name: produkt_id_produkt_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.produkt_id_produkt_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: produkt_id_produkt_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.produkt_id_produkt_seq OWNED BY public.produkt.id_produkt;


--
-- Name: restauracja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restauracja (
    id_restauracja integer NOT NULL,
    nazwa character varying(30),
    opis text,
    adres character varying(70),
    numer_telefonu integer,
    czynne boolean,
    id_uzytkownik integer
);


--
-- Name: restauracja_id_restauracja_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.restauracja_id_restauracja_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: restauracja_id_restauracja_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.restauracja_id_restauracja_seq OWNED BY public.restauracja.id_restauracja;


--
-- Name: typ_konta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.typ_konta (
    id_typ_konta integer NOT NULL,
    nazwa character varying(30)
);


--
-- Name: uczestnicy_koszyka; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uczestnicy_koszyka (
    id_uczestnik integer NOT NULL,
    id_koszyk integer NOT NULL,
    id_uzytkownik integer NOT NULL,
    data_dolaczenia timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: uczestnicy_koszyka_id_uczestnik_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uczestnicy_koszyka_id_uczestnik_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uczestnicy_koszyka_id_uczestnik_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uczestnicy_koszyka_id_uczestnik_seq OWNED BY public.uczestnicy_koszyka.id_uczestnik;


--
-- Name: uzytkownik; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uzytkownik (
    id_uzytkownik integer NOT NULL,
    imie character varying(30),
    nazwisko character varying(30),
    email character varying(50),
    haslo character varying(255),
    numer_telefonu integer,
    adres character varying(70),
    punkty integer,
    id_typ_konta integer,
    zdjecie_profilowe character varying(255)
);


--
-- Name: uzytkownik_id_uzytkownik_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.uzytkownik_id_uzytkownik_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: uzytkownik_id_uzytkownik_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.uzytkownik_id_uzytkownik_seq OWNED BY public.uzytkownik.id_uzytkownik;


--
-- Name: zamowienia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zamowienia (
    id_zamowienia integer NOT NULL,
    id_uzytkownik integer,
    id_restauracja integer,
    kod_zaproszenia character varying(15),
    kwota numeric(10,2),
    status_zamowienia character varying(20),
    data_zamowienia timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: zamowienia_id_zamowienia_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.zamowienia_id_zamowienia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: zamowienia_id_zamowienia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.zamowienia_id_zamowienia_seq OWNED BY public.zamowienia.id_zamowienia;


--
-- Name: zdobyte_osiagniecia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zdobyte_osiagniecia (
    id_zdobyte_osiagniecie integer NOT NULL,
    id_uzytkownik integer NOT NULL,
    id_osiagniecia integer NOT NULL,
    odebrane boolean DEFAULT false
);


--
-- Name: zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq OWNED BY public.zdobyte_osiagniecia.id_zdobyte_osiagniecie;


--
-- Name: koszyk id_koszyk; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.koszyk ALTER COLUMN id_koszyk SET DEFAULT nextval('public.koszyk_id_koszyk_seq'::regclass);


--
-- Name: kupony_sklep id_kupon; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kupony_sklep ALTER COLUMN id_kupon SET DEFAULT nextval('public.kupony_sklep_id_kupon_seq'::regclass);


--
-- Name: opinie id_opinia; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opinie ALTER COLUMN id_opinia SET DEFAULT nextval('public.opinie_id_opinia_seq'::regclass);


--
-- Name: osiagniecia id_osiagniecia; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.osiagniecia ALTER COLUMN id_osiagniecia SET DEFAULT nextval('public.osiagniecia_id_osiagniecia_seq'::regclass);


--
-- Name: platnosc id_platnosc; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platnosc ALTER COLUMN id_platnosc SET DEFAULT nextval('public.platnosc_id_platnosc_seq'::regclass);


--
-- Name: posiadane_kupony id_posiadany_kupon; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posiadane_kupony ALTER COLUMN id_posiadany_kupon SET DEFAULT nextval('public.posiadane_kupony_id_posiadany_kupon_seq'::regclass);


--
-- Name: pozycje_koszyka id_pozycja_koszyka; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_koszyka ALTER COLUMN id_pozycja_koszyka SET DEFAULT nextval('public.pozycje_koszyka_id_pozycja_koszyka_seq'::regclass);


--
-- Name: pozycje_zamowienia id_pozycje_zamowienia; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_zamowienia ALTER COLUMN id_pozycje_zamowienia SET DEFAULT nextval('public.pozycje_zamowienia_id_pozycje_zamowienia_seq'::regclass);


--
-- Name: produkt id_produkt; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produkt ALTER COLUMN id_produkt SET DEFAULT nextval('public.produkt_id_produkt_seq'::regclass);


--
-- Name: restauracja id_restauracja; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restauracja ALTER COLUMN id_restauracja SET DEFAULT nextval('public.restauracja_id_restauracja_seq'::regclass);


--
-- Name: uczestnicy_koszyka id_uczestnik; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uczestnicy_koszyka ALTER COLUMN id_uczestnik SET DEFAULT nextval('public.uczestnicy_koszyka_id_uczestnik_seq'::regclass);


--
-- Name: uzytkownik id_uzytkownik; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uzytkownik ALTER COLUMN id_uzytkownik SET DEFAULT nextval('public.uzytkownik_id_uzytkownik_seq'::regclass);


--
-- Name: zamowienia id_zamowienia; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zamowienia ALTER COLUMN id_zamowienia SET DEFAULT nextval('public.zamowienia_id_zamowienia_seq'::regclass);


--
-- Name: zdobyte_osiagniecia id_zdobyte_osiagniecie; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zdobyte_osiagniecia ALTER COLUMN id_zdobyte_osiagniecie SET DEFAULT nextval('public.zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq'::regclass);


--
-- Data for Name: kategoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kategoria (id_kategoria, nazwa) FROM stdin;
1	Dania główne
2	Zupy
3	Przystawki
4	Napoje
5	Desery
6	Fast Food
\.


--
-- Data for Name: koszyk; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.koszyk (id_koszyk, id_uzytkownik, kod_grupy, is_group) FROM stdin;
1	1	\N	f
2	3	\N	f
4	4	\N	f
\.


--
-- Data for Name: kupony_sklep; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kupony_sklep (id_kupon, nazwa, opis, koszt_punktowy, wartosc_znizki, ikona) FROM stdin;
1	sigma123	skibidi	1	100%	🏷️
\.


--
-- Data for Name: opinie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opinie (id_opinia, id_uzytkownik, id_restauracja, ocena, komentarz) FROM stdin;
1	1	1	5	sigma
2	4	1	1	gowno
\.


--
-- Data for Name: osiagniecia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.osiagniecia (id_osiagniecia, nazwa, opis, warunek, punkty, ikona) FROM stdin;
1	Pierwsze zamówienie	Złóż swoje pierwsze zamówienie.	pierwsze_zamowienie	100	🍔
2	Łowca rabatów	Kup pierwszy kupon w sklepie za punkty.	pierwszy_kupon	75	🏷️
3	Uzupełniony profil	Uzupełnij dane profilu użytkownika.	profil_uzupelniony	50	👤
4	Zdjęcie profilowe	Dodaj zdjęcie profilowe.	avatar_dodany	50	📷
5	Stały klient	Złóż co najmniej 3 zamówienia.	trzy_zamowienia	150	⭐
\.


--
-- Data for Name: osoby_placace; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.osoby_placace (id_platnosc, id_uzytkownik, kwota, czy_oplacone) FROM stdin;
1	1	50.00	t
2	1	50.00	t
3	1	50.00	t
4	1	50.00	t
10	4	0.00	f
10	1	54.00	t
11	4	104.00	t
11	1	54.00	f
12	4	104.00	t
12	1	54.00	f
15	4	54.00	t
15	1	258.00	t
19	4	2445.00	t
19	1	54.00	f
\.


--
-- Data for Name: platnosc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platnosc (id_platnosc, id_zamowienia, kwota, typ, status_platnosci) FROM stdin;
1	1	50.00	f	OCZEKUJĄCA
2	2	50.00	f	OPŁACONE
3	3	50.00	f	PRZY_ODBIORZE
4	4	50.00	f	OPŁACONE
5	5	7.99	f	OCZEKUJĄCA
7	7	57.99	f	PRZY_ODBIORZE
8	8	57.99	f	PRZY_ODBIORZE
6	6	57.99	f	OPŁACONE
9	9	57.99	f	OPŁACONE
10	10	57.99	t	OPŁACONE
11	11	157.99	t	OPŁACONE
12	12	157.99	t	PRZY_ODBIORZE
13	13	102.26	t	PRZY_ODBIORZE
14	15	51.31	t	PRZY_ODBIORZE
15	17	51.31	t	PRZY_ODBIORZE
16	18	260.68	t	PRZY_ODBIORZE
17	19	57.99	f	PRZY_ODBIORZE
18	20	57.99	f	OPŁACONE
19	21	2244.18	t	PRZY_ODBIORZE
20	22	254.81	t	PRZY_ODBIORZE
\.


--
-- Data for Name: posiadane_kupony; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posiadane_kupony (id_posiadany_kupon, id_uzytkownik, id_kupon, wykorzystany) FROM stdin;
1	1	1	t
2	1	1	f
3	1	1	f
\.


--
-- Data for Name: pozycje_koszyka; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pozycje_koszyka (id_pozycja_koszyka, id_koszyk, id_produkt, ilosc, id_uzytkownik) FROM stdin;
\.


--
-- Data for Name: pozycje_zamowienia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pozycje_zamowienia (id_pozycje_zamowienia, id_zamowienia, id_produkt, ilosc, cena) FROM stdin;
1	1	1	1	50.00
2	2	1	1	50.00
3	3	1	1	50.00
4	4	1	1	50.00
5	5	1	1	50.00
6	5	2	1	2137.00
7	6	1	1	50.00
8	7	1	1	50.00
9	8	1	1	50.00
10	9	1	1	50.00
11	10	1	1	50.00
12	11	1	1	50.00
13	11	1	2	50.00
14	12	1	1	50.00
15	12	1	2	50.00
16	13	1	1	50.00
17	13	1	1	50.00
18	15	1	1	50.00
19	17	1	1	50.00
20	18	3	1	254.00
21	19	1	1	50.00
22	20	1	1	50.00
23	21	1	1	50.00
24	21	2	1	2137.00
25	21	1	1	50.00
26	22	3	1	254.00
\.


--
-- Data for Name: produkt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.produkt (id_produkt, id_restauracja, id_kategoria, nazwa, cena, dostepny, zdjecie) FROM stdin;
1	1	6	pizza	50.00	t	/static/products/prod_1_solace.jpg
2	1	2	Test danie bez zdj	2137.00	t	\N
3	2	1	test 2	254.00	t	\N
\.


--
-- Data for Name: restauracja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.restauracja (id_restauracja, nazwa, opis, adres, numer_telefonu, czynne, id_uzytkownik) FROM stdin;
1	Skibidi	skiobidi	kielce	123456789	t	2
2	test	\N	test	12312312	t	1
\.


--
-- Data for Name: typ_konta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.typ_konta (id_typ_konta, nazwa) FROM stdin;
1	Klient
2	Właściciel restauracji
3	Administrator
\.


--
-- Data for Name: uczestnicy_koszyka; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uczestnicy_koszyka (id_uczestnik, id_koszyk, id_uzytkownik, data_dolaczenia) FROM stdin;
\.


--
-- Data for Name: uzytkownik; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.uzytkownik (id_uzytkownik, imie, nazwisko, email, haslo, numer_telefonu, adres, punkty, id_typ_konta, zdjecie_profilowe) FROM stdin;
2	test	test	test2@test.com	test	\N	\N	0	2	\N
3	Kamil	Derszniak	kamil.derszniak@gmail.com	\N	\N	łąkowa 10	0	1	https://lh3.googleusercontent.com/a/ACg8ocJtd_4stdZLCRdIP1-dnCOZh6KH4iBwYCkL_Sgf1PETxaPEtw=s96-c
4	admin	admin	admin@admin.com	pbkdf2_sha256$3a480795d212c58fda006af9fc7e7872$ba5d51aaed6b407abd202602d0420f076e15270ece2dc92b231b57dfcfce37f9	\N	1234	10299	3	\N
1	Kamil	Derszniak	test@test.com	pbkdf2_sha256$5e050fd66536199ba5f33ba02ae70027$206e70c444d702c48bdce4bd49b4d1f0dc4632a8e76e9b8b5338899126aa4e23	\N	Łąkowa 10	422	3	/static/avatars/avatar_1.png
\.


--
-- Data for Name: zamowienia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zamowienia (id_zamowienia, id_uzytkownik, id_restauracja, kod_zaproszenia, kwota, status_zamowienia, data_zamowienia) FROM stdin;
1	1	1	\N	50.00	ZŁOŻONE	2026-08-25 14:52:34.258824
2	1	1	\N	50.00	ZŁOŻONE	2026-08-25 17:07:43.01894
3	1	1	\N	50.00	ZŁOŻONE	2026-08-25 17:10:17.970267
4	1	1	\N	50.00	ZŁOŻONE	2026-08-25 17:23:01.740875
5	1	1	\N	7.99	ZŁOŻONE	2026-08-26 14:08:10.246856
6	3	1	\N	57.99	ZŁOŻONE	2026-08-26 14:51:01.164928
7	1	1	\N	57.99	ZŁOŻONE	2026-08-26 17:34:04.896869
8	1	1	\N	57.99	DOSTARCZONE	2026-08-26 17:36:30.953285
9	4	1	\N	57.99	DOSTARCZONE	2026-08-26 18:24:29.127935
10	1	1	D353CF98	57.99	ZŁOŻONE	2026-08-26 19:06:49.679836
11	4	1	FF-45EDB8	157.99	ZŁOŻONE	2026-08-26 19:11:27.859225
12	4	1	FF-7D9227	157.99	ZŁOŻONE	2026-08-26 19:21:22.696011
13	4	1	FF-500C33	102.26	ZŁOŻONE	2026-08-26 19:41:19.797189
15	4	1	FF-51BF8E	51.31	ZŁOŻONE	2026-08-26 19:42:10.458045
17	4	1	FF-51BF8E	51.31	ZŁOŻONE	2026-08-26 19:43:45.5764
19	4	1	\N	57.99	DOSTARCZONE	2026-08-26 19:44:39.674571
18	4	2	FF-51BF8E	260.68	W_REALIZACJI	2026-08-26 19:43:45.589136
20	4	1	\N	57.99	DOSTARCZONE	2026-08-26 20:09:47.497466
21	4	1	FF-ECBF4E	2244.18	ZŁOŻONE	2026-08-26 20:11:06.359733
22	4	2	FF-ECBF4E	254.81	ZŁOŻONE	2026-08-26 20:11:06.368259
\.


--
-- Data for Name: zdobyte_osiagniecia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zdobyte_osiagniecia (id_zdobyte_osiagniecie, id_uzytkownik, id_osiagniecia, odebrane) FROM stdin;
2	1	1	t
1	1	3	t
4	1	5	t
3	1	4	t
6	3	4	f
7	3	3	f
8	3	1	f
5	1	2	t
10	4	1	t
9	4	3	t
11	4	5	t
\.


--
-- Name: koszyk_id_koszyk_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.koszyk_id_koszyk_seq', 7, true);


--
-- Name: kupony_sklep_id_kupon_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kupony_sklep_id_kupon_seq', 1, true);


--
-- Name: opinie_id_opinia_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.opinie_id_opinia_seq', 2, true);


--
-- Name: osiagniecia_id_osiagniecia_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.osiagniecia_id_osiagniecia_seq', 5, true);


--
-- Name: platnosc_id_platnosc_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.platnosc_id_platnosc_seq', 20, true);


--
-- Name: posiadane_kupony_id_posiadany_kupon_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.posiadane_kupony_id_posiadany_kupon_seq', 3, true);


--
-- Name: pozycje_koszyka_id_pozycja_koszyka_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pozycje_koszyka_id_pozycja_koszyka_seq', 32, true);


--
-- Name: pozycje_zamowienia_id_pozycje_zamowienia_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pozycje_zamowienia_id_pozycje_zamowienia_seq', 26, true);


--
-- Name: produkt_id_produkt_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.produkt_id_produkt_seq', 3, true);


--
-- Name: restauracja_id_restauracja_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.restauracja_id_restauracja_seq', 2, true);


--
-- Name: uczestnicy_koszyka_id_uczestnik_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.uczestnicy_koszyka_id_uczestnik_seq', 13, true);


--
-- Name: uzytkownik_id_uzytkownik_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.uzytkownik_id_uzytkownik_seq', 4, true);


--
-- Name: zamowienia_id_zamowienia_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.zamowienia_id_zamowienia_seq', 22, true);


--
-- Name: zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.zdobyte_osiagniecia_id_zdobyte_osiagniecie_seq', 11, true);


--
-- Name: kategoria kategoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kategoria
    ADD CONSTRAINT kategoria_pkey PRIMARY KEY (id_kategoria);


--
-- Name: koszyk koszyk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.koszyk
    ADD CONSTRAINT koszyk_pkey PRIMARY KEY (id_koszyk);


--
-- Name: kupony_sklep kupony_sklep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kupony_sklep
    ADD CONSTRAINT kupony_sklep_pkey PRIMARY KEY (id_kupon);


--
-- Name: opinie opinie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opinie
    ADD CONSTRAINT opinie_pkey PRIMARY KEY (id_opinia);


--
-- Name: osiagniecia osiagniecia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.osiagniecia
    ADD CONSTRAINT osiagniecia_pkey PRIMARY KEY (id_osiagniecia);


--
-- Name: osoby_placace osoby_placace_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.osoby_placace
    ADD CONSTRAINT osoby_placace_pkey PRIMARY KEY (id_platnosc, id_uzytkownik);


--
-- Name: platnosc platnosc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platnosc
    ADD CONSTRAINT platnosc_pkey PRIMARY KEY (id_platnosc);


--
-- Name: posiadane_kupony posiadane_kupony_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posiadane_kupony
    ADD CONSTRAINT posiadane_kupony_pkey PRIMARY KEY (id_posiadany_kupon);


--
-- Name: pozycje_koszyka pozycje_koszyka_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_koszyka
    ADD CONSTRAINT pozycje_koszyka_pkey PRIMARY KEY (id_pozycja_koszyka);


--
-- Name: pozycje_zamowienia pozycje_zamowienia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_zamowienia
    ADD CONSTRAINT pozycje_zamowienia_pkey PRIMARY KEY (id_pozycje_zamowienia);


--
-- Name: produkt produkt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produkt
    ADD CONSTRAINT produkt_pkey PRIMARY KEY (id_produkt);


--
-- Name: restauracja restauracja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restauracja
    ADD CONSTRAINT restauracja_pkey PRIMARY KEY (id_restauracja);


--
-- Name: typ_konta typ_konta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.typ_konta
    ADD CONSTRAINT typ_konta_pkey PRIMARY KEY (id_typ_konta);


--
-- Name: uczestnicy_koszyka uczestnicy_koszyka_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uczestnicy_koszyka
    ADD CONSTRAINT uczestnicy_koszyka_pkey PRIMARY KEY (id_uczestnik);


--
-- Name: uzytkownik uzytkownik_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uzytkownik
    ADD CONSTRAINT uzytkownik_email_key UNIQUE (email);


--
-- Name: uzytkownik uzytkownik_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uzytkownik
    ADD CONSTRAINT uzytkownik_pkey PRIMARY KEY (id_uzytkownik);


--
-- Name: zamowienia zamowienia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zamowienia
    ADD CONSTRAINT zamowienia_pkey PRIMARY KEY (id_zamowienia);


--
-- Name: zdobyte_osiagniecia zdobyte_osiagniecia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zdobyte_osiagniecia
    ADD CONSTRAINT zdobyte_osiagniecia_pkey PRIMARY KEY (id_zdobyte_osiagniecie);


--
-- Name: koszyk koszyk_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.koszyk
    ADD CONSTRAINT koszyk_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- Name: opinie opinie_id_restauracja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opinie
    ADD CONSTRAINT opinie_id_restauracja_fkey FOREIGN KEY (id_restauracja) REFERENCES public.restauracja(id_restauracja);


--
-- Name: opinie opinie_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opinie
    ADD CONSTRAINT opinie_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- Name: osoby_placace osoby_placace_id_platnosc_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.osoby_placace
    ADD CONSTRAINT osoby_placace_id_platnosc_fkey FOREIGN KEY (id_platnosc) REFERENCES public.platnosc(id_platnosc);


--
-- Name: osoby_placace osoby_placace_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.osoby_placace
    ADD CONSTRAINT osoby_placace_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- Name: platnosc platnosc_id_zamowienia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platnosc
    ADD CONSTRAINT platnosc_id_zamowienia_fkey FOREIGN KEY (id_zamowienia) REFERENCES public.zamowienia(id_zamowienia);


--
-- Name: posiadane_kupony posiadane_kupony_id_kupon_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posiadane_kupony
    ADD CONSTRAINT posiadane_kupony_id_kupon_fkey FOREIGN KEY (id_kupon) REFERENCES public.kupony_sklep(id_kupon);


--
-- Name: posiadane_kupony posiadane_kupony_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posiadane_kupony
    ADD CONSTRAINT posiadane_kupony_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- Name: pozycje_koszyka pozycje_koszyka_id_koszyk_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_koszyka
    ADD CONSTRAINT pozycje_koszyka_id_koszyk_fkey FOREIGN KEY (id_koszyk) REFERENCES public.koszyk(id_koszyk);


--
-- Name: pozycje_koszyka pozycje_koszyka_id_produkt_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_koszyka
    ADD CONSTRAINT pozycje_koszyka_id_produkt_fkey FOREIGN KEY (id_produkt) REFERENCES public.produkt(id_produkt);


--
-- Name: pozycje_koszyka pozycje_koszyka_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_koszyka
    ADD CONSTRAINT pozycje_koszyka_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- Name: pozycje_zamowienia pozycje_zamowienia_id_produkt_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_zamowienia
    ADD CONSTRAINT pozycje_zamowienia_id_produkt_fkey FOREIGN KEY (id_produkt) REFERENCES public.produkt(id_produkt);


--
-- Name: pozycje_zamowienia pozycje_zamowienia_id_zamowienia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pozycje_zamowienia
    ADD CONSTRAINT pozycje_zamowienia_id_zamowienia_fkey FOREIGN KEY (id_zamowienia) REFERENCES public.zamowienia(id_zamowienia);


--
-- Name: produkt produkt_id_kategoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produkt
    ADD CONSTRAINT produkt_id_kategoria_fkey FOREIGN KEY (id_kategoria) REFERENCES public.kategoria(id_kategoria);


--
-- Name: produkt produkt_id_restauracja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produkt
    ADD CONSTRAINT produkt_id_restauracja_fkey FOREIGN KEY (id_restauracja) REFERENCES public.restauracja(id_restauracja);


--
-- Name: restauracja restauracja_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restauracja
    ADD CONSTRAINT restauracja_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- Name: uczestnicy_koszyka uczestnicy_koszyka_id_koszyk_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uczestnicy_koszyka
    ADD CONSTRAINT uczestnicy_koszyka_id_koszyk_fkey FOREIGN KEY (id_koszyk) REFERENCES public.koszyk(id_koszyk) ON DELETE CASCADE;


--
-- Name: uczestnicy_koszyka uczestnicy_koszyka_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uczestnicy_koszyka
    ADD CONSTRAINT uczestnicy_koszyka_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik) ON DELETE CASCADE;


--
-- Name: uzytkownik uzytkownik_id_typ_konta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uzytkownik
    ADD CONSTRAINT uzytkownik_id_typ_konta_fkey FOREIGN KEY (id_typ_konta) REFERENCES public.typ_konta(id_typ_konta);


--
-- Name: zamowienia zamowienia_id_restauracja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zamowienia
    ADD CONSTRAINT zamowienia_id_restauracja_fkey FOREIGN KEY (id_restauracja) REFERENCES public.restauracja(id_restauracja);


--
-- Name: zamowienia zamowienia_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zamowienia
    ADD CONSTRAINT zamowienia_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- Name: zdobyte_osiagniecia zdobyte_osiagniecia_id_osiagniecia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zdobyte_osiagniecia
    ADD CONSTRAINT zdobyte_osiagniecia_id_osiagniecia_fkey FOREIGN KEY (id_osiagniecia) REFERENCES public.osiagniecia(id_osiagniecia);


--
-- Name: zdobyte_osiagniecia zdobyte_osiagniecia_id_uzytkownik_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zdobyte_osiagniecia
    ADD CONSTRAINT zdobyte_osiagniecia_id_uzytkownik_fkey FOREIGN KEY (id_uzytkownik) REFERENCES public.uzytkownik(id_uzytkownik);


--
-- PostgreSQL database dump complete
--

