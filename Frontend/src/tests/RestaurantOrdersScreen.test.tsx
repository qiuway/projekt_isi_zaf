import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RestaurantOrdersScreen } from '../components/RestaurantOrdersScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  ordersApi: {
    getRestaurantOrders: vi.fn().mockResolvedValue({
      data: [
        {
          id_zamowienia: 55,
          klient: 'Adam Kowalski',
          adres_dostawy: 'ul. Warszawska 1',
          data_zamowienia: '2026-08-26T19:00:00',
          kwota: 60.0,
          status_zamowienia: 'ZŁOŻONE',
          status_platnosci: 'OPŁACONE',
          pozycje: [{ nazwa: 'Burger Wołowy', ilosc: 2, cena: 30.0 }],
        },
      ],
    }),
    acceptOrder: vi.fn().mockResolvedValue({ data: {} }),
    rejectOrder: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('RestaurantOrdersScreen Component', () => {
  it('renders restaurant orders and customer delivery info', async () => {
    const mockNavigate = vi.fn();
    render(<RestaurantOrdersScreen onNavigate={mockNavigate} restId={1} restName="Burger King" />);

    await waitFor(() => {
      expect(screen.getByText('Adam Kowalski')).toBeInTheDocument();
      expect(screen.getByText(/warszawska 1/i)).toBeInTheDocument();
      expect(screen.getByText('Burger Wołowy')).toBeInTheDocument();
      expect(screen.getAllByText(/60\.00/)[0]).toBeInTheDocument();
    });
  });

  it('triggers accept order modal on button click', async () => {
    const mockNavigate = vi.fn();
    render(<RestaurantOrdersScreen onNavigate={mockNavigate} restId={1} restName="Burger King" />);

    await waitFor(() => {
      expect(screen.getByText('Adam Kowalski')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole('button', { name: /przyjmij zamówienie/i });
    fireEvent.click(acceptBtn);

    expect(screen.getByText(/czy na pewno chcesz przyjąć to zamówienie/i)).toBeInTheDocument();
  });
});
