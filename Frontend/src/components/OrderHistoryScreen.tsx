import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { ordersApi } from '../api/apiClient';
import { GroupSettlementModal } from './GroupSettlementModal';

interface OrderHistoryScreenProps {
    onNavigate: (screen: Screen) => void;
}

export function OrderHistoryScreen({ onNavigate }: OrderHistoryScreenProps) {
    const { t, i18n } = useTranslation();
    const [orders, setOrders] = useState<any[]>([]);
    const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSettlementOrderId, setSelectedSettlementOrderId] = useState<number | null>(null);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            onNavigate('login');
            return;
        }

        ordersApi.getUserOrders(userId)
            .then((response) => {
                setOrders(response.data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, [onNavigate]);

    const toggleOrder = (orderId: number) => {
        setExpandedOrders(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId) 
                : [...prev, orderId]
        );
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">
                    {t('order_history.title', 'HISTORIA ZAMÓWIEŃ')}
                </div>
            </div>

            <section className="settings-content" style={{ marginTop: '20px' }}>
                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>{t('order_history.loading')}</p>
                ) : orders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>
                        {t('order_history.empty')}
                    </p>
                ) : (
                    <div className="order-history-grid">
                        {orders.map(order => {
                            const isExpanded = expandedOrders.includes(order.id_zamowienia);
                            const dataFormat = new Date(order.data_zamowienia).toLocaleString(
                                i18n.language === 'en' ? 'en-US' : 'pl-PL',
                                { 
                                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                }
                            );

                            const paymentLabel = t(`restaurant_orders.payment_statuses.${order.status_platnosci}`, order.status_platnosci);
                            const statusLabel = t(`restaurant_orders.statuses.${order.status_zamowienia}`, order.status_zamowienia);

                            return (
                                <article className="order-card" key={order.id_zamowienia}>
                                    <div className="order-header">
                                        <div className="order-meta">
                                            <strong className="order-title">
                                                {order.restauracja_nazwa}
                                            </strong>
                                            <span>{t('order_history.date', { date: dataFormat })}</span>
                                            <span>{t('order_history.order_number', { id: order.id_zamowienia })}</span>
                                            
                                            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <span className={`order-status-badge ${order.status_platnosci === 'OCZEKUJĄCA' || order.status_platnosci === 'OCZEKIWANIE_NA_ZWROT' ? 'status-nieoplacone' : 'status-oplacone'}`}>
                                                    {t('order_history.payment', { status: paymentLabel })}
                                                </span>
                                                <span className="order-status-badge status-w-trakcie">
                                                    {t('order_history.status', { status: statusLabel })}
                                                </span>
                                                {order.czy_skladka && (
                                                    <span className="order-status-badge status-skladka" style={{ background: '#e0e7ff', color: '#4338ca', borderColor: '#c7d2fe' }}>
                                                        {t('order_history.split_badge', 'Składka')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            <strong style={{ display: 'block', fontSize: '1.3rem', color: '#60d3b4' }}>
                                                {order.kwota.toFixed(2)} {t('order_history.currency')}
                                            </strong>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {order.czy_skladka && (
                                                    <button 
                                                        className="secondary-button" 
                                                        style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#e0e7ff', borderColor: '#c7d2fe', color: '#3730a3' }}
                                                        onClick={() => setSelectedSettlementOrderId(order.id_zamowienia)}
                                                    >
                                                        {t('order_history.settlement_btn', 'Rozliczenie składki')}
                                                    </button>
                                                )}
                                                <button 
                                                    className="secondary-button" 
                                                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                    onClick={() => toggleOrder(order.id_zamowienia)}
                                                >
                                                    {isExpanded ? t('order_history.collapse') : t('order_history.expand')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="order-items-list">
                                            <h4 className="order-items-heading">{t('order_history.items_title')}</h4>
                                            {order.pozycje && order.pozycje.map((poz: any, idx: number) => (
                                                <div className="order-item-row" key={idx}>
                                                    <div>
                                                        <strong>{poz.ilosc}x</strong> {poz.nazwa}
                                                    </div>
                                                    <div>
                                                        {(poz.ilosc * poz.cena).toFixed(2)} {t('order_history.currency')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {selectedSettlementOrderId && (
                <GroupSettlementModal
                    orderId={selectedSettlementOrderId}
                    onClose={() => setSelectedSettlementOrderId(null)}
                />
            )}
        </div>
    );
}