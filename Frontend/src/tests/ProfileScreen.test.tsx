import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileScreen } from '../components/ProfileScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  userApi: {
    getProfile: vi.fn().mockResolvedValue({
      data: {
        id_uzytkownik: 1,
        imie: 'Jan',
        nazwisko: 'Kowalski',
        email: 'jan.kowalski@example.com',
        numer_telefonu: '123456789',
        adres: 'ul. Główna 10',
        id_typ_konta: 1,
        zdjecie_profilowe: null,
      },
    }),
  },
  restaurantsApi: {
    getManaged: vi.fn().mockResolvedValue({ data: [] }),
  },
  productsApi: {
    getCategories: vi.fn().mockResolvedValue({ data: [] }),
  },
  getAvatarUrl: vi.fn(),
}));

describe('ProfileScreen Component', () => {
  beforeEach(() => {
    localStorage.setItem('userId', '1');
  });

  it('renders user profile details and logout button', async () => {
    const mockNavigate = vi.fn();
    render(<ProfileScreen onNavigate={mockNavigate} />);

    expect(screen.getByText('MÓJ PROFIL')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      expect(screen.getByText('jan.kowalski@example.com')).toBeInTheDocument();
      expect(screen.getByText('ul. Główna 10')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /edytuj profil/i });
    fireEvent.click(editBtn);

    expect(mockNavigate).toHaveBeenCalledWith('profileEdit');
  });
});
