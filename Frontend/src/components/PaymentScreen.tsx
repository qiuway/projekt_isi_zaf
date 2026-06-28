import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentScreenProps {
    onNavigate: (screen: Screen) => void;
}

const paymentMethodsList = [
    { id: 'card', translationKey: 'payment.methods.card' },
    { id: 'offline', translationKey: 'payment.methods.offline' },
    { id: 'on_delivery', translationKey: 'payment.methods.on_delivery' }
];

export function PaymentScreen(props: PaymentScreenProps) {
    return (
        <Elements stripe={stripePromise}>
            <InnerPaymentScreen {...props} />
        </Elements>
    );
}

function InnerPaymentScreen({ onNavigate }: PaymentScreenProps) {
    const { t } = useTranslation();
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
                setAdres(user.adres || t('payment.summary.no_address'));
            })
            .catch(console.error);
    }, [t]);

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
            alert(t('payment.alerts.select_method'));
            return;
        }

        if (selectedMethod !== 'card') {
            const translatedMethod = t(`payment.methods.${selectedMethod}`);
            alert(t('payment.alerts.order_placed', { method: translatedMethod }));
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
                let errorMsg = paymentResult.error.message || t('payment.stripe_errors.default');
                
                if (paymentResult.error.decline_code === 'insufficient_funds') {
                    errorMsg = t('payment.stripe_errors.insufficient_funds');
                } else if (paymentResult.error.decline_code === 'generic_decline') {
                    errorMsg = t('payment.stripe_errors.generic_decline');
                } else if (paymentResult.error.code === 'expired_card') {
                    errorMsg = t('payment.stripe_errors.expired_card');
                } else if (paymentResult.error.code === 'incorrect_cvc') {
                    errorMsg = t('payment.stripe_errors.incorrect_cvc');
                } else if (paymentResult.error.code === 'incorrect_number') {
                    errorMsg = t('payment.stripe_errors.incorrect_number');
                }

                setPaymentError(errorMsg);
            } else if (paymentResult.paymentIntent?.status === 'succeeded') {
                alert(t('payment.alerts.payment_success'));
                onNavigate('home');
            }
        } catch (error: any) {
            setPaymentError(error.message || t('payment.alerts.server_error'));
        }

        setIsProcessing(false);
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">{t('payment.title')}</div>
            </div>

            <section className="payment-card">
                <div className="payment-column">
                    <h3>{t('payment.available_methods')}</h3>

                    <div className="payment-list">
                        {paymentMethodsList.map((method) => (
                            <button
                                className={`payment-option ${selectedMethod === method.id ? 'reward-choice-active' : ''}`}
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                            >
                                <span className={`payment-radio ${selectedMethod === method.id ? 'payment-radio-selected' : ''}`} />
                                <span>{t(method.translationKey)}</span>
                            </button>
                        ))}
                    </div>

                    {selectedMethod === 'card' && (
                        <div className="stripe-card-container">
                            <h4 className="stripe-card-title">{t('payment.credit_card_details')}</h4>
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
                    <h3>{t('payment.summary_title')}</h3>

                    <div className="summary-row">
                        <span>{t('payment.summary.products_total')}</span>
                        <strong>{suma.toFixed(2)} {t('payment.summary.currency')}</strong>
                    </div>
                    <div className="summary-row">
                        <span>{t('payment.summary.delivery_cost')}</span>
                        <strong>{kosztDostawy.toFixed(2)} {t('payment.summary.currency')}</strong>
                    </div>
                    <div className="summary-row">
                        <span>{t('payment.summary.delivery_address')}</span>
                        <strong>{adres}</strong>
                    </div>
                    <div className="summary-row">
                        <span>{t('payment.summary.discount_value')}</span>
                        <strong>-{rabat.toFixed(2)} {t('payment.summary.currency')}</strong>
                    </div>
                    
                    <div className="summary-row total-row">
                        <span>{t('payment.summary.to_pay')}</span>
                        <strong>{sumaDoZaplaty.toFixed(2)} {t('payment.summary.currency')}</strong>
                    </div>

                    <div className="payment-actions">
                        <button className="secondary-button" onClick={() => onNavigate('cart')} disabled={isProcessing}>
                            {t('payment.buttons.back_to_cart')}
                        </button>

                        <button className="mint-button" onClick={handleConfirmPayment} disabled={isProcessing}>
                            {isProcessing ? t('payment.buttons.processing') : t('payment.buttons.confirm_payment')}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}