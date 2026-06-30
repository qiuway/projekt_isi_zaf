import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { apiClient } from '../api/apiClient';

interface TopBarProps {
  title?: string;
  onNavigate: (screen: Screen) => void;
}

const menuItems: { labelKey: string; screen: Screen }[] = [
  { labelKey: 'topbar.menu.profile', screen: 'profile' },
  { labelKey: 'topbar.menu.settings', screen: 'settings' },
  { labelKey: 'topbar.menu.pointsShop', screen: 'pointsShop' },
  { labelKey: 'topbar.menu.achievements', screen: 'achievements' },
  { labelKey: 'topbar.menu.help', screen: 'help' },
];

export function TopBar({ title = 'FoodFlow', onNavigate }: TopBarProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [punkty, setPunkty] = useState(localStorage.getItem('punkty') || '0');
  const [koszykSuma, setKoszykSuma] = useState<number>(0);
  const [adres, setAdres] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchTopBarData = () => {
      const userId = localStorage.getItem('userId');

      if (!userId) {
        setPunkty('0');
        setKoszykSuma(0);
        setAdres(null);
        return;
      }

        apiClient.get(`/uzytkownik/${userId}/punkty`)
            .then((response) => {
                const data = response.data;
          const aktualnePunkty = String(data.punkty ?? 0);
          setPunkty(aktualnePunkty);
          localStorage.setItem('punkty', aktualnePunkty);
        })
        .catch((err) => console.error(err));

        apiClient.get(`/koszyk/${userId}`)
            .then((response) => {
                const data = response.data;
          setKoszykSuma(data.suma || 0);
        })
        .catch((err) => console.error(err));

        apiClient.get(`/uzytkownik/${userId}`)
            .then((response) => {
                const data = response.data;
          setAdres(data.adres || null);
        })
        .catch((err) => console.error(err));
    };

    fetchTopBarData();

    window.addEventListener('punktyChanged', fetchTopBarData);
    window.addEventListener('koszykChanged', fetchTopBarData);

    return () => {
      window.removeEventListener('punktyChanged', fetchTopBarData);
      window.removeEventListener('koszykChanged', fetchTopBarData);
    };
  }, []);

  const handleNavigate = (screen: Screen) => {
    setIsOpen(false);
    onNavigate(screen);
  };

  return (
    <header className="topbar">
      
      <div className="topbar-left">
          <div className="menu-anchor" ref={menuRef}>
            <button className="icon-button" aria-label="Menu" onClick={() => setIsOpen((value) => !value)}>
              <span />
              <span />
              <span />
            </button>

            {isOpen && (
              <div className="dropdown-menu">
                {menuItems.map((item) => (
                  <button key={item.screen} className="dropdown-item" onClick={() => handleNavigate(item.screen)}>
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pill small-pill">
            {t('topbar.points', { points: punkty })}
          </div>
          
          <button className="secondary-button points-shop-button" onClick={() => onNavigate('home')}>
              {t('topbar.home_button')}
          </button>
      </div>
      
      <div className="topbar-center">
        <div className="brand-title">{title}</div>
      </div>
      
      <div className="topbar-right">
          <div className="pill price-pill">
            {t('topbar.cart_value', { value: koszykSuma.toFixed(2) })}
          </div>

          <button className="mint-button" onClick={() => onNavigate('cart')}>
            {t('topbar.to_cart_button')}
          </button>

          <div 
            className={`pill address-pill ${!adres ? 'clickable' : ''}`} 
            onClick={() => {
                if (!adres) onNavigate('profileEdit');
            }}
          >
            {adres ? t('topbar.delivery_address', { address: adres }) : t('topbar.add_address')}
          </div>
      </div>
      
    </header>
  );
}