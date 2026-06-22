import { useState } from 'react';
import type { Screen } from '../types';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onNavigate: (screen: Screen) => void;
}

export function AuthScreen({ mode, onNavigate }: AuthScreenProps) {
  const isLogin = mode === 'login';

  // Stany przechowujące to, co użytkownik wpisuje w formularz
  const [imie, setImie] = useState('');
  const [nazwisko, setNazwisko] = useState('');
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  
  // Stan na wyświetlanie błędów z serwera (np. "zły email")
  const [errorMsg, setErrorMsg] = useState('');

  // Funkcja wysyłająca dane do backendu
  const handleSubmit = async () => {
    setErrorMsg(''); // Czyszczenie starych błędów
    
    const url = isLogin ? 'http://127.0.0.1:8000/logowanie' : 'http://127.0.0.1:8000/rejestracja';
    const payload = isLogin ? { email, haslo } : { imie, nazwisko, email, haslo };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Serwer zwrócił błąd (np. 400 lub 401)
        setErrorMsg(data.detail || 'Wystąpił błąd');
        return;
      }

      // Sukces!
      alert(data.msg); 
      
      if (isLogin) {
        // Po zalogowaniu wpuszczamy użytkownika do aplikacji
        onNavigate('home');
      } else {
        // Po udanej rejestracji przełączamy na ekran logowania
        onNavigate('login');
      }
    } catch (error) {
      setErrorMsg('Błąd połączenia z serwerem');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">FoodFlow</h1>
        <div className="banner-ribbon">{isLogin ? 'ZALOGUJ SIĘ' : 'ZAREJESTRUJ SIĘ'}</div>

        {/* Wyświetlanie błędu nad formularzem */}
        {errorMsg && <div style={{ color: 'red', marginTop: '10px', fontWeight: 'bold' }}>{errorMsg}</div>}

        <div className="form-stack">
          {!isLogin && (
            <input 
              className="soft-input" 
              placeholder="Imię" 
              value={imie} 
              onChange={(e) => setImie(e.target.value)} 
            />
          )}
          {!isLogin && (
            <input 
              className="soft-input" 
              placeholder="Nazwisko" 
              value={nazwisko} 
              onChange={(e) => setNazwisko(e.target.value)} 
            />
          )}
          <input 
            className="soft-input" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            className="soft-input" 
            placeholder="Hasło" 
            type="password" 
            value={haslo} 
            onChange={(e) => setHaslo(e.target.value)} 
          />
        </div>

        {/* Podpięcie funkcji handleSubmit do przycisku */}
        <button className="mint-button wide-button" onClick={handleSubmit}>
          {isLogin ? 'ZALOGUJ SIĘ' : 'ZAREJESTRUJ SIĘ'}
        </button>

        <div className="auth-separator">lub</div>

        <button
          className="secondary-button wide-button"
          onClick={() => {
            setErrorMsg(''); // Czyszczenie błędów przy zmianie ekranu
            onNavigate(isLogin ? 'register' : 'login');
          }}
        >
          {isLogin ? 'NIE MASZ KONTA? ZAREJESTRUJ SIĘ' : 'MASZ JUŻ KONTO? ZALOGUJ SIĘ'}
        </button>
      </div>
    </div>
  );
}