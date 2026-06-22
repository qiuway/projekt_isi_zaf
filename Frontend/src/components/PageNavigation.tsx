import type { Screen } from '../types';

interface PageNavigationProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const screens: { key: Screen; label: string }[] = [
  { key: 'login', label: 'Logowanie' },
  { key: 'register', label: 'Rejestracja' },
  { key: 'home', label: 'Strona główna' },
  { key: 'restaurant', label: 'Restauracja' },
  { key: 'cart', label: 'Koszyk' },
  { key: 'profile', label: 'Profil' },
  { key: 'settings', label: 'Ustawienia' },
];

export function PageNavigation({ current, onNavigate }: PageNavigationProps) {
  return (
    <nav className="floating-nav">
      {screens.map((screen) => (
        <button
          key={screen.key}
          className={screen.key === current ? 'nav-chip active-chip' : 'nav-chip'}
          onClick={() => onNavigate(screen.key)}
        >
          {screen.label}
        </button>
      ))}
    </nav>
  );
}
