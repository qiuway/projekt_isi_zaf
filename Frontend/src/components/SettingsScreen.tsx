import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface SettingsScreenProps {
    onNavigate: (screen: Screen) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">USTAWIENIA</div>
            </div>

            <section className="settings-content">
                <h3>Ustawienia aplikacji</h3>

                <div className="profile-line">
                    <span>Powiadomienia</span>
                    <strong>Włączone</strong>
                </div>

                <div className="profile-line">
                    <span>Tryb płatności</span>
                    <strong>Domyślny</strong>
                </div>

                <div className="profile-line">
                    <span>Język aplikacji</span>
                    <strong>Polski</strong>
                </div>

                <div className="profile-line">
                    <span>Motyw aplikacji</span>
                    <strong>Jasny</strong>
                </div>

                <div className="settings-actions">
                    <button className="secondary-button" onClick={() => onNavigate('profile')}>
                        WRÓĆ DO PROFILU
                    </button>
                </div>
            </section>
        </div>
    );
}