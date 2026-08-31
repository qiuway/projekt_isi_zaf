import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderHistoryScreen } from '../components/OrderHistoryScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../api/apiClient', () => ({
  ordersApi: {
    getUserOrders: vi.fn().mockResolvedValue({
      data: [
        {
          id_zamowienia: 101,
          restauracja_nazwa: 'Pizzeria Napoli',
          data_zamowienia: '2026-08-26T18:30:00',
          status_zamowienia: 'W_REALIZACJI',
          status_platnosci: 'OPŁACONE',
          kwota: 85.0,
          czy_skladka: true,
          pozycje: [
            { ilosc: 2, nazwa: 'Pizza Margherita', cena: 35.0 },
            { ilosc: 1, nazwa: 'Coca-Cola', cena: 15.0 },
          ],
        },
      ],
    }),
  },
}));

describe('OrderHistoryScreen Component', () => {
  beforeEach(() => {
    localStorage.setItem('userId', '1');
  });

  it('renders order history title and loaded orders', async () => {
    const mockNavigate = vi.fn();
    render(<OrderHistoryScreen onNavigate={mockNavigate} />);

    expect(screen.getByText('HISTORIA ZAMÓWIEŃ')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pizzeria Napoli')).toBeInTheDocument();
      expect(screen.getByText(/#101/)).toBeInTheDocument();
      expect(screen.getByText(/85.00 zł/)).toBeInTheDocument();
    });
  });

  it('expands order details on toggle click', async () => {
    const mockNavigate = vi.fn();
    render(<OrderHistoryScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pizzeria Napoli')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole('button', { name: /szczegóły/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.getByText('Coca-Cola')).toBeInTheDocument();
    });
  });
});
