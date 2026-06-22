import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface PaymentScreenProps {
  onNavigate: (screen: Screen) => void;
}

const paymentMethods = ['BLIK', 'Karta płatnicza', 'Google Pay', 'Płatność przy odbiorze'];

export function PaymentScreen({ onNavigate }: PaymentScreenProps) {
  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">WYBÓR PŁATNOŚCI</div>
      </div>

      <section className="payment-card">
        <div className="payment-column">
          <h3>Dostępne metody płatności</h3>
          <div className="payment-list">
            {paymentMethods.map((method) => (
              <button className="payment-option" key={method}>
                <span className="payment-radio" />
                <span>{method}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="payment-column payment-summary-box">
          <h3>Podsumowanie</h3>
          <div className="summary-row"><span>Kwota zamówienia</span><strong>101,95 zł</strong></div>
          <div className="summary-row"><span>Adres dostawy</span><strong>&lt;adres użytkownika&gt;</strong></div>
          <div className="summary-row"><span>Wybrany rabat</span><strong>Rabat 10%</strong></div>
          <div className="payment-actions">
            <button className="secondary-button" onClick={() => onNavigate('cart')}>
              Wróć do koszyka
            </button>
            <button className="mint-button" onClick={() => onNavigate('profile')}>
              Potwierdź płatność
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
