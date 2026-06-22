import { useState } from 'react';
import type { Screen } from '../types';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onNavigate: (screen: Screen) => void;
}

export function AuthScreen({ mode, onNavigate }: AuthScreenProps) {
  const isLogin = mode === 'login';

  const [imie, setImie] = useState('');
  const [nazwisko, setNazwisko] = useState('');
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    
    if (!email || !haslo) {
      setErrorMsg('Email i hasło są wymagane!');
      return;
    }
    if (!isLogin && (!imie || !nazwisko)) {
      setErrorMsg('Wypełnij imię i nazwisko!');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Podaj poprawny adres email!');
      return;
    }

    const url = isLogin ? 'http://127.0.0.1:8000/logowanie' : 'http://127.0.0.1:8000/rejestracja';
    const payload = isLogin 
      ? { email, haslo } 
      : { imie, nazwisko, email, haslo, is_owner: isOwner };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          setErrorMsg(`Błąd wprowadzonych danych: ${data.detail[0].msg}`);
        } else {
          setErrorMsg(data.detail || 'Wystąpił błąd z serwerem');
        }
        return;
      }

      alert(data.msg); 
      
      if (isLogin) {
        localStorage.setItem('userId', data.user_id);
        onNavigate('home');
      } else {
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

        {/* Klasa zamiast stylu inline */}
        {errorMsg && <div className="auth-error-msg">{errorMsg}</div>}

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

          {!isLogin && (
            <label className="auth-role-label">
              <input 
                type="checkbox" 
                className="auth-role-checkbox"
                checked={isOwner} 
                onChange={(e) => setIsOwner(e.target.checked)} 
              />
              <span>Zarejestruj jako właściciel restauracji</span>
            </label>
          )}
        </div>

        <button className="mint-button wide-button auth-submit-btn" onClick={handleSubmit}>
          {isLogin ? 'ZALOGUJ SIĘ' : 'ZAREJESTRUJ SIĘ'}
        </button>

        <div className="auth-separator">lub</div>

        <button
          className="secondary-button wide-button"
          onClick={() => {
            setErrorMsg('');
            setIsOwner(false);
            onNavigate(isLogin ? 'register' : 'login');
          }}
        >
          {isLogin ? 'NIE MASZ KONTA? ZAREJESTRUJ SIĘ' : 'MASZ JUŻ KONTO? ZALOGUJ SIĘ'}
        </button>
      </div>
    </div>
  );
}