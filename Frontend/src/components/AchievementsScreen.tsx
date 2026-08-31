import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { achievementsApi } from '../api/apiClient';
import { useNotify } from './NotificationProvider';

interface AchievementsScreenProps {
    onNavigate: (screen: Screen) => void;
}

type Osiagniecie = {
    id_osiagniecia: number;
    nazwa: string;
    opis: string | null;
    warunek: string;
    punkty: number;
    ikona: string | null;
    zdobyte: boolean;
    odebrane: boolean;
};

export function AchievementsScreen({ onNavigate }: AchievementsScreenProps) {
    const { t } = useTranslation();
    const [osiagniecia, setOsiagniecia] = useState<Osiagniecie[]>([]);
    const [loading, setLoading] = useState(true);
    const notify = useNotify();

    const fetchOsiagniecia = () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setOsiagniecia([]);
            setLoading(false);
            return;
        }

        achievementsApi.getUserAchievements(userId)
            .then((response) => {
                setOsiagniecia(response.data);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOsiagniecia();
    }, []);

    const odbierzPunkty = async (idOsiagniecia: number) => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            notify(t('achievements.alerts.not_logged_in'), 'warning');
            return;
        }

        try {
            const response = await achievementsApi.claimAchievement(userId, idOsiagniecia);
            const data = response.data;

            notify(data.msg, 'success');

            localStorage.setItem('punkty', String(data.punkty ?? 0));
            window.dispatchEvent(new Event('punktyChanged'));

            fetchOsiagniecia();
        } catch (error: any) {
            notify(
                error.response?.data?.detail ||
                t('achievements.alerts.server_error'),
                'error'
            );
        }
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">
                    {t('achievements.title')}
                </div>
            </div>

            <section className="help-card">
                <article className="help-item">
                    <h3>{t('achievements.subtitle')}</h3>
                    <p>{t('achievements.instructions')}</p>
                </article>
            </section>

            {loading ? (
                <p style={{ textAlign: 'center' }}>{t('achievements.loading')}</p>
            ) : (
                <div className="points-shop-grid">
                    {osiagniecia.map((osiagniecie) => (
                        <article
                            className={`achievement-card ${
                                osiagniecie.zdobyte ? 'achievement-unlocked' : 'achievement-locked'
                            }`}
                            key={osiagniecie.id_osiagniecia}
                        >
                            <div className="reward-icon" aria-hidden="true">
                                {osiagniecie.ikona || '🏆'}
                            </div>

                            <div className="reward-content">
                                <div className="achievement-line">
                                    <span>{t('achievements.labels.name')}</span>
                                    <strong>{osiagniecie.nazwa}</strong>
                                </div>

                                <div className="achievement-line">
                                    <span>{t('achievements.labels.description')}</span>
                                    <strong>{osiagniecie.opis || t('achievements.labels.no_description')}</strong>
                                </div>

                                <div className="achievement-line two-up">
                                    <div>
                                        <span>{t('achievements.labels.points')}</span>
                                        <strong>{osiagniecie.punkty} {t('achievements.pts')}</strong>
                                    </div>

                                    <div>
                                        <span>{t('achievements.labels.status')}</span>
                                        <strong>
                                            {osiagniecie.odebrane
                                                ? t('achievements.labels.status_claimed')
                                                : osiagniecie.zdobyte
                                                    ? t('achievements.labels.status_to_claim')
                                                    : t('achievements.labels.status_locked')}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="mint-button reward-button"
                                disabled={!osiagniecie.zdobyte || osiagniecie.odebrane}
                                onClick={() => odbierzPunkty(osiagniecie.id_osiagniecia)}
                            >
                                {osiagniecie.odebrane
                                    ? t('achievements.buttons.claimed')
                                    : osiagniecie.zdobyte
                                        ? t('achievements.buttons.claim')
                                        : t('achievements.buttons.locked')}
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}