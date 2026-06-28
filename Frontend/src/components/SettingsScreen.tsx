import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface SettingsScreenProps {
    onNavigate: (screen: Screen) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
    const { t, i18n } = useTranslation();
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
                <div className="section-ribbon blue-ribbon large-ribbon">{t('settings.title')}</div>
            </div>

            <section className="settings-content">
                <h3>{t('settings.section_app')}</h3>

                <div className="settings-row">
                    <div className="settings-row-text">
                        <strong>{t('settings.dark_mode')}</strong>
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

                <div className="settings-row" style={{ marginTop: '20px' }}>
                    <div className="settings-row-text">
                        <strong>{t('settings.language')}</strong>
                    </div>

                    <select
                        className="soft-input"
                        value={i18n.language}
                        onChange={(e) => i18n.changeLanguage(e.target.value)}
                        style={{ padding: '5px 10px', width: 'auto', minWidth: '120px' }}
                    >
                        <option value="pl">{t('settings.lang_pl')}</option>
                        <option value="en">{t('settings.lang_en')}</option>
                    </select>
                </div>
            </section>
        </div>
    );
}