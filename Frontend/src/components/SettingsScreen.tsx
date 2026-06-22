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

      <section className="empty-settings-panel" />
    </div>
  );
}
