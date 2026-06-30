import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { apiClient } from '../api/apiClient';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onNavigate: (screen: Screen) => void;
}

export function AuthScreen({ mode, onNavigate }: AuthScreenProps) {
  const { t } = useTranslation();
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
      setErrorMsg(t('auth.errors.missing_email_password'));
      return;
    }
    if (!isLogin && (!imie || !nazwisko)) {
      setErrorMsg(t('auth.errors.missing_name'));
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg(t('auth.errors.invalid_email'));
      return;
    }

    const endpoint = isLogin ? '/logowanie' : '/rejestracja';
    const payload = isLogin 
      ? { email, haslo } 
      : { imie, nazwisko, email, haslo, is_owner: isOwner };

    try {
      const response = await apiClient.post(endpoint, payload);
      const data = response.data;

      alert(data.msg);
      
      if (isLogin) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userId', data.user_id); 
        onNavigate('home');
      } else {
        onNavigate('login');
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setErrorMsg(`Błąd wprowadzonych danych: ${detail[0].msg}`);
      } else {
        setErrorMsg(detail || 'Błąd połączenia z serwerem');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">FoodFlow</h1>
        <div className="banner-ribbon">
          {isLogin ? t('auth.login_mode') : t('auth.register_mode')}
        </div>

        {errorMsg && <div className="auth-error-msg">{errorMsg}</div>}

        <div className="form-stack">
          {!isLogin && (
            <input 
              className="soft-input" 
              placeholder={t('auth.name_placeholder')} 
              value={imie} 
              onChange={(e) => setImie(e.target.value)} 
            />
          )}
          {!isLogin && (
            <input 
              className="soft-input" 
              placeholder={t('auth.surname_placeholder')} 
              value={nazwisko} 
              onChange={(e) => setNazwisko(e.target.value)} 
            />
          )}
          <input 
            className="soft-input" 
            placeholder={t('auth.email_placeholder')} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            className="soft-input" 
            placeholder={t('auth.password_placeholder')} 
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
              <span>{t('auth.owner_checkbox')}</span>
            </label>
          )}
        </div>

        <button className="mint-button wide-button auth-submit-btn" onClick={handleSubmit}>
          {isLogin ? t('auth.login_mode') : t('auth.register_mode')}
        </button>

        {isLogin && (
          <button
            className="secondary-button wide-button"
            style={{ marginTop: '12px' }}
            onClick={() => {
                window.location.href = 'http://127.0.0.1:8000/auth/google/login';
            }}
          >
            {t('auth.google_login')}
          </button>
        )}

        <div className="auth-separator">{t('auth.or')}</div>

        <button
          className="secondary-button wide-button"
          onClick={() => {
            setErrorMsg('');
            setIsOwner(false);
            onNavigate(isLogin ? 'register' : 'login');
          }}
        >
          {isLogin ? t('auth.switch_to_register') : t('auth.switch_to_login')}
        </button>
      </div>
    </div>
  );
}