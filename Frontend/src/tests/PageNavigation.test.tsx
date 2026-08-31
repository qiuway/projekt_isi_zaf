import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageNavigation } from '../components/PageNavigation';

describe('PageNavigation Component', () => {
  it('renders all navigation chips', () => {
    const mockNavigate = vi.fn();
    render(<PageNavigation current="home" onNavigate={mockNavigate} />);

    expect(screen.getByText('Strona główna')).toBeInTheDocument();
    expect(screen.getByText('Koszyk')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Ustawienia')).toBeInTheDocument();
  });

  it('navigates when clicking a navigation chip', () => {
    const mockNavigate = vi.fn();
    render(<PageNavigation current="home" onNavigate={mockNavigate} />);

    fireEvent.click(screen.getByText('Koszyk'));
    expect(mockNavigate).toHaveBeenCalledWith('cart');
  });
});
