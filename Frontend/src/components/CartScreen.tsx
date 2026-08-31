import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { cartApi, couponsApi, userApi, getAvatarUrl } from '../api/apiClient';
import { useNotify } from './NotificationProvider';

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
    zdjecie?: string | null;
    dodane_przez?: {
        id_uzytkownik: number;
        imie: string;
        nazwisko: string;
        email: string;
        zdjecie_profilowe: string | null;
    };
};

type UczestnikPodsumowanie = {
    id_uzytkownik: number;
    imie: string;
    nazwisko: string;
    zdjecie_profilowe: string | null;
    kwota_dan: number;
    udzial_dostawa: number;
    suma_do_zwrotu: number;
};

type GroupCartData = {
    id_koszyk: number;
    kod_grupy: string;
    is_group: boolean;
    host: {
        id_uzytkownik: number;
        imie: string;
        nazwisko: string;
        email: string;
        zdjecie_profilowe: string | null;
    };
    uczestnicy: {
        id_uzytkownik: number;
        imie: string;
        nazwisko: string;
        email: string;
        zdjecie_profilowe: string | null;
    }[];
    pozycje: PozycjaKoszyka[];
    suma_dan: number;
    koszt_dostawy: number;
    suma_calkowita: number;
    podsumowanie_uczestnikow: UczestnikPodsumowanie[];
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
    const notify = useNotify();
    const [cartTab, setCartTab] = useState<'individual' | 'group'>('individual');

    const [adres, setAdres] = useState<string | null>(null);
    const [pozycje, setPozycje] = useState<PozycjaKoszyka[]>([]);
    const [suma, setSuma] = useState(0);

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [kupony, setKupony] = useState<KuponUzytkownika[]>([]);
    const [selectedKupon, setSelectedKupon] = useState<KuponUzytkownika | null>(null);

    const [activeGroupCode, setActiveGroupCode] = useState<string | null>(() => localStorage.getItem('activeGroupCode'));
    const [inputGroupCode, setInputGroupCode] = useState('');
    const [groupCart, setGroupCart] = useState<GroupCartData | null>(null);
    const [isGroupLoading, setIsGroupLoading] = useState(false);

    const currentUserId = Number(localStorage.getItem('userId') || 0);

    const fetchKoszyk = () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setPozycje([]);
            setSuma(0);
            return;
        }

        cartApi.getCart(userId)
            .then((response) => {
                const data = response.data;
                setPozycje(data.pozycje || []);
                setSuma(data.suma || 0);
                if (data.is_group && data.kod_grupy) {
                    setActiveGroupCode(data.kod_grupy);
                    localStorage.setItem('activeGroupCode', data.kod_grupy);
                }
            })
            .catch((err) => console.error(err));
    };

    const fetchKupony = () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setKupony([]);
            return;
        }

        couponsApi.getUserCoupons(userId)
            .then((response) => setKupony(response.data))
            .catch((err) => console.error(err));
    };

    const fetchAdres = () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setAdres(null);
            return;
        }

        userApi.getProfile(userId)
            .then((response) => {
                setAdres(response.data.adres || null);
            })
            .catch((err) => console.error(err));
    };

    const fetchGroupCart = async (code: string) => {
        try {
            const response = await cartApi.getGroupCart(code);
            setGroupCart(response.data);
        } catch (error: any) {
            console.error('Błąd pobierania koszyka grupowego:', error);
            if (error.response?.status === 404 || error.response?.status === 410) {
                const msg = error.response?.data?.detail || t('cart.group.host_placed_order', 'Gospodarz złożył zamówienie! Koszyk grupowy został zamknięty.');
                notify(msg, 'info');
                setActiveGroupCode(null);
                localStorage.removeItem('activeGroupCode');
                localStorage.removeItem('groupCartOrder');
                setGroupCart(null);
                setCartTab('individual');
                fetchKoszyk();
                window.dispatchEvent(new Event('koszykChanged'));
            }
        }
    };

    useEffect(() => {
        fetchKoszyk();
        fetchKupony();
        fetchAdres();
    }, []);

    useEffect(() => {
        let interval: any = null;

        if (cartTab === 'group' && activeGroupCode) {
            fetchGroupCart(activeGroupCode);
            interval = setInterval(() => {
                fetchGroupCart(activeGroupCode);
            }, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [cartTab, activeGroupCode]);

    const handleCreateGroupCart = async () => {
        try {
            setIsGroupLoading(true);
            const res = await cartApi.createGroupCart();
            const created = res.data;
            setActiveGroupCode(created.kod_grupy);
            localStorage.setItem('activeGroupCode', created.kod_grupy);
            setGroupCart(created);
            notify(t('cart.group.created_success', { code: created.kod_grupy }), 'success');
        } catch (error: any) {
            notify(error.response?.data?.detail || t('cart.group.create_error'), 'error');
        } finally {
            setIsGroupLoading(false);
        }
    };

    const handleJoinGroupCart = async () => {
        if (!inputGroupCode.trim()) {
            notify(t('cart.group.code_required'), 'warning');
            return;
        }
        try {
            setIsGroupLoading(true);
            const res = await cartApi.joinGroupCart(inputGroupCode.trim());
            const joined = res.data;
            setActiveGroupCode(joined.kod_grupy);
            localStorage.setItem('activeGroupCode', joined.kod_grupy);
            setGroupCart(joined);
            setInputGroupCode('');
            notify(t('cart.group.joined_success', { code: joined.kod_grupy }), 'success');
        } catch (error: any) {
            notify(error.response?.data?.detail || t('cart.group.join_error'), 'error');
        } finally {
            setIsGroupLoading(false);
        }
    };

    const handleLeaveGroupCart = async () => {
        if (!activeGroupCode) return;
        try {
            await cartApi.leaveGroupCart(activeGroupCode);
            notify(t('cart.group.left_success'), 'success');
            setActiveGroupCode(null);
            localStorage.removeItem('activeGroupCode');
            setGroupCart(null);
            fetchKoszyk();
        } catch (error: any) {
            notify(error.response?.data?.detail || t('cart.group.leave_error'), 'error');
        }
    };

    const handleCopyCode = () => {
        if (activeGroupCode) {
            navigator.clipboard.writeText(activeGroupCode);
            notify(t('cart.group.copied_code'), 'success');
        }
    };

    const zmienIlosc = async (idProduktu: number, nowaIlosc: number) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            notify(t('cart.alerts.not_logged_in'), 'warning');
            return;
        }

        try {
            await cartApi.updateItem(userId, idProduktu, nowaIlosc);
            fetchKoszyk();
            window.dispatchEvent(new Event('koszykChanged'));
        } catch (error) {
            notify(t('cart.alerts.server_error'), 'error');
        }
    };

    const zmienIloscGrupowa = async (pozycjaId: number, nowaIlosc: number) => {
        if (!activeGroupCode) return;
        try {
            await cartApi.updateGroupItem(activeGroupCode, pozycjaId, nowaIlosc);
            fetchGroupCart(activeGroupCode);
            window.dispatchEvent(new Event('koszykChanged'));
        } catch (error: any) {
            notify(error.response?.data?.detail || t('cart.alerts.server_error'), 'error');
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

            <div className="cart-tab-toggle-container">
                <button
                    className={`cart-tab-btn ${cartTab === 'individual' ? 'active' : ''}`}
                    onClick={() => setCartTab('individual')}
                >
                    {t('cart.tabs.individual', 'Mój koszyk')}
                </button>
                <button
                    className={`cart-tab-btn ${cartTab === 'group' ? 'active' : ''}`}
                    onClick={() => setCartTab('group')}
                >
                    {t('cart.tabs.group', 'Koszyk grupowy (Składka)')}
                    {activeGroupCode && <span className="group-active-indicator">●</span>}
                </button>
            </div>

            {cartTab === 'individual' ? (
                <div className="cart-layout">
                    <section className="cart-products">
                        <div className="section-ribbon blue-ribbon small-ribbon">{t('cart.products_title')}</div>

                        <div className="list-stack">
                            {pozycje.length === 0 ? (
                                <p>{t('cart.empty')}</p>
                            ) : (
                                pozycje.map((item) => (
                                    <article className={`cart-item ${!item.zdjecie ? 'no-thumb' : ''}`} key={item.id_pozycja_koszyka}>
                                        {item.zdjecie && (
                                            <div className="cart-thumb">
                                                <img
                                                    src={getAvatarUrl(item.zdjecie)!}
                                                    alt={item.nazwa}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }}
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}

                                        <div className="cart-copy">
                                            <strong>{item.nazwa}</strong>
                                            {(item as any).restauracja_nazwa && (
                                                <span style={{ fontSize: '0.82rem', color: '#7b6254', fontWeight: 600 }}>
                                                    {(item as any).restauracja_nazwa}
                                                </span>
                                            )}
                                            <span>{t('cart.item.unit_price', { price: (Number(item.cena) || 0).toFixed(2) })}</span>
                                            <span>
                                                {t('cart.item.total_info', {
                                                    amount: item.ilosc,
                                                    total: (Number(item.cena_calkowita ?? (item as any).wartosc_calkowita ?? (item.cena * item.ilosc)) || 0).toFixed(2)
                                                })}
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
                            className={`mint-button order-button ${pozycje.length === 0 ? 'disabled-button' : ''}`}
                            onClick={() => {
                                if (pozycje.length === 0) {
                                    notify(t('cart.alerts.empty_cart'), 'warning');
                                    return;
                                }

                                if (!adres || adres.trim() === '') {
                                    notify(t('cart.alerts.missing_address'), 'warning');
                                    onNavigate('profileEdit');
                                    return;
                                }

                                localStorage.removeItem('groupCartOrder');
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
            ) : (
                <div className="group-cart-wrapper">
                    {!activeGroupCode ? (
                        <div className="group-cart-entry-card">
                            <div className="group-entry-grid">
                                <div className="group-entry-box">
                                    <h3>{t('cart.group.create_title', 'Stwórz koszyk grupowy')}</h3>
                                    <p>{t('cart.group.create_desc', 'Będziesz gospodarzem zamówienia. Otrzymasz unikalny kod do wysłania znajomym.')}</p>
                                    <button
                                        className="mint-button"
                                        style={{ marginTop: '14px', width: '100%' }}
                                        onClick={handleCreateGroupCart}
                                        disabled={isGroupLoading}
                                    >
                                        {isGroupLoading ? t('cart.group.loading') : t('cart.group.create_btn', 'Utwórz pokój')}
                                    </button>
                                </div>

                                <div className="group-entry-divider">
                                    <span>{t('cart.group.or', 'LUB')}</span>
                                </div>

                                <div className="group-entry-box">
                                    <h3>{t('cart.group.join_title', 'Dołącz z kodem zaproszenia')}</h3>
                                    <p>{t('cart.group.join_desc', 'Wpisz kod otrzymany od znajomego (np. FF-7X9K2), aby wspólnie zamawiać.')}</p>
                                    <div className="group-join-input-wrap">
                                        <input
                                            className="soft-input uppercase-input"
                                            placeholder="FF-XXXXXX"
                                            value={inputGroupCode}
                                            onChange={(e) => setInputGroupCode(e.target.value.toUpperCase())}
                                        />
                                        <button
                                            className="secondary-button"
                                            onClick={handleJoinGroupCart}
                                            disabled={isGroupLoading}
                                        >
                                            {t('cart.group.join_btn', 'Dołącz')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="group-room-bar">
                                <div className="group-room-code-section">
                                    <span className="group-room-label">{t('cart.group.room_code_label', 'Kod grupy')}:</span>
                                    <span className="group-room-code-tag">{activeGroupCode}</span>
                                    <button className="secondary-button copy-code-btn" onClick={handleCopyCode}>
                                        {t('cart.group.copy_btn', 'Kopiuj')}
                                    </button>
                                </div>

                                <div className="group-room-members-section">
                                    <span className="group-room-label">{t('cart.group.members_label', 'Uczestnicy')}:</span>
                                    <div className="group-members-avatars">
                                        {groupCart?.uczestnicy.map((u) => (
                                            <div className="member-avatar-chip" key={u.id_uzytkownik} title={`${u.imie} ${u.nazwisko}`}>
                                                {getAvatarUrl(u.zdjecie_profilowe) ? (
                                                    <img src={getAvatarUrl(u.zdjecie_profilowe)!} alt={u.imie} />
                                                ) : (
                                                    <span className="member-initial">{u.imie[0]}</span>
                                                )}
                                                <span className="member-name-text">{u.imie}</span>
                                                {groupCart.host.id_uzytkownik === u.id_uzytkownik && (
                                                    <span className="host-badge">HOST</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button className="secondary-button leave-group-btn" onClick={handleLeaveGroupCart}>
                                    {groupCart?.host.id_uzytkownik === currentUserId ? t('cart.group.close_group_btn', 'Zamknij grupę') : t('cart.group.leave_btn', 'Opuść')}
                                </button>
                            </div>

                            <div className="cart-layout" style={{ marginTop: '20px' }}>
                                <section className="cart-products">
                                    <div className="section-ribbon blue-ribbon small-ribbon">
                                        {t('cart.group.dishes_title', 'Wspólne dania w koszyku')}
                                    </div>

                                    <div className="list-stack">
                                        {(!groupCart?.pozycje || groupCart.pozycje.length === 0) ? (
                                            <div className="empty-group-cart-box">
                                                <p>{t('cart.group.empty_dishes', 'Koszyk grupowy jest jeszcze pusty. Wejdź do restauracji i dodaj dania!')}</p>
                                                <button className="mint-button" onClick={() => onNavigate('home')}>
                                                    {t('cart.group.browse_menu', 'Przeglądaj menu restauracji')}
                                                </button>
                                            </div>
                                        ) : (
                                            groupCart.pozycje.map((item) => {
                                                const isAuthor = item.dodane_przez?.id_uzytkownik === currentUserId;
                                                const isHost = groupCart.host.id_uzytkownik === currentUserId;
                                                const canEdit = isAuthor || isHost;

                                                return (
                                                    <article className={`cart-item ${!item.zdjecie ? 'no-thumb' : ''}`} key={item.id_pozycja_koszyka}>
                                                        {item.zdjecie && (
                                                            <div className="cart-thumb">
                                                                <img
                                                                    src={getAvatarUrl(item.zdjecie)!}
                                                                    alt={item.nazwa}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }}
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="cart-copy">
                                                            <strong>{item.nazwa}</strong>
                                                            {(item as any).restauracja_nazwa && (
                                                                <span style={{ fontSize: '0.82rem', color: '#7b6254', fontWeight: 600 }}>
                                                                    {(item as any).restauracja_nazwa}
                                                                </span>
                                                            )}
                                                            <span>{t('cart.item.unit_price', { price: Number(item.cena).toFixed(2) })}</span>
                                                            <span>
                                                                {t('cart.item.total_info', {
                                                                    amount: item.ilosc,
                                                                    total: (Number(item.cena_calkowita) || (item.cena * item.ilosc)).toFixed(2)
                                                                })}
                                                            </span>

                                                            <div className="item-author-chip">
                                                                <div className="item-author-avatar">
                                                                    {getAvatarUrl(item.dodane_przez?.zdjecie_profilowe) ? (
                                                                        <img src={getAvatarUrl(item.dodane_przez?.zdjecie_profilowe)!} alt={item.dodane_przez?.imie} />
                                                                    ) : (
                                                                        <span>{item.dodane_przez?.imie ? item.dodane_przez.imie[0] : 'U'}</span>
                                                                    )}
                                                                </div>
                                                                <span>{t('cart.group.added_by', 'Dodał(a)')}: <strong>{item.dodane_przez?.imie} {item.dodane_przez?.nazwisko}</strong></span>
                                                            </div>

                                                            {canEdit && (
                                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                                    <button
                                                                        className="secondary-button"
                                                                        onClick={() => zmienIloscGrupowa(item.id_pozycja_koszyka, item.ilosc - 1)}
                                                                    >
                                                                        -
                                                                    </button>
                                                                    <button
                                                                        className="secondary-button"
                                                                        onClick={() => zmienIloscGrupowa(item.id_pozycja_koszyka, item.ilosc + 1)}
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {canEdit && (
                                                            <button
                                                                className="trash-button"
                                                                onClick={() => zmienIloscGrupowa(item.id_pozycja_koszyka, 0)}
                                                            >
                                                                ❌
                                                            </button>
                                                        )}
                                                    </article>
                                                );
                                            })
                                        )}
                                    </div>
                                </section>

                                <section className="cart-summary-wrap">
                                    <div className="section-ribbon green-ribbon small-ribbon">
                                        {t('cart.group.settlement_title', 'Podsumowanie Składki')}
                                    </div>

                                    <div className="summary-card">
                                        <div className="summary-row">
                                            <span>{t('cart.summary.subtotal')}</span>
                                            <strong>{(groupCart?.suma_dan || 0).toFixed(2)} zł</strong>
                                        </div>
                                        <div className="summary-row">
                                            <span>{t('cart.summary.delivery')}</span>
                                            <strong>{(groupCart?.koszt_dostawy || 0).toFixed(2)} zł</strong>
                                        </div>

                                        <hr style={{ margin: '12px 0', borderColor: 'rgba(0,0,0,0.08)' }} />

                                        <h4 style={{ margin: '8px 0', fontSize: '0.95rem' }}>{t('cart.group.per_person_title', 'Rozbicie na osoby')}:</h4>
                                        <div className="group-settlement-table">
                                            {groupCart?.podsumowanie_uczestnikow.map((u) => (
                                                <div key={u.id_uzytkownik} className="group-settlement-row">
                                                    <div className="settlement-user-col">
                                                        <span className="settlement-user-name">{u.imie}</span>
                                                        <span className="settlement-details-text">({u.kwota_dan.toFixed(2)} zł + dost: {u.udzial_dostawa.toFixed(2)} zł)</span>
                                                    </div>
                                                    <strong className="settlement-amount-col">{u.suma_do_zwrotu.toFixed(2)} zł</strong>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="summary-row total-row" style={{ marginTop: '16px' }}>
                                            <span>{t('cart.summary.total')}</span>
                                            <strong>{(groupCart?.suma_calkowita || 0).toFixed(2)} zł</strong>
                                        </div>
                                    </div>

                                    {groupCart?.host.id_uzytkownik === currentUserId ? (
                                        <button
                                            className={`mint-button order-button ${(!groupCart?.pozycje || groupCart.pozycje.length === 0) ? 'disabled-button' : ''}`}
                                            onClick={() => {
                                                if (!groupCart?.pozycje || groupCart.pozycje.length === 0) {
                                                    notify(t('cart.alerts.empty_cart'), 'warning');
                                                    return;
                                                }

                                                if (!adres || adres.trim() === '') {
                                                    notify(t('cart.alerts.missing_address'), 'warning');
                                                    onNavigate('profileEdit');
                                                    return;
                                                }

                                                localStorage.setItem('groupCartOrder', JSON.stringify({
                                                    isGroup: true,
                                                    groupCode: activeGroupCode,
                                                    participants: groupCart.podsumowanie_uczestnikow,
                                                    items: groupCart.pozycje
                                                }));

                                                onNavigate('payment');
                                            }}
                                        >
                                            {t('cart.group.order_split_btn', 'Złóż zamówienie (Składka)')}
                                        </button>
                                    ) : (
                                        <div className="guest-waiting-box">
                                            <div className="guest-waiting-copy">
                                                <strong>{t('cart.group.guest_waiting_title', 'Oczekiwanie na gospodarza')}</strong>
                                                <p>
                                                    {t('cart.group.only_host_can_order', {
                                                        host: `${groupCart?.host.imie} ${groupCart?.host.nazwisko}`
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                                        notify(t('cart.alerts.no_discount_selected'), 'warning');
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