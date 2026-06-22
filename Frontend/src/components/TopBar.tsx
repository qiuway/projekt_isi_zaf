import { useEffect, useRef, useState } from 'react';
import type { Screen } from '../types';

interface TopBarProps {
  title?: string;
  onNavigate: (screen: Screen) => void;
}

const menuItems: { label: string; screen: Screen }[] = [
  { label: 'Strona główna', screen: 'home' },
  { label: 'Profil', screen: 'profile' },
  { label: 'Ustawienia', screen: 'settings' },
  { label: 'Osiągnięcia', screen: 'achievements' },
  { label: 'Pomoc', screen: 'help' },
];

export function TopBar({ title = 'FoodFlow', onNavigate }: TopBarProps) {
  const [isOpen, setIsOpen] = useState(false);
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

      <div className="pill small-pill">Punkty: 9999</div>
      <button className="secondary-button points-shop-button" onClick={() => onNavigate('pointsShop')}>
        Sklep za punkty
      </button>
      
      <div className="brand-title">{title}</div>
      
      <button className="mint-button" onClick={() => onNavigate('cart')}>
        Do Koszyka!
      </button>
      <div className="pill address-pill">Adres Dostawy: [adres]</div>
    </header>
  );
}
