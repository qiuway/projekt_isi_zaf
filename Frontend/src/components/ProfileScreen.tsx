import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">MÓJ PROFIL</div>
      </div>

      <section className="profile-card">
        <div className="avatar-column">
          <div className="avatar-circle">
            <div className="avatar-head" />
            <div className="avatar-body" />
          </div>
          <button className="secondary-button">Zmień zdjęcie</button>
        </div>

        <div className="profile-info">
          <div className="profile-line"><span>Imię i nazwisko</span><strong>&lt;imię i nazwisko&gt;</strong></div>
          <div className="profile-line"><span>Email</span><strong>&lt;email&gt;</strong></div>
          <div className="profile-line"><span>Numer telefonu</span><strong>&lt;numer telefonu&gt;</strong></div>
          <div className="profile-line"><span>Adres dostawy</span><strong>&lt;adres&gt;</strong></div>
          <div className="profile-actions">
            <button className="secondary-button" onClick={() => onNavigate('settings')}>
              EDYTUJ PROFIL
            </button>
            <button className="mint-button logout-button" onClick={() => onNavigate('login')}>
              WYLOGUJ
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
