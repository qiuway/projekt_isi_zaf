import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PointsShopScreen } from '../components/PointsShopScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  userApi: {
    getPoints: vi.fn().mockResolvedValue({ data: { punkty: 200 } }),
  },
  couponsApi: {
    getAll: vi.fn().mockResolvedValue({
      data: [
        {
          id_kupon: 1,
          nazwa: 'Kupon 15% na pizzę',
          opis: 'Zniżka na dowolną pizzę',
          koszt_punktowy: 50,
          wartosc_znizki: '15%',
          ikona: '🍕',
        },
      ],
    }),
    buyCoupon: vi.fn().mockResolvedValue({ data: { msg: 'Kupiono!', punkty: 150 } }),
  },
}));

describe('PointsShopScreen Component', () => {
  beforeEach(() => {
    localStorage.setItem('userId', '1');
  });

  it('renders user points balance and available coupons', async () => {
    const mockNavigate = vi.fn();
    render(<PointsShopScreen onNavigate={mockNavigate} />);

    expect(screen.getByText('SKLEP ZA PUNKTY')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Kupon 15% na pizzę')).toBeInTheDocument();
      expect(screen.getByText('🍕')).toBeInTheDocument();
      expect(screen.getByText(/50/i)).toBeInTheDocument();
    });
  });

  it('handles buying coupon on button click', async () => {
    const mockNavigate = vi.fn();
    render(<PointsShopScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Kupon 15% na pizzę')).toBeInTheDocument();
    });

    const buyBtn = screen.getByRole('button', { name: /kup za punkty/i });
    fireEvent.click(buyBtn);

    await waitFor(() => {
      expect(localStorage.getItem('punkty')).toBe('150');
    });
  });
});
