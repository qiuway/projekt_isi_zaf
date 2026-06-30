import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { apiClient } from '../api/apiClient';

interface RestaurantScreenProps {
    onNavigate: (screen: Screen) => void;
}

export function RestaurantScreen({ onNavigate }: RestaurantScreenProps) {
    const { t } = useTranslation();
    const restId = localStorage.getItem('currentRestId');
    const [restauracja, setRestauracja] = useState<any>(null);
    const [produkty, setProdukty] = useState<any[]>([]);

    const dodajDoKoszyka = async (idProduktu: number) => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert(t('restaurant.alerts.cart_auth_error'));
            return;
        }

        try {
            await apiClient.post('/koszyk/dodaj', {
                id_uzytkownik: Number(userId),
                id_produkt: idProduktu,
                ilosc: 1,
            });

            alert(t('restaurant.alerts.add_success'));
            window.dispatchEvent(new Event('koszykChanged'));
        } catch (error: any) {
            alert(
                error.response?.data?.detail ||
                t('restaurant.alerts.server_error')
            );
        }
    };

    useEffect(() => {
        if (!restId) return;

        apiClient.get(`/restauracja/${restId}`)
            .then((response) => setRestauracja(response.data));

        apiClient.get(`/restauracja/${restId}/produkty`)
            .then((response) => setProdukty(response.data));
    }, [restId]);

    if (!restauracja) {
        return (
            <div className="page-shell">
                <TopBar onNavigate={onNavigate} />
                <h2 style={{ textAlign: 'center' }}>{t('restaurant.loading')}</h2>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">
                    {restauracja.nazwa.toUpperCase()}
                </div>
            </div>

            <section className="settings-content" style={{ marginTop: '20px' }}>
                <p style={{ fontStyle: 'italic', color: '#5d4537' }}>{restauracja.opis}</p>
                <p>{restauracja.adres} | {restauracja.numer_telefonu}</p>
                <p>{restauracja.czynne ? t('restaurant.status_open') : t('restaurant.status_closed')}</p>

                <h3
                    style={{
                        borderBottom: '2px solid #dccbbd',
                        paddingBottom: '10px',
                        marginTop: '30px',
                        color: '#5d4537',
                    }}
                >
                    {t('restaurant.menu_title')}
                </h3>

                {produkty.length === 0 ? (
                    <p>{t('restaurant.empty_menu')}</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {produkty.map((prod) => (
                            <div
                                key={prod.id_produkt}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '15px',
                                    background: '#fff',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ fontSize: '1.1em', color: '#333' }}>
                                        {prod.nazwa}
                                    </strong>

                                    <span style={{ fontSize: '0.85em', color: '#888', marginTop: '4px' }}>
                    {t('restaurant.category', {
                        category: prod.kategoria?.nazwa || t('restaurant.none'),
                    })}
                  </span>

                                    {!prod.dostepny && (
                                        <span
                                            style={{
                                                color: '#d93838',
                                                fontSize: '0.85em',
                                                marginTop: '4px',
                                                fontWeight: 'bold',
                                            }}
                                        >
                      {t('restaurant.unavailable')}
                    </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <strong
                                        style={{
                                            color: '#60d3b4',
                                            fontSize: '1.3em',
                                            marginRight: '15px',
                                        }}
                                    >
                                        {prod.cena} {t('restaurant.currency')}
                                    </strong>

                                    <button
                                        className="mint-button"
                                        style={{ padding: '8px 16px' }}
                                        disabled={!prod.dostepny}
                                        onClick={() => dodajDoKoszyka(prod.id_produkt)}
                                    >
                                        {t('restaurant.add_button')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}