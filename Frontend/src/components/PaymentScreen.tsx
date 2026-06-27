import { useEffect, useState } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface PaymentScreenProps {
    onNavigate: (screen: Screen) => void;
}

const paymentMethods = ['Karta płatnicza', 'Płatność Offline', 'Płatność przy odbiorze'];

export function PaymentScreen({ onNavigate }: PaymentScreenProps) {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [suma, setSuma] = useState(0);
    const [adres, setAdres] = useState('');
    const [selectedKupon, setSelectedKupon] = useState<any>(null);

    useEffect(() => {
        const userId = localStorage.getItem('userId');

        if (!userId) return;

        const zapisanyKupon = localStorage.getItem('selectedKupon');

        if (zapisanyKupon) {
            setSelectedKupon(JSON.parse(zapisanyKupon));
        }

        Promise.all([
            fetch(`http://127.0.0.1:8000/koszyk/${userId}`).then((r) => r.json()),
            fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`).then((r) => r.json()),
        ])
            .then(([koszyk, user]) => {
                setSuma(koszyk.suma || 0);
                setAdres(user.adres || 'Brak adresu');
            })
            .catch(console.error);
    }, []);

    const kosztDostawy = suma > 0 ? 7.99 : 0;

    let rabat = 0;

    if (selectedKupon?.wartosc_znizki) {
        const wartosc = selectedKupon.wartosc_znizki.toLowerCase();

        if (wartosc.includes('%')) {
            const procent = parseFloat(wartosc.replace('%', '').replace(',', '.'));
            rabat = (suma * procent) / 100;
        } else if (wartosc.includes('zł')) {
            rabat = parseFloat(wartosc.replace('zł', '').replace(',', '.'));
        } else if (wartosc.includes('dostawa')) {
            rabat = kosztDostawy;
        }
    }

    const sumaDoZaplaty = Math.max(suma + kosztDostawy - rabat, 0);

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">WYBÓR PŁATNOŚCI</div>
            </div>

            <section className="payment-card">
                <div className="payment-column">
                    <h3>Dostępne metody płatności</h3>

                    <div className="payment-list">
                        {paymentMethods.map((method) => (
                            <button
                                className={`payment-option ${
                                    selectedMethod === method ? 'reward-choice-active' : ''
                                }`}
                                key={method}
                                onClick={() => setSelectedMethod(method)}
                            >
                            <span
                                className={`payment-radio ${
                                    selectedMethod === method ? 'payment-radio-selected' : ''
                                }`}
                            />
                                <span>{method}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="payment-column payment-summary-box">
                    <h3>Podsumowanie</h3>

                    <div className="summary-row">
                        <span>Suma produktów</span>
                        <strong>{suma.toFixed(2)} zł</strong>
                    </div>

                    <div className="summary-row">
                        <span>Koszt dostawy</span>
                        <strong>{kosztDostawy.toFixed(2)} zł</strong>
                    </div>

                    <div className="summary-row">
                        <span>Adres dostawy</span>
                        <strong>{adres}</strong>
                    </div>

                    <div className="summary-row">
                        <span>Wartość rabatu</span>
                        <strong>-{rabat.toFixed(2)} zł</strong>
                    </div>

                    <div className="summary-row">
                        <span>Wybrana metoda</span>
                        <strong>{selectedMethod || 'Nie wybrano metody'}</strong>
                    </div>

                    <div className="summary-row total-row">
                        <span>Do zapłaty</span>
                        <strong>{sumaDoZaplaty.toFixed(2)} zł</strong>
                    </div>

                    <div className="payment-actions">
                        <button className="secondary-button" onClick={() => onNavigate('cart')}>
                            Wróć do koszyka
                        </button>

                        <button
                            className="mint-button"
                            onClick={() => {
                                if (!selectedMethod) {
                                    alert('Wybierz metodę płatności.');
                                    return;
                                }

                                alert(`Wybrano metodę płatności: ${selectedMethod}`);
                            }}
                        >
                            Potwierdź płatność
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}