import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

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
    const [punkty, setPunkty] = useState(localStorage.getItem('punkty') || '0');
    const [kupony, setKupony] = useState<Kupon[]>([]);

    const userId = localStorage.getItem('userId');

    const fetchPunkty = () => {
        if (!userId) {
            setPunkty('0');
            return;
        }

        fetch(`http://127.0.0.1:8000/uzytkownik/${userId}/punkty`)
            .then((res) => res.json())
            .then((data) => {
                const aktualnePunkty = String(data.punkty ?? 0);
                setPunkty(aktualnePunkty);
                localStorage.setItem('punkty', aktualnePunkty);
            })
            .catch((err) => console.error(err));
    };

    const fetchKupony = () => {
        fetch('http://127.0.0.1:8000/kupony/')
            .then((res) => res.json())
            .then((data) => setKupony(data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchPunkty();
        fetchKupony();
    }, []);

    const kupKupon = async (idKuponu: number) => {
        if (!userId) {
            alert(t('points_shop.alerts.not_logged_in'));
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/kupony/kup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_uzytkownik: Number(userId),
                    id_kupon: idKuponu
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail || t('points_shop.alerts.buy_failed'));
                return;
            }

            alert(data.msg); 
            const nowePunkty = String(data.punkty ?? 0);
            setPunkty(nowePunkty);
            localStorage.setItem('punkty', nowePunkty);
            window.dispatchEvent(new Event('punktyChanged'));
        } catch (error) {
            alert(t('points_shop.alerts.server_error'));
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