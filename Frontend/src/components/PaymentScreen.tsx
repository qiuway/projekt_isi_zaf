import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { cartApi, userApi, ordersApi, paymentsApi } from '../api/apiClient';
import { useNotify } from './NotificationProvider';
import { GroupSettlementModal } from './GroupSettlementModal';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentScreenProps {
    onNavigate: (screen: Screen) => void;
}

const paymentMethodsList = [
    { id: 'card', translationKey: 'payment.methods.card' },
    { id: 'offline', translationKey: 'payment.methods.offline' },
    { id: 'on_delivery', translationKey: 'payment.methods.on_delivery' }
];

const BANK_ACCOUNT_NUMBER = '12 3456 7890 1234 5678 9012 3456';

export function PaymentScreen(props: PaymentScreenProps) {
    return (
        <Elements stripe={stripePromise}>
            <InnerPaymentScreen {...props} />
        </Elements>
    );
}

function InnerPaymentScreen({ onNavigate }: PaymentScreenProps) {
    const { t } = useTranslation();
    const notify = useNotify();
    const stripe = useStripe();
    const elements = useElements();

    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [suma, setSuma] = useState(0);
    const [adres, setAdres] = useState('');
    const [selectedKupon, setSelectedKupon] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successPaymentType, setSuccessPaymentType] = useState<'offline' | 'on_delivery' | 'card' | null>(null);

    const [groupOrderData, setGroupOrderData] = useState<any | null>(null);
    const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
    const [showSettlementModal, setShowSettlementModal] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            onNavigate('login');
            return;
        }

        const savedGroup = localStorage.getItem('groupCartOrder');
        if (savedGroup) {
            try {
                const parsed = JSON.parse(savedGroup);
                setGroupOrderData(parsed);
            } catch (e) {
                console.error(e);
            }
        }

        const zapisanyKupon = localStorage.getItem('selectedKupon');
        if (zapisanyKupon) {
            setSelectedKupon(JSON.parse(zapisanyKupon));
        }

        Promise.all([
            cartApi.getCart(userId),
            userApi.getProfile(userId),
        ])
            .then(([koszykResponse, userResponse]) => {
                const koszyk = koszykResponse.data;
                const user = userResponse.data;

                if (savedGroup) {
                    try {
                        const parsed = JSON.parse(savedGroup);
                        if (parsed.items && parsed.items.length > 0) {
                            setCartItems(parsed.items);
                            const total = parsed.items.reduce((acc: number, item: any) => acc + (Number(item.cena_calkowita) || (item.cena * item.ilosc)), 0);
                            setSuma(total);
                            setAdres(user.adres || t('payment.summary.no_address'));
                            return;
                        }
                    } catch (e) {}
                }

                if (!koszyk.pozycje || koszyk.pozycje.length === 0) {
                    notify(t('payment.alerts.empty_cart'), 'warning');
                    onNavigate('home');
                    return;
                }
                setSuma(koszyk.suma || 0);
                setCartItems(koszyk.pozycje || []);
                setAdres(user.adres || t('payment.summary.no_address'));
            })
            .catch(console.error);
    }, [t, onNavigate]);

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

    const zlozZamowienieWbazie = async (typ_platnosci: string) => {
        const userId = localStorage.getItem('userId');
        
        if (!userId || cartItems.length === 0) return false;

        const isGroup = !!groupOrderData;

        const payload: any = {
            id_uzytkownik: Number(userId),
            id_restauracja: 1,
            pozycje: cartItems.map((item: any) => ({
                id_produkt: item.id_produkt,
                ilosc: item.ilosc
            })),
            czy_skladka: isGroup,
            typ_platnosci: typ_platnosci,
            id_posiadany_kupon: selectedKupon?.id_posiadany_kupon ?? null
        };

        if (isGroup && groupOrderData.participants) {
            payload.uczestnicy_skladki = groupOrderData.participants.map((p: any) => ({
                id_uzytkownik: p.id_uzytkownik,
                kwota_deklarowana: p.suma_do_zwrotu
            }));
        }

        try {
            const res = await ordersApi.createOrder(payload);
            setCreatedOrderId(res.data.id_zamowienia);

            window.dispatchEvent(new Event('koszykChanged'));
            localStorage.removeItem('selectedKupon');
            localStorage.removeItem('groupCartOrder');
            localStorage.removeItem('activeGroupCode');
            return true;
        } catch (error: any) {
            console.error(error);

            notify(
                error.response?.data?.detail ||
                t('payment.alerts.save_order_error'),
                'error'
            );

            return false;
        }
    };
    
    const handleConfirmPayment = async () => {
        if (cartItems.length === 0) {
            notify(t('payment.alerts.empty_cart'), 'warning');
            onNavigate('home');
            return;
        }

        if (!selectedMethod) {
            notify(t('payment.alerts.select_method'));
            return;
        }

        if (selectedMethod === 'offline') {
            setIsProcessing(true);
            const sukces = await zlozZamowienieWbazie('offline');
            setIsProcessing(false);

            if (sukces) {
                setSuccessPaymentType('offline');
                setShowSuccessModal(true);
            } else {
                notify(t('payment.alerts.save_order_error'), 'error');
            }

            return;
        }

        if (selectedMethod === 'on_delivery') {
            setIsProcessing(true);
            const sukces = await zlozZamowienieWbazie('on_delivery');
            setIsProcessing(false);

            if (sukces) {
                setSuccessPaymentType('on_delivery');
                setShowSuccessModal(true);
            } else {
                notify(t('payment.alerts.save_order_error'), 'error');
            }

            return;
        }

        if (selectedMethod === 'card') {
            if (!STRIPE_KEY || !stripe || !elements) {
                notify(t('payment.alerts.stripe_key_missing'), 'error');
                return;
            }
            setIsProcessing(true);
            setPaymentError(null);

            try {
                const response = await paymentsApi.createPaymentIntent(sumaDoZaplaty);
                const data = response.data;

                const cardElement = elements.getElement(CardElement);
                if (!cardElement) {
                    notify(t('payment.alerts.card_form_missing'), 'error');
                    setIsProcessing(false);
                    return;
                }

                const paymentResult = await stripe.confirmCardPayment(data.client_secret, {
                    payment_method: {
                        card: cardElement,
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
                    const sukces = await zlozZamowienieWbazie('card');
                    if (sukces) {
                        setSuccessPaymentType('card');
                        setShowSuccessModal(true);
                    } else {
                        notify(t('payment.alerts.payment_success_order_fail'), 'error');
                    }
                }
            } catch (error: any) {
                setPaymentError(
                    error.response?.data?.detail ||
                    error.message ||
                    t('payment.alerts.server_error')
                );
            }

            setIsProcessing(false);
        }
    };

    const isDarkMode = typeof document !== 'undefined' && (document.body.classList.contains('dark-mode') || localStorage.getItem('theme') === 'dark');

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
                            {!STRIPE_KEY ? (
                                <div className="stripe-config-warning">
                                    <strong>{t('payment.stripe_warning.title')}</strong>
                                    {t('payment.stripe_warning.desc')}
                                    <br />
                                    <code>VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...</code>
                                </div>
                            ) : (
                                <div className="stripe-input-wrapper">
                                    <CardElement
                                        key={isDarkMode ? 'stripe-dark' : 'stripe-light'}
                                        options={{
                                            style: {
                                                base: {
                                                    fontSize: '16px',
                                                    color: isDarkMode ? '#ffffff' : '#111827',
                                                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                                    iconColor: isDarkMode ? '#60d3b4' : '#5d4537',
                                                    '::placeholder': {
                                                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                                                    },
                                                },
                                                invalid: {
                                                    color: '#ef4444',
                                                    iconColor: '#ef4444',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            )}
                            {paymentError && <div className="stripe-payment-error">❌ {paymentError}</div>}
                        </div>
                    )}

                    {selectedMethod === 'offline' && (
                        <div className="offline-payment-box" style={{ marginTop: '20px', padding: '15px', borderRadius: '8px' }}>
                            <strong>{t('payment.offline_box.account_number')}</strong>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '10px 0 0 0' }}>{BANK_ACCOUNT_NUMBER}</p>
                            <p className="offline-payment-meta">{t('payment.offline_box.amount', { amount: sumaDoZaplaty.toFixed(2) })}</p>
                            <p className="offline-payment-meta">{t('payment.offline_box.title', { id: Date.now() })}</p>
                        </div>
                    )}

                    {selectedMethod === 'on_delivery' && (
                        <div className="delivery-payment-box" style={{ marginTop: '20px', padding: '15px', borderRadius: '8px' }}>
                            <strong>{t('payment.delivery_box.title')}</strong>
                            <p style={{ margin: '10px 0 0 0' }}>{t('payment.delivery_box.desc')}</p>
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
            {showSuccessModal && (
                <div className="payment-success-overlay">
                    <div className="payment-success-modal">

                        <div className="payment-success-icon">
                            ✅
                        </div>

                        <h2>{t('payment.success_modal.title')}</h2>

                        {successPaymentType === 'offline' && (
                            <div className="payment-success-text">

                                <p>{t('payment.offline_box.account_number')}</p>

                                <div className="payment-bank-number">
                                    {BANK_ACCOUNT_NUMBER}
                                </div>

                                <p>
                                    {t('payment.offline_box.amount', { amount: sumaDoZaplaty.toFixed(2) })}
                                </p>

                                <p>
                                    {t('payment.success_modal.offline_msg')}
                                </p>
                            </div>
                        )}

                        {successPaymentType === 'on_delivery' && (
                            <div className="payment-success-text">

                                <p>
                                    {t('payment.success_modal.on_delivery_msg')}
                                </p>

                                <p>
                                    {t('payment.summary.to_pay')}: <strong>{sumaDoZaplaty.toFixed(2)} {t('payment.summary.currency')}</strong>
                                </p>
                            </div>
                        )}

                        {successPaymentType === 'card' && (
                            <div className="payment-success-text">

                                <p>
                                    {t('payment.success_modal.card_msg')}
                                </p>

                                <p>
                                    {t('payment.summary.to_pay')}: <strong>{sumaDoZaplaty.toFixed(2)} {t('payment.summary.currency')}</strong>
                                </p>
                            </div>
                        )}

                        {groupOrderData && createdOrderId && (
                            <button
                                className="mint-button"
                                style={{ marginBottom: '10px', width: '100%' }}
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setShowSettlementModal(true);
                                }}
                            >
                                {t('settlement.view_split_summary_btn', 'Zobacz rozliczenie składki')}
                            </button>
                        )}

                        <button
                            className="secondary-button"
                            style={{ width: '100%' }}
                            onClick={() => {
                                setShowSuccessModal(false);
                                setSuccessPaymentType(null);
                                onNavigate('home');
                            }}
                        >
                            OK
                        </button>

                    </div>
                </div>
            )}

            {showSettlementModal && createdOrderId && (
                <GroupSettlementModal
                    orderId={createdOrderId}
                    onClose={() => {
                        setShowSettlementModal(false);
                        setShowSuccessModal(false);
                        setSuccessPaymentType(null);
                        onNavigate('home');
                    }}
                />
            )}
        </div>
    );
}