import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationProvider, useNotify } from '../components/NotificationProvider';

function TestTrigger() {
  const notify = useNotify();
  return (
    <button onClick={() => notify('Danie dodane do koszyka!', 'success')}>
      Powiadom
    </button>
  );
}

describe('NotificationProvider Component', () => {
  it('displays notification toast when notify is called', () => {
    render(
      <NotificationProvider>
        <TestTrigger />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Powiadom'));
    expect(screen.getByText('Danie dodane do koszyka!')).toBeInTheDocument();
  });

  it('closes notification when clicking close button', () => {
    render(
      <NotificationProvider>
        <TestTrigger />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByText('Powiadom'));
    const toast = screen.getByText('Danie dodane do koszyka!');
    expect(toast).toBeInTheDocument();

    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Danie dodane do koszyka!')).not.toBeInTheDocument();
  });
});
