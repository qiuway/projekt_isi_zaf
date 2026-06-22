import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const [userData, setUserData] = useState<any>(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`)
      .then((res) => res.json())
      .then((data) => setUserData(data))
      .catch((err) => console.error('Błąd ładowania profilu:', err));
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    onNavigate('login');
  };

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">MÓJ PROFIL</div>
      </div>

      <section className="profile-card">
        <div className="avatar-column">
<div className="avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {userData?.zdjecie_profilowe ? (
              <img 
                src={`http://127.0.0.1:8000${userData.zdjecie_profilowe}?t=${Date.now()}`} 
                alt="Awatar użytkownika" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <div className="avatar-head" />
                <div className="avatar-body" />
              </>
            )}
          </div>
        </div>

        <div className="profile-info">
          {userData ? (
            <>
              <div className="profile-line"><span>Imię i nazwisko</span><strong>{userData.imie} {userData.nazwisko}</strong></div>
              <div className="profile-line"><span>Email</span><strong>{userData.email}</strong></div>
              <div className="profile-line"><span>Numer telefonu</span><strong>{userData.numer_telefonu ? userData.numer_telefonu : 'Brak danych'}</strong></div>
              <div className="profile-line"><span>Adres dostawy</span><strong>{userData.adres ? userData.adres : 'Brak danych'}</strong></div>
            </>
          ) : (
            <p>Ładowanie danych...</p>
          )}

          <div className="profile-actions">
            <button className="secondary-button" onClick={() => onNavigate('settings')}>
              EDYTUJ PROFIL
            </button>
            <button className="mint-button logout-button" onClick={handleLogout}>
              WYLOGUJ
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}