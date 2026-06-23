import type { Achievement} from '../types';

export const achievements: Achievement[] = [
  {
    id: 1,
    name: 'Pierwsze zamówienie',
    description: 'Użytkownik złożył swoje pierwsze zamówienie w aplikacji FoodFlow.',
    earnedAt: '12.03.2026',
    points: 100,
    icon: '🏅',
  },
  {
    id: 2,
    name: 'Łowca promocji',
    description: 'Skorzystano z oferty promocyjnej lub kodu rabatowego podczas zakupów.',
    earnedAt: '18.03.2026',
    points: 150,
    icon: '🎁',
  },
  {
    id: 3,
    name: 'Smakosz tygodnia',
    description: 'Użytkownik zamówił jedzenie przez 7 dni z rzędu.',
    earnedAt: '25.03.2026',
    points: 300,
    icon: '🍜',
  },
  {
    id: 4,
    name: 'Stały klient',
    description: 'W aplikacji złożono co najmniej 10 zamówień.',
    earnedAt: '01.04.2026',
    points: 500,
    icon: '⭐',
  },
];