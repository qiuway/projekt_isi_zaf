import { useEffect, useState } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { apiClient } from '../api/apiClient';

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
    const [osiagniecia, setOsiagniecia] = useState<Osiagniecie[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOsiagniecia = () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            setOsiagniecia([]);
            setLoading(false);
            return;
        }

        apiClient.get(`/uzytkownik/${userId}/osiagniecia`)
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
            alert('Musisz być zalogowany.');
            return;
        }

        try {
            const response = await apiClient.post(
                `/uzytkownik/${userId}/osiagniecia/${idOsiagniecia}/odbierz`
            );

            const data = response.data;

            alert(data.msg);

            localStorage.setItem('punkty', String(data.punkty ?? 0));
            window.dispatchEvent(new Event('punktyChanged'));

            fetchOsiagniecia();
        } catch (error: any) {
            alert(
                error.response?.data?.detail ||
                'Błąd połączenia z serwerem.'
            );
        }
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">OSIĄGNIĘCIA</div>
            </div>

            <section className="help-card">
                <article className="help-item">
                    <h3>Twoje osiągnięcia</h3>
                    <p>
                        Kliknij zdobyte osiągnięcie, aby odebrać punkty. Punkty zostaną
                        automatycznie dopisane do Twojego konta.
                    </p>
                </article>
            </section>

            {loading ? (
                <p style={{ textAlign: 'center' }}>Ładowanie osiągnięć...</p>
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
                                    <span>Nazwa</span>
                                    <strong>{osiagniecie.nazwa}</strong>
                                </div>

                                <div className="achievement-line">
                                    <span>Opis</span>
                                    <strong>{osiagniecie.opis || 'Brak opisu'}</strong>
                                </div>

                                <div className="achievement-line two-up">
                                    <div>
                                        <span>Punkty</span>
                                        <strong>{osiagniecie.punkty} pkt</strong>
                                    </div>

                                    <div>
                                        <span>Status</span>
                                        <strong>
                                            {osiagniecie.odebrane
                                                ? 'Odebrane'
                                                : osiagniecie.zdobyte
                                                    ? 'Do odebrania'
                                                    : 'Niezdobyte'}
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
                                    ? 'Punkty odebrane'
                                    : osiagniecie.zdobyte
                                        ? 'Odbierz punkty'
                                        : 'Niezdobyte'}
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}