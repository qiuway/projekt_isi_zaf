import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartScreen } from '../components/CartScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  cartApi: {
    getCart: vi.fn().mockResolvedValue({
      data: {
        pozycje: [
          {
            id_pozycja: 1,
            id_produkt: 10,
            nazwa: 'Pizza Margherita',
            cena: 32.0,
            ilosc: 2,
            restauracja_nazwa: 'Pizzeria Napoli',
          },
        ],
        suma: 64.0,
      },
    }),
    updateQuantity: vi.fn().mockResolvedValue({ data: {} }),
    removeItem: vi.fn().mockResolvedValue({ data: {} }),
  },
  couponsApi: {
    getUserCoupons: vi.fn().mockResolvedValue({ data: [] }),
  },
  userApi: {
    getProfile: vi.fn().mockResolvedValue({ data: { adres: 'ul. Słoneczna 5' } }),
    updateProfile: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('CartScreen Component', () => {
  beforeEach(() => {
    localStorage.setItem('userId', '1');
  });

  it('renders cart title and tabs', async () => {
    const mockNavigate = vi.fn();
    render(<CartScreen onNavigate={mockNavigate} />);

    expect(screen.getByText(/twój koszyk/i)).toBeInTheDocument();
    expect(screen.getByText(/mój koszyk/i)).toBeInTheDocument();
    expect(screen.getByText(/koszyk grupowy/i)).toBeInTheDocument();
  });

  it('displays products loaded from user cart', async () => {
    const mockNavigate = vi.fn();
    render(<CartScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.getByText('Pizzeria Napoli')).toBeInTheDocument();
    });
  });

  it('allows switching to group cart tab', async () => {
    const mockNavigate = vi.fn();
    render(<CartScreen onNavigate={mockNavigate} />);

    const groupTabBtn = screen.getByText(/koszyk grupowy/i);
    fireEvent.click(groupTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/stwórz koszyk grupowy/i)).toBeInTheDocument();
      expect(screen.getByText(/dołącz z kodem zaproszenia/i)).toBeInTheDocument();
    });
  });
});
