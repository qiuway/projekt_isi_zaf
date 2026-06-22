import { useEffect, useState } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface SettingsScreenProps {
    onNavigate: (screen: Screen) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.body.classList.add('dark-mode');
        } else {
            setDarkMode(false);
            document.body.classList.remove('dark-mode');
        }
    }, []);

    const handleThemeChange = () => {
        const newValue = !darkMode;
        setDarkMode(newValue);

        if (newValue) {
            localStorage.setItem('theme', 'dark');
            document.body.classList.add('dark-mode');
        } else {
            localStorage.setItem('theme', 'light');
            document.body.classList.remove('dark-mode');
        }
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">USTAWIENIA</div>
            </div>

            <section className="settings-content">
                <h3>Ustawienia aplikacji</h3>

                <div className="settings-row">
                    <div className="settings-row-text">
                        <strong>Tryb ciemny</strong>
                    </div>

                    <label className="settings-switch">
                        <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={handleThemeChange}
                        />
                        <span className="settings-slider"></span>
                    </label>
                </div>
            </section>
        </div>
    );
}