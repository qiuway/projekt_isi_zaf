import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [imie, setImie] = useState('');
  const [nazwisko, setNazwisko] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [adres, setAdres] = useState('');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`)
      .then(res => res.json())
      .then(data => {
        setImie(data.imie || '');
        setNazwisko(data.nazwisko || '');
        setEmail(data.email || '');
        setTelefon(data.numer_telefonu ? String(data.numer_telefonu) : '');
        setAdres(data.adres || '');
      })
      .catch(err => console.error(err));
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    
    const payload = {
      imie,
      nazwisko,
      email,
      numer_telefonu: telefon ? parseInt(telefon) : null,
      adres: adres || null
    };

    const res = await fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Zapisano zmiany pomyślnie!');
      onNavigate('profile');
    } else {
      alert('Wystąpił błąd podczas zapisywania');
    }
  };

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">USTAWIENIA</div>
      </div>

      <section className="settings-content">
        <h3>Edytuj dane profilu</h3>
        <div className="settings-form-grid">
          <label>
            Imię
            <input className="soft-input" value={imie} onChange={e => setImie(e.target.value)} />
          </label>
          <label>
            Nazwisko
            <input className="soft-input" value={nazwisko} onChange={e => setNazwisko(e.target.value)} />
          </label>
          <label>
            Email
            <input className="soft-input" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>
            Numer telefonu
            <input className="soft-input" type="number" placeholder="Np. 123456789" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Adres dostawy
            <input className="soft-input" placeholder="Ulica, numer, miasto..." value={adres} onChange={e => setAdres(e.target.value)} />
          </label>
        </div>
        
        <div className="settings-actions">
          <button className="mint-button" onClick={handleSave}>Zapisz zmiany</button>
        </div>
      </section>
    </div>
  );
}