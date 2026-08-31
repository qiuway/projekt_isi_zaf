import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RestaurantScreen } from '../components/RestaurantScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

vi.mock('../components/NotificationProvider', () => ({
  useNotify: () => vi.fn(),
}));

vi.mock('../api/apiClient', () => ({
  restaurantsApi: {
    getById: vi.fn().mockResolvedValue({
      data: {
        id_restauracja: 1,
        nazwa: 'Pizzeria Bella',
        opis: 'Autentyczna kuchnia włoska',
        adres: 'ul. Krakowska 15',
        numer_telefonu: 123456789,
        czynne: true,
      },
    }),
  },
  productsApi: {
    getByRestaurant: vi.fn().mockResolvedValue({
      data: [
        {
          id_produkt: 10,
          nazwa: 'Pizza Quattro Formaggi',
          cena: 38.0,
          dostepny: true,
          kategoria: { nazwa: 'Pizza' },
        },
      ],
    }),
  },
  reviewsApi: {
    getRestaurantReviews: vi.fn().mockResolvedValue({
      data: {
        id_restauracja: 1,
        srednia_ocen: 4.8,
        liczba_opinii: 12,
        opinie: [
          {
            id_opinia: 1,
            id_uzytkownik: 2,
            id_restauracja: 1,
            ocena: 5,
            komentarz: 'Pyszne ciasto!',
            autor_nazwa: 'Jan K.',
            autor_awatar: null,
          },
        ],
      },
    }),
    addReview: vi.fn().mockResolvedValue({ data: {} }),
  },
  cartApi: {
    addItem: vi.fn().mockResolvedValue({ data: {} }),
  },
  getAvatarUrl: vi.fn(),
}));

describe('RestaurantScreen Component', () => {
  beforeEach(() => {
    localStorage.setItem('currentRestId', '1');
    localStorage.setItem('userId', '1');
  });

  it('renders restaurant details, dishes, and customer reviews', async () => {
    const mockNavigate = vi.fn();
    render(<RestaurantScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('PIZZERIA BELLA')).toBeInTheDocument();
      expect(screen.getByText(/autentyczna kuchnia włoska/i)).toBeInTheDocument();
      expect(screen.getByText('Pizza Quattro Formaggi')).toBeInTheDocument();
      expect(screen.getByText(/38/)).toBeInTheDocument();
      expect(screen.getByText('Pyszne ciasto!')).toBeInTheDocument();
    });
  });

  it('adds dish to cart on click', async () => {
    const mockNavigate = vi.fn();
    render(<RestaurantScreen onNavigate={mockNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pizza Quattro Formaggi')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /\+ dodaj/i });
    fireEvent.click(addBtn);
  });
});
