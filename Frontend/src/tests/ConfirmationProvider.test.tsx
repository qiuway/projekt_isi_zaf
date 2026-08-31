import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmationProvider } from '../components/ConfirmationProvider';

describe('ConfirmationProvider Component', () => {
  it('renders confirmation message and buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationProvider
        message="Czy na pewno chcesz usunąć to danie?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Czy na pewno chcesz usunąć to danie?')).toBeInTheDocument();
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
    expect(screen.getByText('Tak')).toBeInTheDocument();
  });

  it('calls onConfirm when clicking confirm button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationProvider
        message="Potwierdź akcję"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Tak'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when clicking cancel button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmationProvider
        message="Potwierdź akcję"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('Anuluj'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
