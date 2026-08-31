import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileEditScreen } from '../components/ProfileEditScreen';

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
        imie: 'Krzysztof',
        nazwisko: 'Nowak',
        email: 'krzysztof@example.com',
        numer_telefonu: '500600700',
        adres: 'ul. Polna 2',
        zdjecie_profilowe: null,
      },
    }),
    updateProfile: vi.fn().mockResolvedValue({ data: {} }),
  },
  getAvatarUrl: vi.fn(),
}));

describe('ProfileEditScreen Component', () => {
  beforeEach(() => {
    localStorage.setItem('userId', '1');
  });

  it('renders edit profile form with loaded data and handles save', async () => {
    const mockNavigate = vi.fn();
    render(<ProfileEditScreen onNavigate={mockNavigate} />);

    expect(screen.getByText('EDYCJA PROFILU')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Krzysztof')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Nowak')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /zapisz zmiany/i });
    fireEvent.click(saveBtn);
  });
});
