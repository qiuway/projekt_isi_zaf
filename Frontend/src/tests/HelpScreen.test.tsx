import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HelpScreen } from '../components/HelpScreen';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

describe('HelpScreen Component', () => {
  it('renders FAQ questions and contact information', () => {
    const mockNavigate = vi.fn();
    render(<HelpScreen onNavigate={mockNavigate} />);

    expect(screen.getByText('POMOC I FAQ')).toBeInTheDocument();
    expect(screen.getByText(/jak zamówić jedzenie/i)).toBeInTheDocument();
    expect(screen.getByText(/kontakt z pomocą/i)).toBeInTheDocument();
  });
});
