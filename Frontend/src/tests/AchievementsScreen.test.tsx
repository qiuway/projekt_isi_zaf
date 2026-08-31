import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AchievementsScreen } from '../components/AchievementsScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  achievementsApi: {
    getUserAchievements: vi.fn().mockResolvedValue({
      data: [
        {
          id_osiagniecia: 1,
          nazwa: 'Pierwsze zamówienie',
          opis: 'Złóż swoje pierwsze zamówienie w serwisie',
          warunek: 'orders_count >= 1',
          punkty: 100,
          ikona: '🥇',
          zdobyte: true,
          odebrane: false,
        },
      ],
    }),
    claimAchievement: vi.fn().mockResolvedValue({ data: { punkty: 100 } }),
  },
}));

describe('AchievementsScreen Component', () => {
  beforeEach(() => {
    localStorage.setItem('userId', '1');
  });

  it('renders achievements list and claims points on click', async () => {
    const mockNavigate = vi.fn();
    render(<AchievementsScreen onNavigate={mockNavigate} />);

    expect(screen.getByText('OSIĄGNIĘCIA')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pierwsze zamówienie')).toBeInTheDocument();
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    const claimBtn = screen.getByRole('button', { name: /odbierz punkty/i });
    fireEvent.click(claimBtn);
  });
});
