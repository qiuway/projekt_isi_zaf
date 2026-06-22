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
      .then(res => res.json())
      .then(data => setUserData(data));
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('userId'); // Usuwamy ID z pamięci
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
          <div className="avatar-circle">
            <div className="avatar-head" />
            <div className="avatar-body" />
          </div>
          <button className="secondary-button">Zmień zdjęcie</button>
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