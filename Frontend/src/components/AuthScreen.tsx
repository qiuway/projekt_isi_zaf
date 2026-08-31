import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { authApi } from '../api/apiClient';
import { useNotify } from './NotificationProvider';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onNavigate: (screen: Screen) => void;
}

export function AuthScreen({ mode, onNavigate }: AuthScreenProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const isLogin = mode === 'login';

  const [imie, setImie] = useState('');
  const [nazwisko, setNazwisko] = useState('');
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');
    
    if (!email.trim() && !haslo.trim()) {
      setErrorMsg(t('auth.errors.missing_email_password'));
      return;
    }
    if (!email.trim()) {
      setErrorMsg(t('auth.errors.missing_email'));
      return;
    }
    if (!haslo.trim()) {
      setErrorMsg(t('auth.errors.missing_password'));
      return;
    }
    if (!isLogin && (!imie.trim() || !nazwisko.trim())) {
      setErrorMsg(t('auth.errors.missing_name'));
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg(t('auth.errors.invalid_email'));
      return;
    }

    try {
      let response;
      if (isLogin) {
        response = await authApi.login({ email: email.trim(), haslo });
      } else {
        response = await authApi.register({
          imie: imie.trim(),
          nazwisko: nazwisko.trim(),
          email: email.trim(),
          haslo,
          is_owner: isOwner
        });
      }

      const data = response.data;
      notify(isLogin ? t('auth.login_success') : t('auth.register_success'), 'success');
      
      if (isLogin) {
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
        }
        localStorage.setItem('userId', String(data.user_id || data.id_uzytkownik));
        if (data.id_typ_konta) {
          localStorage.setItem('role', String(data.id_typ_konta));
        }
        if (data.punkty !== undefined) {
          localStorage.setItem('punkty', String(data.punkty));
        }
        onNavigate('home');
      } else {
        onNavigate('login');
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setErrorMsg(`${t('auth.errors.data_error')}: ${detail[0].msg}`);
      } else if (typeof detail === 'string') {
        const lowerDetail = detail.toLowerCase();
        if (lowerDetail.includes('google')) {
          setErrorMsg(t('auth.errors.google_account_use_oauth'));
        } else if (lowerDetail.includes('błędny email') || lowerDetail.includes('bledny email')) {
          setErrorMsg(t('auth.errors.invalid_credentials'));
        } else {
          setErrorMsg(detail);
        }
      } else {
        setErrorMsg(t('auth.errors.server_error'));
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
                window.location.href = authApi.getGoogleLoginUrl();
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