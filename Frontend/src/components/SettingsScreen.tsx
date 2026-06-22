import { useState, useEffect, useRef } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  // Stany formularza tekstowego
  const [imie, setImie] = useState('');
  const [nazwisko, setNazwisko] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [adres, setAdres] = useState('');
  
  const [zdjecie, setZdjecie] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userId = localStorage.getItem('userId');

  const fetchUserData = () => {
    if (!userId) return;
    fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`)
      .then(res => res.json())
      .then(data => {
        setImie(data.imie || '');
        setNazwisko(data.nazwisko || '');
        setEmail(data.email || '');
        setTelefon(data.numer_telefonu ? String(data.numer_telefonu) : '');
        setAdres(data.adres || '');
        setZdjecie(data.zdjecie_profilowe || null);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleSaveTextData = async () => {
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
      alert('Zapisano dane profilu pomyślnie!');
      onNavigate('profile');
    } else {
      alert('Wystąpił błąd podczas zapisywania');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userId) return;

    const fileToUpload = files[0];
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await fetch(`http://127.0.0.1:8000/uzytkownik/${userId}/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        fetchUserData(); 
      } else {
        alert(data.detail || 'Błąd podczas wgrywania zdjęcia.');
      }
    } catch (error) {
      console.error('Błąd sieciowy:', error);
      alert('Błąd połączenia z serwerem.');
    }
  };

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">USTAWIENIA</div>
      </div>

      <section className="settings-content">
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <div className="avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
            {zdjecie ? (
              <img 
                src={`http://127.0.0.1:8000${zdjecie}?t=${Date.now()}`} 
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
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleFileChange}
          />
          <button className="secondary-button" onClick={() => fileInputRef.current?.click()}>
            Zmień zdjęcie
          </button>
        </div>

        <h3 style={{ borderBottom: '1px solid #dccbbd', paddingBottom: '10px', marginBottom: '20px', color: '#5d4537' }}>Dane tekstowe</h3>
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
        
        <div className="settings-actions" style={{ marginTop: '30px' }}>
          <button className="mint-button" onClick={handleSaveTextData}>Zapisz zmiany profilu</button>
        </div>
      </section>
    </div>
  );
}