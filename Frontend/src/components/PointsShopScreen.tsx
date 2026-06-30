import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { apiClient } from '../api/apiClient';
import { useNotify } from './NotificationProvider';

interface PointsShopScreenProps {
    onNavigate: (screen: Screen) => void;
}

type Kupon = {
    id_kupon: number;
    nazwa: string;
    opis: string | null;
    koszt_punktowy: number;
    wartosc_znizki: string | null;
    ikona: string | null;
};

export function PointsShopScreen({ onNavigate }: PointsShopScreenProps) {
    const { t } = useTranslation();
    const notify = useNotify();
    const [punkty, setPunkty] = useState(localStorage.getItem('punkty') || '0');
    const [kupony, setKupony] = useState<Kupon[]>([]);

    const userId = localStorage.getItem('userId');

    const fetchPunkty = () => {
        if (!userId) {
            setPunkty('0');
            return;
        }

        apiClient.get(`/uzytkownik/${userId}/punkty`)
            .then((response) => {
                const data = response.data;
                const aktualnePunkty = String(data.punkty ?? 0);
                setPunkty(aktualnePunkty);
                localStorage.setItem('punkty', aktualnePunkty);
            })
            .catch((err) => console.error(err));
    };

    const fetchKupony = () => {
        apiClient.get('/kupony/')
            .then((response) => setKupony(response.data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchPunkty();
        fetchKupony();
    }, []);

    const kupKupon = async (idKuponu: number) => {
        if (!userId) {
            notify(t('points_shop.alerts.not_logged_in'), 'warning');
            return;
        }

        try {
            const response = await apiClient.post('/kupony/kup', {
                id_uzytkownik: Number(userId),
                id_kupon: idKuponu
            });

            const data = response.data;

            notify(data.msg, 'success');
            const nowePunkty = String(data.punkty ?? 0);
            setPunkty(nowePunkty);
            localStorage.setItem('punkty', nowePunkty);
            window.dispatchEvent(new Event('punktyChanged'));
        } catch (error: any) {
            notify(
                error.response?.data?.detail ||
                t('points_shop.alerts.server_error'),
                'error'
            );
        }
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">{t('points_shop.title')}</div>
            </div>

            <section className="help-card">
                <article className="help-item points-balance-box">
                    <h3>{t('points_shop.your_points')}</h3>
                    <p>
                        {t('points_shop.available_points')} <strong>{punkty} {t('points_shop.reward.pts')}</strong>
                    </p>
                </article>
            </section>

            <div className="points-shop-grid">
                {kupony.map((kupon) => (
                    <article className="reward-card" key={kupon.id_kupon}>
                        <div className="reward-icon" aria-hidden="true">
                            {kupon.ikona}
                        </div>

                        <div className="reward-content">
                            <div className="achievement-line">
                                <strong>{kupon.nazwa}</strong>
                            </div>

                            <div className="achievement-line">
                                <span>{t('points_shop.reward.description')}</span>
                                <strong>{kupon.opis}</strong>
                            </div>

                            <div className="achievement-line two-up">
                                <div>
                                    <span>{t('points_shop.reward.value')}</span>
                                    <strong>{kupon.wartosc_znizki || t('points_shop.reward.none')}</strong>
                                </div>

                                <div>
                                    <span>{t('points_shop.reward.price')}</span>
                                    <strong>{kupon.koszt_punktowy} {t('points_shop.reward.pts')}</strong>
                                </div>
                            </div>
                        </div>

                        <button
                            className="mint-button reward-button"
                            onClick={() => kupKupon(kupon.id_kupon)}
                        >
                            {t('points_shop.reward.buy_button')}
                        </button>
                    </article>
                ))}
            </div>
        </div>
    );
}