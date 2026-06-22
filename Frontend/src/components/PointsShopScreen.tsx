import { useEffect, useState } from 'react';
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
            alert('Musisz być zalogowany.');
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
                alert(data.detail || 'Nie udało się kupić nagrody.');
                return;
            }

            alert(data.msg);
            const nowePunkty = String(data.punkty ?? 0);
            setPunkty(nowePunkty);
            localStorage.setItem('punkty', nowePunkty);
            window.dispatchEvent(new Event('punktyChanged'));
        } catch (error) {
            alert('Błąd połączenia z serwerem.');
        }
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">SKLEP ZA PUNKTY</div>
            </div>

            <section className="help-card">
                <article className="help-item points-balance-box">
                    <h3>Twoje punkty</h3>
                    <p>
                        Aktualnie dostępne punkty: <strong>{punkty} pkt</strong>
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
                                <span>Opis</span>
                                <strong>{kupon.opis}</strong>
                            </div>

                            <div className="achievement-line two-up">
                                <div>
                                    <span>Wartość</span>
                                    <strong>{kupon.wartosc_znizki || 'Brak'}</strong>
                                </div>

                                <div>
                                    <span>Cena</span>
                                    <strong>{kupon.koszt_punktowy} pkt</strong>
                                </div>
                            </div>
                        </div>

                        <button
                            className="mint-button reward-button"
                            onClick={() => kupKupon(kupon.id_kupon)}
                        >
                            Kup za punkty
                        </button>
                    </article>
                ))}
            </div>
        </div>
    );
}