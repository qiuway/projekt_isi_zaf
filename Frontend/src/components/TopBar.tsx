import { useEffect, useRef, useState } from 'react';
import type { Screen } from '../types';

interface TopBarProps {
  title?: string;
  onNavigate: (screen: Screen) => void;
}

const menuItems: { label: string; screen: Screen }[] = [
    { label: 'Profil', screen: 'profile' },
    { label: 'Ustawienia', screen: 'settings' },
    { label: 'Sklep za punkty', screen: 'pointsShop' },
    { label: 'Osiągnięcia', screen: 'achievements' },
    { label: 'Pomoc', screen: 'help' },
];

export function TopBar({ title = 'FoodFlow', onNavigate }: TopBarProps) {
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

            fetch(`http://127.0.0.1:8000/uzytkownik/${userId}/punkty`)
                .then((res) => res.json())
                .then((data) => {
                    const aktualnePunkty = String(data.punkty ?? 0);
                    setPunkty(aktualnePunkty);
                    localStorage.setItem('punkty', aktualnePunkty);
                })
                .catch((err) => console.error(err));

            fetch(`http://127.0.0.1:8000/koszyk/${userId}`)
                .then((res) => res.json())
                .then((data) => {
                    setKoszykSuma(data.suma || 0);
                })
                .catch((err) => console.error(err));

            fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`)
                .then((res) => res.json())
                .then((data) => {
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
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pill small-pill">Punkty: {punkty}</div>
          
          <button className="secondary-button points-shop-button" onClick={() => onNavigate('home')}>
              Strona główna
          </button>
      </div>
      
      <div className="topbar-center">
        <div className="brand-title">{title}</div>
      </div>
      
      <div className="topbar-right">
          <div className="pill price-pill">
            Wartość koszyka: {koszykSuma.toFixed(2)} zł
          </div>

          <button className="mint-button" onClick={() => onNavigate('cart')}>
            Do Koszyka!
          </button>

          <div 
            className={`pill address-pill ${!adres ? 'clickable' : ''}`} 
            onClick={() => {
                if (!adres) onNavigate('profileEdit');
            }}
          >
            {adres ? `Adres Dostawy: ${adres}` : 'Dodaj adres dostawy'}
          </div>
      </div>
      
    </header>
  );
}