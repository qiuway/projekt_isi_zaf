import { useEffect, useState } from 'react';
import { cartItems } from '../data/mockData';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface CartScreenProps {
    onNavigate: (screen: Screen) => void;
}

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
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [kupony, setKupony] = useState<KuponUzytkownika[]>([]);
    const [selectedKupon, setSelectedKupon] = useState<KuponUzytkownika | null>(null);

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
        fetchKupony();
    }, []);

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
                        {cartItems.map((item) => (
                            <article className="cart-item" key={item.id}>
                                <div className="cart-thumb">&lt;zdj. potrawa {item.id}&gt;</div>

                                <div className="cart-copy">
                                    <strong>{item.name}</strong>
                                    <span>Cena jednostkowa: {item.price}</span>
                                    <span>Ilość: {item.qty} (+/-) • cena całkowita {item.total}</span>
                                </div>

                                <button className="trash-button">🗑</button>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="cart-summary-wrap">
                    <div className="section-ribbon green-ribbon small-ribbon">
                        PODSUMOWANIE ZAMÓWIENIA
                    </div>

                    <div className="summary-card">
                        <div className="summary-row">
                            <span>Suma częściowa</span>
                            <strong>93,96 zł</strong>
                        </div>

                        <div className="summary-row">
                            <span>Koszt dostawy</span>
                            <strong>7,99 zł</strong>
                        </div>

                        <div className="summary-row discount-action-row">
                            <span>Wybrany rabat</span>
                            <strong>{selectedKupon ? selectedKupon.nazwa : 'Brak wybranego rabatu'}</strong>
                        </div>

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
                            <strong>101,95 zł</strong>
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
                                const isActive = selectedKupon?.id_posiadany_kupon === kupon.id_posiadany_kupon;

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
                                        <div className="reward-choice-icon">{kupon.ikona || '🎁'}</div>

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

                            <button className="mint-button" onClick={() => setIsPopupOpen(false)}>
                                Użyj wybranego rabatu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}