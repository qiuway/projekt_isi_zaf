import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface OrderHistoryScreenProps {
    onNavigate: (screen: Screen) => void;
}

export function OrderHistoryScreen({ onNavigate }: OrderHistoryScreenProps) {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<any[]>([]);
    const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            onNavigate('login');
            return;
        }

        fetch(`http://127.0.0.1:8000/uzytkownik/${userId}/zamowienia`)
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setIsLoading(false);
            })
            .catch(err => {
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
                    <p style={{ textAlign: 'center' }}>Ładowanie zamówień...</p>
                ) : orders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>
                        {t('order_history.empty', 'Nie masz jeszcze żadnych zamówień.')}
                    </p>
                ) : (
                    <div className="order-history-grid">
                        {orders.map(order => {
                            const isExpanded = expandedOrders.includes(order.id_zamowienia);
                            const dataFormat = new Date(order.data_zamowienia).toLocaleString('pl-PL', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            });

                            return (
                                <article className="order-card" key={order.id_zamowienia}>
                                    <div className="order-header">
                                        <div className="order-meta">
                                            <strong style={{ fontSize: '1.2rem', color: '#5d4537' }}>
                                                {order.restauracja_nazwa}
                                            </strong>
                                            <span>📅 Data: {dataFormat}</span>
                                            <span>🧾 Numer zamówienia: #{order.id_zamowienia}</span>
                                            
                                            <div style={{ marginTop: '10px' }}>
                                                <span className={`order-status-badge ${order.status_platnosci === 'OCZEKUJĄCA' || order.status_platnosci === 'OCZEKIWANIE_NA_ZWROT' ? 'status-nieoplacone' : 'status-oplacone'}`}>
                                                    💳 Płatność: {order.status_platnosci}
                                                </span>
                                                <span className="order-status-badge status-w-trakcie">
                                                    🍲 Status: {order.status_zamowienia}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block', fontSize: '1.3rem', color: '#60d3b4', marginBottom: '10px' }}>
                                                {order.kwota.toFixed(2)} zł
                                            </strong>
                                            <button 
                                                className="secondary-button" 
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                onClick={() => toggleOrder(order.id_zamowienia)}
                                            >
                                                {isExpanded ? 'Zwiń szczegóły ⌃' : 'Rozwiń szczegóły ⌄'}
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="order-items-list">
                                            <h4 style={{ margin: '0 0 10px 0', color: '#5d4537' }}>Pozycje w zamówieniu:</h4>
                                            {order.pozycje && order.pozycje.map((poz: any, idx: number) => (
                                                <div className="order-item-row" key={idx}>
                                                    <div>
                                                        <strong>{poz.ilosc}x</strong> {poz.nazwa}
                                                    </div>
                                                    <div>
                                                        {(poz.ilosc * poz.cena).toFixed(2)} zł
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
        </div>
    );
}