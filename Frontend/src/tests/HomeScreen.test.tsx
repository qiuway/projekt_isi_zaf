import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HomeScreen } from '../components/HomeScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../api/apiClient', () => ({
  restaurantsApi: {
    getAll: vi.fn().mockResolvedValue({
      data: [
        {
          id_restauracja: 1,
          nazwa: 'Pizzeria Napoli',
          czynne: true,
          opis: 'Najlepsza włoska pizza w piecu opalanym drewnem',
          adres: 'ul. Włoska 12',
        },
        {
          id_restauracja: 2,
          nazwa: 'Burger House',
          czynne: false,
          opis: 'Soczyste burgery wołowe',
          adres: 'ul. Główna 5',
        },
      ],
    }),
  },
}));

describe('HomeScreen Component', () => {
  it('renders toolbar with filters, search, and sorting', async () => {
    const mockNavigate = vi.fn();
    render(<HomeScreen onNavigate={mockNavigate} />);

    expect(screen.getByPlaceholderText(/wpisz nazwę/i)).toBeInTheDocument();
    expect(screen.getByText('DOSTĘPNE RESTAURACJE')).toBeInTheDocument();
  });

  it('displays fetched restaurants and handles card clicks', async () => {
    const mockNavigate = vi.fn();
    render(<HomeScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pizzeria Napoli')).toBeInTheDocument();
      expect(screen.getByText('Burger House')).toBeInTheDocument();
    });

    const restaurantCard = screen.getByText('Pizzeria Napoli');
    fireEvent.click(restaurantCard);

    expect(mockNavigate).toHaveBeenCalledWith('restaurant');
    expect(localStorage.getItem('currentRestId')).toBe('1');
  });

  it('filters restaurants by status', async () => {
    const mockNavigate = vi.fn();
    render(<HomeScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pizzeria Napoli')).toBeInTheDocument();
      expect(screen.getByText('Burger House')).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'open' } });

    expect(screen.getByText('Pizzeria Napoli')).toBeInTheDocument();
    expect(screen.queryByText('Burger House')).not.toBeInTheDocument();
  });

  it('filters restaurants by search query', async () => {
    const mockNavigate = vi.fn();
    render(<HomeScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pizzeria Napoli')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/wpisz nazwę/i);
    fireEvent.change(searchInput, { target: { value: 'burger' } });

    expect(screen.queryByText('Pizzeria Napoli')).not.toBeInTheDocument();
    expect(screen.getByText('Burger House')).toBeInTheDocument();
  });
});
