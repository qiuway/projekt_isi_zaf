import { useState } from 'react';
import { cartItems, rewards } from '../data/mockData';
import type { Reward, Screen } from '../types';
import { TopBar } from './TopBar';

interface CartScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function CartScreen({ onNavigate }: CartScreenProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(rewards[0]);

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap beige-strip">
        <div className="section-ribbon blue-ribbon large-ribbon">TWÓJ KOSZYK</div>
      </div>

      <div className="cart-layout">
        <section className="cart-products">
          <div className="section-ribbon blue-ribbon small-ribbon">TWOJE PRODUKTY</div>
          <div className="list-stack">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-thumb">&lt;zdj. potrawa {item.id}&gt;</div>
                <div className="cart-copy">
                  <strong>{item.name}</strong>
                  <span>Cena jednostkowa: {item.price}</span>
                  <span>Ilość: {item.qty} (+/-) • cena całkowita {item.total}</span>
                </div>
                <button className="trash-button">🗑</button>
              </article>
            ))}
          </div>
        </section>

        <section className="cart-summary-wrap">
          <div className="section-ribbon green-ribbon small-ribbon">PODSUMOWANIE ZAMÓWIENIA</div>
          <div className="summary-card">
            <div className="summary-row"><span>Suma częściowa</span><strong>93,96 zł</strong></div>
            <div className="summary-row"><span>Koszt dostawy</span><strong>7,99 zł</strong></div>
            <div className="summary-row discount-action-row">
              <span>Wybrany rabat</span>
              <strong>{selectedReward ? selectedReward.name : 'Brak wybranego rabatu'}</strong>
            </div>
            <button className="secondary-button discount-select-button" onClick={() => setIsPopupOpen(true)}>
              Wybierz rabat
            </button>
            <div className="summary-row total-row"><span>Suma do zapłaty</span><strong>101,95 zł</strong></div>
          </div>
          <button className="mint-button order-button" onClick={() => onNavigate('payment')}>
            ZŁÓŻ ZAMÓWIENIE
          </button>
        </section>
      </div>

      {isPopupOpen && (
        <div className="modal-overlay" onClick={() => setIsPopupOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-ribbon blue-ribbon small-ribbon modal-ribbon">WYBIERZ RABAT</div>
            <div className="reward-choice-list">
              {rewards.map((reward) => {
                const isActive = selectedReward?.id === reward.id;
                return (
                  <button
                    key={reward.id}
                    className={`reward-choice ${isActive ? 'reward-choice-active' : ''}`}
                    onClick={() => setSelectedReward(reward)}
                  >
                    <div className="reward-choice-icon">{reward.icon}</div>
                    <div className="reward-choice-copy">
                      <strong>{reward.name}</strong>
                      <span>{reward.description}</span>
                      <span>{reward.discount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="modal-note">Na jedno zamówienie możesz użyć tylko jednego rabatu.</p>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setIsPopupOpen(false)}>
                Zamknij
              </button>
              <button className="mint-button" onClick={() => setIsPopupOpen(false)}>
                Użyj wybranego rabatu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
