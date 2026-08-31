import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsScreen } from '../components/SettingsScreen';
import i18n from '../i18n';

vi.mock('../components/TopBar', () => ({
  TopBar: () => <div data-testid="topbar">TopBar</div>,
}));

describe('SettingsScreen Component', () => {
  it('renders settings heading and theme toggle', () => {
    const mockNavigate = vi.fn();
    render(<SettingsScreen onNavigate={mockNavigate} />);

    expect(screen.getByText('USTAWIENIA')).toBeInTheDocument();
    expect(screen.getByText(/tryb ciemny/i)).toBeInTheDocument();
  });

  it('toggles dark mode class on body and updates localStorage', () => {
    const mockNavigate = vi.fn();
    render(<SettingsScreen onNavigate={mockNavigate} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('allows changing language to English and Polish', () => {
    const mockNavigate = vi.fn();
    render(<SettingsScreen onNavigate={mockNavigate} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });

    expect(i18n.language).toBe('en');
    expect(screen.getByText('SETTINGS')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'pl' } });
    expect(i18n.language).toBe('pl');
    expect(screen.getByText('USTAWIENIA')).toBeInTheDocument();
  });
});
