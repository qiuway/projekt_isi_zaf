import { useEffect, useState } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentScreenProps {
    onNavigate: (screen: Screen) => void;
}

const paymentMethods = ['Karta płatnicza', 'Płatność Offline', 'Płatność przy odbiorze'];

export function PaymentScreen(props: PaymentScreenProps) {
    return (
        <Elements stripe={stripePromise}>
            <InnerPaymentScreen {...props} />
        </Elements>
    );
}

function InnerPaymentScreen({ onNavigate }: PaymentScreenProps) {
    const stripe = useStripe();
    const elements = useElements();

    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [suma, setSuma] = useState(0);
    const [adres, setAdres] = useState('');
    const [selectedKupon, setSelectedKupon] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

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

    const handleConfirmPayment = async () => {
        if (!selectedMethod) {
            alert('Wybierz metodę płatności.');
            return;
        }

        if (selectedMethod !== 'Karta płatnicza') {
            alert(`Złożono zamówienie. Metoda: ${selectedMethod}`);
            onNavigate('home');
            return;
        }

        if (!stripe || !elements) return;
        setIsProcessing(true);
        setPaymentError(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: sumaDoZaplaty })
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.detail);

            const cardElement = elements.getElement(CardElement);
            const paymentResult = await stripe.confirmCardPayment(data.client_secret, {
                payment_method: {
                    card: cardElement!,
                }
            });

            if (paymentResult.error) {
                let errorMsg = paymentResult.error.message || 'Płatność odrzucona.';
                
                if (paymentResult.error.decline_code === 'insufficient_funds') {
                    errorMsg = 'Błąd: Niewystarczające środki na koncie.';
                } else if (paymentResult.error.decline_code === 'generic_decline') {
                    errorMsg = 'Błąd: Karta została odrzucona przez bank.';
                } else if (paymentResult.error.code === 'expired_card') {
                    errorMsg = 'Błąd: Karta straciła ważność.';
                } else if (paymentResult.error.code === 'incorrect_cvc') {
                    errorMsg = 'Błąd: Nieprawidłowy kod CVC.';
                } else if (paymentResult.error.code === 'incorrect_number') {
                    errorMsg = 'Błąd: Nieprawidłowy numer karty.';
                }

                setPaymentError(errorMsg);
            } else if (paymentResult.paymentIntent?.status === 'succeeded') {
                alert('Płatność zakończona SUKCESEM! Zamówienie zostało opłacone.');
                onNavigate('home');
            }
        } catch (error: any) {
            setPaymentError(error.message || 'Błąd połączenia z serwerem płatności.');
        }

        setIsProcessing(false);
    };

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
                                className={`payment-option ${selectedMethod === method ? 'reward-choice-active' : ''}`}
                                key={method}
                                onClick={() => setSelectedMethod(method)}
                            >
                                <span className={`payment-radio ${selectedMethod === method ? 'payment-radio-selected' : ''}`} />
                                <span>{method}</span>
                            </button>
                        ))}
                    </div>

                    {selectedMethod === 'Karta płatnicza' && (
                        <div className="stripe-card-container">
                            <h4 className="stripe-card-title">Dane karty kredytowej</h4>
                            <div className="stripe-input-wrapper">
                                <CardElement options={{
                                    style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } } }
                                }}/>
                            </div>
                            {paymentError && <div className="stripe-payment-error">❌ {paymentError}</div>}
                        </div>
                    )}
                </div>

                <div className="payment-column payment-summary-box">
                    <h3>Podsumowanie</h3>

                    <div className="summary-row"><span>Suma produktów</span><strong>{suma.toFixed(2)} zł</strong></div>
                    <div className="summary-row"><span>Koszt dostawy</span><strong>{kosztDostawy.toFixed(2)} zł</strong></div>
                    <div className="summary-row"><span>Adres dostawy</span><strong>{adres}</strong></div>
                    <div className="summary-row"><span>Wartość rabatu</span><strong>-{rabat.toFixed(2)} zł</strong></div>
                    
                    <div className="summary-row total-row">
                        <span>Do zapłaty</span>
                        <strong>{sumaDoZaplaty.toFixed(2)} zł</strong>
                    </div>

                    <div className="payment-actions">
                        <button className="secondary-button" onClick={() => onNavigate('cart')} disabled={isProcessing}>
                            Wróć do koszyka
                        </button>

                        <button className="mint-button" onClick={handleConfirmPayment} disabled={isProcessing}>
                            {isProcessing ? 'Przetwarzanie...' : 'Potwierdź płatność'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}