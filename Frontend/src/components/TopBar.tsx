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
        const fetchPunkty = () => {
            const userId = localStorage.getItem('userId');

            if (!userId) {
                setPunkty('0');
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
        };

        fetchPunkty();

        window.addEventListener('punktyChanged', fetchPunkty);

        return () => {
            window.removeEventListener('punktyChanged', fetchPunkty);
        };
    }, []);

  const handleNavigate = (screen: Screen) => {
    setIsOpen(false);
    onNavigate(screen);
  };

  return (
    <header className="topbar">
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
        <button
            className="secondary-button points-shop-button"
            onClick={() => onNavigate('home')}>
            Strona główna
        </button>
      
      <div className="brand-title">{title}</div>
      
      <button className="mint-button" onClick={() => onNavigate('cart')}>
        Do Koszyka!
      </button>
      <div className="pill address-pill">Adres Dostawy: [adres]</div>
    </header>
  );
}
