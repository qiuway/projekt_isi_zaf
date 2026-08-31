import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthScreen } from '../components/AuthScreen';

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getGoogleLoginUrl: vi.fn().mockReturnValue('http://localhost:8000/auth/google'),
  },
}));

describe('AuthScreen Component', () => {
  it('renders login form by default', () => {
    const mockNavigate = vi.fn();
    render(<AuthScreen mode="login" onNavigate={mockNavigate} />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/hasło/i)).toBeInTheDocument();
    expect(screen.getByText(/zaloguj przez google/i)).toBeInTheDocument();
  });

  it('validates empty inputs on login submit', async () => {
    const mockNavigate = vi.fn();
    render(<AuthScreen mode="login" onNavigate={mockNavigate} />);

    const submitBtn = screen.getByRole('button', { name: 'ZALOGUJ SIĘ' });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/email i hasło są wymagane/i)).toBeInTheDocument();
  });

  it('renders registration form with extra fields when in register mode', () => {
    const mockNavigate = vi.fn();
    render(<AuthScreen mode="register" onNavigate={mockNavigate} />);

    expect(screen.getByPlaceholderText(/imię/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nazwisko/i)).toBeInTheDocument();
    expect(screen.getByText(/właściciel restauracji/i)).toBeInTheDocument();
  });

  it('switches between login and register modes', () => {
    const mockNavigate = vi.fn();
    render(<AuthScreen mode="login" onNavigate={mockNavigate} />);

    const switchBtn = screen.getByText(/nie masz konta/i);
    fireEvent.click(switchBtn);

    expect(mockNavigate).toHaveBeenCalledWith('register');
  });
});
