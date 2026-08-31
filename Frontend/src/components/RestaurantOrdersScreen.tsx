import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { ordersApi } from '../api/apiClient';
import { useNotify } from './NotificationProvider';
import { ConfirmationProvider } from './ConfirmationProvider';

interface RestaurantOrdersScreenProps {
    onNavigate: (screen: Screen) => void;
    restId: number;
    restName: string;
}

type Order = {
    id_zamowienia: number;
    klient: string;
    adres_dostawy: string;
    data_zamowienia: string;
    kwota: number;
    status_zamowienia: string;
    status_platnosci: string;
    pozycje: { nazwa: string; ilosc: number; cena: number }[];
};

export function RestaurantOrdersScreen({ onNavigate, restId, restName }: RestaurantOrdersScreenProps) {
    const { t, i18n } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
    const notify = useNotify();
    const [confirmAction, setConfirmAction] = useState<null | {
        message: string;
        action: () => void;
    }>(null);

    const fetchOrders = useCallback(() => {
        setIsLoading(true);
        ordersApi.getRestaurantOrders(restId)
            .then((response) => {
                setOrders(response.data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, [restId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleAction = async (orderId: number, endpoint: string, successMsg: string) => {
        if (processingOrderId) return;
        setProcessingOrderId(orderId);
        try {
            if (endpoint === 'przyjmij') await ordersApi.acceptOrder(orderId);
            else if (endpoint === 'odrzuc') await ordersApi.rejectOrder(orderId);
            else if (endpoint === 'w_dostawie') await ordersApi.setInDelivery(orderId);
            else if (endpoint === 'dostarczono') await ordersApi.setDelivered(orderId);
            else if (endpoint === 'zaakceptuj-platnosc') await ordersApi.acceptPayment(orderId);

            notify(successMsg, 'success');
            fetchOrders();

        } catch (error: any) {
            notify(
                error.response?.data?.detail ||
                t('restaurant_orders.loading'),
                'error'
            );
        } finally {
            setProcessingOrderId(null);
        }
    };

    const handlePrzyjmij = (orderId: number) => {
        setConfirmAction({
            message: t('restaurant_orders.confirm_accept_order'),
            action: () => handleAction(orderId, 'przyjmij', t('restaurant_orders.msg_accepted'))
        });
    };

    const handleOdrzuc = (orderId: number) => {
        setConfirmAction({
            message: t('restaurant_orders.confirm_reject'),
            action: () => handleAction(orderId, 'odrzuc', t('restaurant_orders.msg_rejected'))
        });
    };

    const handleWDostawie = (orderId: number) => {
        setConfirmAction({
            message: t('restaurant_orders.confirm_send_delivery'),
            action: () => handleAction(orderId, 'w_dostawie', t('restaurant_orders.msg_in_delivery'))
        });
    };

    const handleDostarczono = (orderId: number) => {
        setConfirmAction({
            message: t('restaurant_orders.confirm_delivered'),
            action: () => handleAction(orderId, 'dostarczono', t('restaurant_orders.msg_delivered'))
        });
    };

    const handleAcceptPayment = (orderId: number) => {
        setConfirmAction({
            message: t('restaurant_orders.confirm_accept_payment'),
            action: () => handleAction(orderId, 'zaakceptuj-platnosc', t('restaurant_orders.msg_payment_accepted'))
        });
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">
                    {t('restaurant_orders.title', { name: restName })}
                </div>
            </div>

            <section className="settings-content" style={{ marginTop: '20px' }}>
                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>{t('restaurant_orders.loading')}</p>
                ) : orders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>{t('restaurant_orders.empty')}</p>
                ) : (
                    <div className="order-history-grid">
                        {orders.map(order => {
                            const dataFormat = new Date(order.data_zamowienia).toLocaleString(
                                i18n.language === 'en' ? 'en-US' : 'pl-PL',
                                {
                                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                }
                            );

                            const isZlozone = order.status_zamowienia === 'ZŁOŻONE';
                            const isRealizacja = order.status_zamowienia === 'W_REALIZACJI';
                            const isWDostawie = order.status_zamowienia === 'W_DOSTAWIE';
                            const isOdrzucone = order.status_zamowienia === 'ODRZUCONE';
                            const isDostarczone = order.status_zamowienia === 'DOSTARCZONE';
                            const isOczekujacaPlatnosc = order.status_platnosci === 'OCZEKUJĄCA';
                            const isPlatnoscZaakceptowana = ['OPŁACONE', 'ZAAKCEPTOWANA', 'PRZY_ODBIORZE'].includes(order.status_platnosci);

                            return (
                                <article className="order-card" key={order.id_zamowienia}>
                                    <div className="order-header">
                                        <div className="order-meta">
                                            <strong className="order-title">
                                                {order.klient}
                                            </strong>
                                            <span>{t('restaurant_orders.date', { date: dataFormat })}</span>
                                            <span>{t('restaurant_orders.order_number', { id: order.id_zamowienia })}</span>
                                            <span>{t('restaurant_orders.delivery_address', { address: order.adres_dostawy })}</span>
                                            <span>
                                                {t('restaurant_orders.payment')}{' '}
                                                <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>
                                                    {t(`restaurant_orders.payment_statuses.${order.status_platnosci}`, order.status_platnosci)}
                                                </span>
                                            </span>
                                            <span>
                                                {t('restaurant_orders.status')}{' '}
                                                <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>
                                                    {t(`restaurant_orders.statuses.${order.status_zamowienia}`, order.status_zamowienia)}
                                                </span>
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block', fontSize: '1.3rem', color: '#60d3b4', marginBottom: '10px' }}>
                                                {order.kwota.toFixed(2)} {t('restaurant.currency', 'zł')}
                                            </strong>

                                            {!isOdrzucone && !isDostarczone && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'flex-end' }}>
                                                    {isOczekujacaPlatnosc && isZlozone && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#4caf50', color: 'white', borderColor: '#388e3c', padding: '6px 12px' }}
                                                            onClick={() => handleAcceptPayment(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            {t('restaurant_orders.btn_accept_payment')}
                                                        </button>
                                                    )}
                                                    {isPlatnoscZaakceptowana && isZlozone && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#2196f3', color: 'white', borderColor: '#1976d2', padding: '6px 12px' }}
                                                            onClick={() => handlePrzyjmij(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            {t('restaurant_orders.btn_accept_order')}
                                                        </button>
                                                    )}
                                                    {isRealizacja && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#ff9800', color: 'white', borderColor: '#f57c00', padding: '6px 12px' }}
                                                            onClick={() => handleWDostawie(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            {t('restaurant_orders.btn_send_delivery')}
                                                        </button>
                                                    )}
                                                    {isWDostawie && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#8bc34a', color: 'white', borderColor: '#689f38', padding: '6px 12px' }}
                                                            onClick={() => handleDostarczono(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            {t('restaurant_orders.btn_delivered')}
                                                        </button>
                                                    )}
                                                    {(isZlozone || isRealizacja || isWDostawie) && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#ffcccc', color: '#cc0000', borderColor: '#ff9999', padding: '6px 12px' }}
                                                            onClick={() => handleOdrzuc(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            {t('restaurant_orders.btn_reject')}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {isOdrzucone && (
                                                <span style={{ color: '#cc0000', fontWeight: 'bold' }}>{t('restaurant_orders.status_rejected')}</span>
                                            )}
                                            {isDostarczone && (
                                                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{t('restaurant_orders.status_delivered')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="order-items-list">
                                        <h4 className="order-items-heading">{t('restaurant_orders.items_title')}</h4>
                                        {order.pozycje.map((poz, idx) => (
                                            <div className="order-item-row" key={idx}>
                                                <div><strong>{poz.ilosc}x</strong> {poz.nazwa}</div>
                                                <div>{(poz.ilosc * poz.cena).toFixed(2)} {t('restaurant.currency', 'zł')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
                <div style={{ marginTop: '20px' }}>
                    <button className="secondary-button" onClick={() => onNavigate('profile')}>
                        {t('restaurant_orders.back_to_profile')}
                    </button>
                </div>
            </section>

            {confirmAction && (
                <ConfirmationProvider
                    message={confirmAction.message}
                    onCancel={() => setConfirmAction(null)}
                    onConfirm={() => {
                        confirmAction.action();
                        setConfirmAction(null);
                    }}
                />
            )}
        </div>
    );
}