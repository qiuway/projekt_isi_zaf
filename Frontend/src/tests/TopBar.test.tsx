import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopBar } from '../components/TopBar';

vi.mock('../api/apiClient', () => ({
  userApi: {
    getPoints: vi.fn().mockResolvedValue({ data: { punkty: 150 } }),
    getProfile: vi.fn().mockResolvedValue({ data: { adres: 'ul. Testowa 10', id_typ_konta: 1 } }),
  },
  cartApi: {
    getCart: vi.fn().mockResolvedValue({ data: { suma: 45.5 } }),
  },
}));

describe('TopBar Component', () => {
  it('renders application brand title and buttons', () => {
    const mockNavigate = vi.fn();
    render(<TopBar onNavigate={mockNavigate} />);

    expect(screen.getByText('FoodFlow')).toBeInTheDocument();
  });

  it('opens dropdown menu on hamburger click and handles navigation', async () => {
    const mockNavigate = vi.fn();
    render(<TopBar onNavigate={mockNavigate} />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    const profileItem = screen.getByText(/profil/i);
    expect(profileItem).toBeInTheDocument();

    fireEvent.click(profileItem);
    expect(mockNavigate).toHaveBeenCalledWith('profile');
  });

  it('navigates to cart when clicking cart button', () => {
    const mockNavigate = vi.fn();
    render(<TopBar onNavigate={mockNavigate} />);

    const cartBtn = screen.getByRole('button', { name: /koszyk/i });
    fireEvent.click(cartBtn);

    expect(mockNavigate).toHaveBeenCalledWith('cart');
  });
});
