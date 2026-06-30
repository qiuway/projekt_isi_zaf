import { useEffect, useState, useCallback } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { apiClient } from '../api/apiClient';
import { useNotify } from './NotificationProvider';

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
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
    const notify = useNotify();

    const fetchOrders = useCallback(() => {
        setIsLoading(true);
        apiClient.get(`/restauracja/${restId}/zamowienia`)
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
        if (processingOrderId) return; // blokada przed wielokrotnym kliknięciem
        setProcessingOrderId(orderId);
        try {
            await apiClient.put(`/zamowienia/${orderId}/${endpoint}`);

            notify(successMsg, 'success');
            fetchOrders();

        } catch (error: any) {
            notify(
                error.response?.data?.detail ||
                'Błąd sieci.',
                'error'
            );
        } finally {
            setProcessingOrderId(null);
        }
    };

    const handlePrzyjmij = (orderId: number) => {
        if (window.confirm('Czy na pewno chcesz przyjąć to zamówienie?')) {
            handleAction(orderId, 'przyjmij', 'Zamówienie przyjęte.');
        }
    };

    const handleOdrzuc = (orderId: number) => {
        if (window.confirm('Czy na pewno chcesz odrzucić to zamówienie?')) {
            handleAction(orderId, 'odrzuc', 'Zamówienie odrzucone.');
        }
    };

    const handleWDostawie = (orderId: number) => {
        if (window.confirm('Czy na pewno chcesz wysłać zamówienie w dostawę?')) {
            handleAction(orderId, 'w_dostawie', 'Zamówienie wysłane w dostawę.');
        }
    };

    const handleDostarczono = (orderId: number) => {
        if (window.confirm('Czy na pewno chcesz oznaczyć zamówienie jako dostarczone?')) {
            handleAction(orderId, 'dostarczono', 'Zamówienie dostarczone.');
        }
    };

    const handleAcceptPayment = (orderId: number) => {
        if (window.confirm('Czy na pewno chcesz zatwierdzić tę płatność?')) {
            handleAction(orderId, 'zaakceptuj-platnosc', 'Płatność zatwierdzona!');
        }
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">
                    Zamówienia: {restName}
                </div>
            </div>

            <section className="settings-content" style={{ marginTop: '20px' }}>
                {isLoading ? (
                    <p style={{ textAlign: 'center' }}>Ładowanie zamówień...</p>
                ) : orders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Brak zamówień dla tej restauracji.</p>
                ) : (
                    <div className="order-history-grid">
                        {orders.map(order => {
                            const dataFormat = new Date(order.data_zamowienia).toLocaleString('pl-PL', {
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            });

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
                                            <strong style={{ fontSize: '1.2rem', color: '#5d4537' }}>
                                                {order.klient}
                                            </strong>
                                            <span>📅 Data: {dataFormat}</span>
                                            <span>🧾 Nr zamówienia: #{order.id_zamowienia}</span>
                                            <span>📍 Adres dostawy: {order.adres_dostawy}</span>
                                            <span>
                                                💳 Płatność: 
                                                <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>
                                                    {order.status_platnosci}
                                                </span>
                                            </span>
                                            <span>
                                                📦 Status: 
                                                <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>
                                                    {order.status_zamowienia}
                                                </span>
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block', fontSize: '1.3rem', color: '#60d3b4', marginBottom: '10px' }}>
                                                {order.kwota.toFixed(2)} zł
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
                                                            Zatwierdź płatność
                                                        </button>
                                                    )}
                                                    {isPlatnoscZaakceptowana && isZlozone && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#2196f3', color: 'white', borderColor: '#1976d2', padding: '6px 12px' }}
                                                            onClick={() => handlePrzyjmij(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            Przyjmij zamówienie
                                                        </button>
                                                    )}
                                                    {isRealizacja && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#ff9800', color: 'white', borderColor: '#f57c00', padding: '6px 12px' }}
                                                            onClick={() => handleWDostawie(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            Wyślij w dostawę
                                                        </button>
                                                    )}
                                                    {isWDostawie && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#8bc34a', color: 'white', borderColor: '#689f38', padding: '6px 12px' }}
                                                            onClick={() => handleDostarczono(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            Dostarczono
                                                        </button>
                                                    )}
                                                    {(isZlozone || isRealizacja || isWDostawie) && (
                                                        <button 
                                                            className="secondary-button" 
                                                            style={{ background: '#ffcccc', color: '#cc0000', borderColor: '#ff9999', padding: '6px 12px' }}
                                                            onClick={() => handleOdrzuc(order.id_zamowienia)}
                                                            disabled={processingOrderId === order.id_zamowienia}
                                                        >
                                                            Odrzuć zamówienie
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {isOdrzucone && (
                                                <span style={{ color: '#cc0000', fontWeight: 'bold' }}>Zamówienie odrzucone</span>
                                            )}
                                            {isDostarczone && (
                                                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Zamówienie dostarczone</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="order-items-list">
                                        <h4 style={{ margin: '0 0 10px 0', color: '#5d4537' }}>Produkty:</h4>
                                        {order.pozycje.map((poz, idx) => (
                                            <div className="order-item-row" key={idx}>
                                                <div><strong>{poz.ilosc}x</strong> {poz.nazwa}</div>
                                                <div>{(poz.ilosc * poz.cena).toFixed(2)} zł</div>
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
                        Powrót do profilu
                    </button>
                </div>
            </section>
        </div>
    );
}