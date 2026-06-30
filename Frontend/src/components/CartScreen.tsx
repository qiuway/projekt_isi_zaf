import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { apiClient } from '../api/apiClient';

interface CartScreenProps {
    onNavigate: (screen: Screen) => void;
}

type PozycjaKoszyka = {
    id_pozycja_koszyka: number;
    id_produkt: number;
    nazwa: string;
    cena: number;
    ilosc: number;
    cena_calkowita: number;
};

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
    const { t } = useTranslation();
    const [pozycje, setPozycje] = useState<PozycjaKoszyka[]>([]);
    const [suma, setSuma] = useState(0);

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [kupony, setKupony] = useState<KuponUzytkownika[]>([]);
    const [selectedKupon, setSelectedKupon] = useState<KuponUzytkownika | null>(null);

    const fetchKoszyk = () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setPozycje([]);
            setSuma(0);
            return;
        }

        apiClient.get(`/koszyk/${userId}`)
            .then((response) => {
                const data = response.data;
                setPozycje(data.pozycje || []);
                setSuma(data.suma || 0);
            })
            .catch((err) => console.error(err));
    };

    const fetchKupony = () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setKupony([]);
            return;
        }

        apiClient.get(`/uzytkownik/${userId}/kupony`)
            .then((response) => setKupony(response.data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchKoszyk();
        fetchKupony();
    }, []);

    const zmienIlosc = async (idProduktu: number, nowaIlosc: number) => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert(t('cart.alerts.not_logged_in'));
            return;
        }

        try {
            await apiClient.put('/koszyk/aktualizuj', {
                id_uzytkownik: Number(userId),
                id_produkt: idProduktu,
                ilosc: nowaIlosc,
            });

            fetchKoszyk();
            window.dispatchEvent(new Event('koszykChanged'));
        } catch (error) {
            alert(t('cart.alerts.server_error'));
        }
    };

    const podstawowyKosztDostawy = pozycje.length > 0 ? 7.99 : 0;

    const obliczRabat = () => {
        if (!selectedKupon || !selectedKupon.wartosc_znizki) {
            return {
                rabatKwotowy: 0,
                kosztDostawyPoRabacie: podstawowyKosztDostawy,
            };
        }

        const wartosc = selectedKupon.wartosc_znizki.toLowerCase();

        if (wartosc.includes('dostawa')) {
            return {
                rabatKwotowy: 0,
                kosztDostawyPoRabacie: 0,
            };
        }

        if (wartosc.includes('%')) {
            const procent = parseFloat(wartosc.replace('%', '').replace(',', '.'));
            const rabat = suma * (procent / 100);

            return {
                rabatKwotowy: rabat,
                kosztDostawyPoRabacie: podstawowyKosztDostawy,
            };
        }

        if (wartosc.includes('zł')) {
            const kwota = parseFloat(wartosc.replace('zł', '').replace(',', '.'));
            const rabat = Math.min(kwota, suma);

            return {
                rabatKwotowy: rabat,
                kosztDostawyPoRabacie: podstawowyKosztDostawy,
            };
        }

        return {
            rabatKwotowy: 0,
            kosztDostawyPoRabacie: podstawowyKosztDostawy,
        };
    };

    const { rabatKwotowy, kosztDostawyPoRabacie } = obliczRabat();
    const sumaDoZaplaty = Math.max(suma - rabatKwotowy + kosztDostawyPoRabacie, 0);

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap beige-strip">
                <div className="section-ribbon blue-ribbon large-ribbon">{t('cart.title')}</div>
            </div>

            <div className="cart-layout">
                <section className="cart-products">
                    <div className="section-ribbon blue-ribbon small-ribbon">{t('cart.products_title')}</div>

                    <div className="list-stack">
                        {pozycje.length === 0 ? (
                            <p>{t('cart.empty')}</p>
                        ) : (
                            pozycje.map((item) => (
                                <article className="cart-item" key={item.id_pozycja_koszyka}>
                                    <div className="cart-thumb">{t('cart.item.image_alt')}</div>

                                    <div className="cart-copy">
                                        <strong>{item.nazwa}</strong>
                                        <span>{t('cart.item.unit_price', { price: item.cena.toFixed(2) })}</span>
                                        <span>
                                            {t('cart.item.total_info', { amount: item.ilosc, total: item.cena_calkowita.toFixed(2) })}
                                        </span>

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button
                                                className="secondary-button"
                                                onClick={() => zmienIlosc(item.id_produkt, item.ilosc - 1)}
                                            >
                                                -
                                            </button>

                                            <button
                                                className="secondary-button"
                                                onClick={() => zmienIlosc(item.id_produkt, item.ilosc + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        className="trash-button"
                                        onClick={() => zmienIlosc(item.id_produkt, 0)}
                                    >
                                        ❌
                                    </button>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="cart-summary-wrap">
                    <div className="section-ribbon green-ribbon small-ribbon">
                        {t('cart.summary_title')}
                    </div>

                    <div className="summary-card">
                        <div className="summary-row">
                            <span>{t('cart.summary.subtotal')}</span>
                            <strong>{suma.toFixed(2)} {t('cart.summary.currency')}</strong>
                        </div>

                        <div className="summary-row">
                            <span>{t('cart.summary.delivery')}</span>
                            <strong>{kosztDostawyPoRabacie.toFixed(2)} {t('cart.summary.currency')}</strong>
                        </div>

                        <div className="summary-row discount-action-row">
                            <span>{t('cart.summary.selected_discount')}</span>
                            <strong>{selectedKupon ? selectedKupon.nazwa : t('cart.summary.no_discount')}</strong>
                        </div>

                        {selectedKupon && (
                            <div className="summary-row">
                                <span>{t('cart.summary.discount_value')}</span>
                                <strong>
                                    {selectedKupon.wartosc_znizki || t('cart.summary.none')}
                                    {rabatKwotowy > 0 && ` (-${rabatKwotowy.toFixed(2)} ${t('cart.summary.currency')})`}
                                </strong>
                            </div>
                        )}

                        <button
                            className="secondary-button discount-select-button"
                            onClick={() => {
                                fetchKupony();
                                setIsPopupOpen(true);
                            }}
                        >
                            {t('cart.summary.choose_discount_btn')}
                        </button>

                        <div className="summary-row total-row">
                            <span>{t('cart.summary.total')}</span>
                            <strong>{sumaDoZaplaty.toFixed(2)} {t('cart.summary.currency')}</strong>
                        </div>
                    </div>

                    <button
                        className="mint-button order-button"
                        onClick={() => {
                            if (selectedKupon) {
                                localStorage.setItem('selectedKupon', JSON.stringify(selectedKupon));
                            } else {
                                localStorage.removeItem('selectedKupon');
                            }

                            onNavigate('payment');
                        }}
                    >
                        {t('cart.summary.order_btn')}
                    </button>
                </section>
            </div>

            {isPopupOpen && (
                <div className="modal-overlay" onClick={() => setIsPopupOpen(false)}>
                    <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="section-ribbon blue-ribbon small-ribbon modal-ribbon">
                            {t('cart.modal.title')}
                        </div>

                        <div className="reward-choice-list">
                            {kupony.length === 0 && (
                                <p className="modal-note">{t('cart.modal.no_coupons')}</p>
                            )}

                            {kupony.map((kupon) => {
                                const isActive =
                                    selectedKupon?.id_posiadany_kupon === kupon.id_posiadany_kupon;

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
                                        <div className="reward-choice-icon">{kupon.ikona}</div>

                                        <div className="reward-choice-copy">
                                            <strong>{kupon.nazwa}</strong>
                                            <span>{kupon.opis || t('cart.modal.no_description')}</span>
                                            <span>{kupon.wartosc_znizki || t('cart.modal.no_discount_value')}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="modal-note">{t('cart.modal.note')}</p>

                        <div className="modal-actions">
                            <button className="secondary-button" onClick={() => setIsPopupOpen(false)}>
                                {t('cart.modal.close')}
                            </button>

                            <button
                                className="mint-button"
                                onClick={() => {
                                    if (!selectedKupon) {
                                        alert(t('cart.alerts.no_discount_selected'));
                                        return;
                                    }

                                    setIsPopupOpen(false);
                                }}
                            >
                                {t('cart.modal.use_discount')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}