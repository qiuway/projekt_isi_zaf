import { rewards } from '../data/mockData';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface PointsShopScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function PointsShopScreen({ onNavigate }: PointsShopScreenProps) {
  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">SKLEP ZA PUNKTY</div>
      </div>

      <section className="help-card">
        <article className="help-item points-balance-box">
          <h3>Twoje punkty</h3>
          <p>Aktualnie dostępne punkty: <strong>9999 pkt</strong></p>
        </article>
      </section>

      <div className="points-shop-grid">
        {rewards.map((reward) => (
          <article className="reward-card" key={reward.id}>
            <div className="reward-icon" aria-hidden="true">{reward.icon}</div>
            <div className="reward-content">
              <div className="achievement-line">
                <span>Nazwa rabatu</span>
                <strong>{reward.name}</strong>
              </div>
              <div className="achievement-line">
                <span>Opis</span>
                <strong>{reward.description}</strong>
              </div>
              <div className="achievement-line two-up">
                <div>
                  <span>Wartość</span>
                  <strong>{reward.discount}</strong>
                </div>
                <div>
                  <span>Cena</span>
                  <strong>{reward.priceInPoints} pkt</strong>
                </div>
              </div>
            </div>
            <button className="mint-button reward-button">Kup za punkty</button>
          </article>
        ))}
      </div>
    </div>
  );
}
