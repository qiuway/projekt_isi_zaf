import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GroupSettlementModal } from '../components/GroupSettlementModal';

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  ordersApi: {
    getOrderSettlement: vi.fn().mockResolvedValue({
      data: {
        id_zamowienia: 200,
        kod_zaproszenia: 'FF-ABC12',
        kwota_calkowita: 120.0,
        status_zamowienia: 'W_REALIZACJI',
        status_platnosci: 'OPŁACONE',
        host: {
          id_uzytkownik: 1,
          imie: 'Jan',
          nazwisko: 'Gospodarz',
          email: 'jan@host.pl',
          zdjecie_profilowe: null,
        },
        twoja_kwota: 40.0,
        twoje_czy_oplacone: true,
        jestes_hostem: true,
        osoby_placace: [
          {
            id_uzytkownik: 2,
            imie: 'Piotr',
            nazwisko: 'Uczestnik',
            zdjecie_profilowe: null,
            numer_telefonu: 123456789,
            kwota: 40.0,
            czy_oplacone: false,
            jest_hostem: false,
          },
        ],
      },
    }),
    toggleSettlementPaid: vi.fn().mockResolvedValue({ data: { msg: 'Status zmieniony' } }),
  },
  getAvatarUrl: vi.fn(),
}));

describe('GroupSettlementModal Component', () => {
  it('renders split settlement details and participant list', async () => {
    const onClose = vi.fn();
    render(<GroupSettlementModal orderId={200} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText(/rozliczenie składki/i)).toBeInTheDocument();
      expect(screen.getByText('FF-ABC12')).toBeInTheDocument();
      expect(screen.getByText('jan@host.pl')).toBeInTheDocument();
      expect(screen.getByText(/piotr/i)).toBeInTheDocument();
    });

    const togglePaidBtn = screen.getByRole('button', { name: /oznacz jako opłacone/i });
    fireEvent.click(togglePaidBtn);
  });
});
