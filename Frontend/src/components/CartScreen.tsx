import { useEffect, useState } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface CartScreenProps {
    onNavigate: (screen: Screen) => void;
}

type PozycjaKoszyka = {
    id_pozycja_koszyka: number;
    id_produkt: number;
    nazwa: string;
    cena: number;
    ilosc: number;
    cena_calkowita: number;
};

type KuponUzytkownika = {
    id_posiadany_kupon: number;
    id_kupon: number;
    nazwa: string;
    opis: string | null;
    koszt_punktowy: number;
    wartosc_znizki: string | null;
    ikona: string | null;
    wykorzystany: boolean;
};

export function CartScreen({ onNavigate }: CartScreenProps) {
    const [pozycje, setPozycje] = useState<PozycjaKoszyka[]>([]);
    const [suma, setSuma] = useState(0);

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [kupony, setKupony] = useState<KuponUzytkownika[]>([]);
    const [selectedKupon, setSelectedKupon] = useState<KuponUzytkownika | null>(null);

    const fetchKoszyk = () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setPozycje([]);
            setSuma(0);
            return;
        }

        fetch(`http://127.0.0.1:8000/koszyk/${userId}`)
            .then((res) => res.json())
            .then((data) => {
                setPozycje(data.pozycje || []);
                setSuma(data.suma || 0);
            })
            .catch((err) => console.error(err));
    };

    const fetchKupony = () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setKupony([]);
            return;
        }

        fetch(`http://127.0.0.1:8000/uzytkownik/${userId}/kupony`)
            .then((res) => res.json())
            .then((data) => setKupony(data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchKoszyk();
        fetchKupony();
    }, []);

    const zmienIlosc = async (idProduktu: number, nowaIlosc: number) => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert('Musisz być zalogowany.');
            return;
        }

        try {
            await fetch('http://127.0.0.1:8000/koszyk/aktualizuj', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_uzytkownik: Number(userId),
                    id_produkt: idProduktu,
                    ilosc: nowaIlosc,
                }),
            });

            fetchKoszyk();
                window.dispatchEvent(new Event('koszykChanged'));
        } catch (error) {
            alert('Błąd połączenia z serwerem.');
        }
    };

    const podstawowyKosztDostawy = pozycje.length > 0 ? 7.99 : 0;

    const obliczRabat = () => {
        if (!selectedKupon || !selectedKupon.wartosc_znizki) {
            return {
                rabatKwotowy: 0,
                kosztDostawyPoRabacie: podstawowyKosztDostawy,
            };
        }

        const wartosc = selectedKupon.wartosc_znizki.toLowerCase();

        if (wartosc.includes('dostawa')) {
            return {
                rabatKwotowy: 0,
                kosztDostawyPoRabacie: 0,
            };
        }

        if (wartosc.includes('%')) {
            const procent = parseFloat(wartosc.replace('%', '').replace(',', '.'));
            const rabat = suma * (procent / 100);

            return {
                rabatKwotowy: rabat,
                kosztDostawyPoRabacie: podstawowyKosztDostawy,
            };
        }

        if (wartosc.includes('zł')) {
            const kwota = parseFloat(wartosc.replace('zł', '').replace(',', '.'));
            const rabat = Math.min(kwota, suma);

            return {
                rabatKwotowy: rabat,
                kosztDostawyPoRabacie: podstawowyKosztDostawy,
            };
        }

        return {
            rabatKwotowy: 0,
            kosztDostawyPoRabacie: podstawowyKosztDostawy,
        };
    };

    const { rabatKwotowy, kosztDostawyPoRabacie } = obliczRabat();
    const sumaDoZaplaty = Math.max(suma - rabatKwotowy + kosztDostawyPoRabacie, 0);

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap beige-strip">
                <div className="section-ribbon blue-ribbon large-ribbon">TWÓJ KOSZYK</div>
            </div>

            <div className="cart-layout">
                <section className="cart-products">
                    <div className="section-ribbon blue-ribbon small-ribbon">TWOJE PRODUKTY</div>

                    <div className="list-stack">
                        {pozycje.length === 0 ? (
                            <p>Koszyk jest pusty.</p>
                        ) : (
                            pozycje.map((item) => (
                                <article className="cart-item" key={item.id_pozycja_koszyka}>
                                    <div className="cart-thumb">&lt;zdj. potrawa&gt;</div>

                                    <div className="cart-copy">
                                        <strong>{item.nazwa}</strong>
                                        <span>Cena jednostkowa: {item.cena.toFixed(2)} zł</span>
                                        <span>
                                            Ilość: {item.ilosc} • cena całkowita{' '}
                                            {item.cena_calkowita.toFixed(2)} zł
                                        </span>

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button
                                                className="secondary-button"
                                                onClick={() => zmienIlosc(item.id_produkt, item.ilosc - 1)}
                                            >
                                                -
                                            </button>

                                            <button
                                                className="secondary-button"
                                                onClick={() => zmienIlosc(item.id_produkt, item.ilosc + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        className="trash-button"
                                        onClick={() => zmienIlosc(item.id_produkt, 0)}
                                    >
                                        ❌
                                    </button>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="cart-summary-wrap">
                    <div className="section-ribbon green-ribbon small-ribbon">
                        PODSUMOWANIE ZAMÓWIENIA
                    </div>

                    <div className="summary-card">
                        <div className="summary-row">
                            <span>Suma częściowa</span>
                            <strong>{suma.toFixed(2)} zł</strong>
                        </div>

                        <div className="summary-row">
                            <span>Koszt dostawy</span>
                            <strong>{kosztDostawyPoRabacie.toFixed(2)} zł</strong>
                        </div>

                        <div className="summary-row discount-action-row">
                            <span>Wybrany rabat</span>
                            <strong>{selectedKupon ? selectedKupon.nazwa : 'Brak wybranego rabatu'}</strong>
                        </div>

                        {selectedKupon && (
                            <div className="summary-row">
                                <span>Wartość rabatu</span>
                                <strong>
                                    {selectedKupon.wartosc_znizki || 'Brak'}
                                    {rabatKwotowy > 0 && ` (-${rabatKwotowy.toFixed(2)} zł)`}
                                </strong>
                            </div>
                        )}

                        <button
                            className="secondary-button discount-select-button"
                            onClick={() => {
                                fetchKupony();
                                setIsPopupOpen(true);
                            }}
                        >
                            Wybierz rabat
                        </button>

                        <div className="summary-row total-row">
                            <span>Suma do zapłaty</span>
                            <strong>{sumaDoZaplaty.toFixed(2)} zł</strong>
                        </div>
                    </div>

                    <button className="mint-button order-button" onClick={() => onNavigate('payment')}>
                        ZŁÓŻ ZAMÓWIENIE
                    </button>
                </section>
            </div>

            {isPopupOpen && (
                <div className="modal-overlay" onClick={() => setIsPopupOpen(false)}>
                    <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="section-ribbon blue-ribbon small-ribbon modal-ribbon">
                            WYBIERZ RABAT
                        </div>

                        <div className="reward-choice-list">
                            {kupony.length === 0 && (
                                <p className="modal-note">Nie masz aktywnych kuponów do wykorzystania.</p>
                            )}

                            {kupony.map((kupon) => {
                                const isActive =
                                    selectedKupon?.id_posiadany_kupon === kupon.id_posiadany_kupon;

                                return (
                                    <button
                                        key={kupon.id_posiadany_kupon}
                                        className={`reward-choice ${isActive ? 'reward-choice-active' : ''}`}
                                        onClick={() => {
                                            if (selectedKupon?.id_posiadany_kupon === kupon.id_posiadany_kupon) {
                                                setSelectedKupon(null);
                                            } else {
                                                setSelectedKupon(kupon);
                                            }
                                        }}
                                    >
                                        <div className="reward-choice-icon">{kupon.ikona}</div>

                                        <div className="reward-choice-copy">
                                            <strong>{kupon.nazwa}</strong>
                                            <span>{kupon.opis || 'Brak opisu'}</span>
                                            <span>{kupon.wartosc_znizki || 'Brak wartości rabatu'}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="modal-note">Na jedno zamówienie możesz użyć tylko jednego rabatu.</p>

                        <div className="modal-actions">
                            <button className="secondary-button" onClick={() => setIsPopupOpen(false)}>
                                Zamknij
                            </button>

                            <button
                                className="mint-button"
                                onClick={() => {
                                    if (!selectedKupon) {
                                        alert('Nie wybrano rabatu.');
                                        return;
                                    }

                                    setIsPopupOpen(false);
                                }}
                            >
                                Użyj wybranego rabatu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}