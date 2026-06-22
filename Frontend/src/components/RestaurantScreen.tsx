import { restaurants } from '../data/mockData';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface RestaurantScreenProps {
  onNavigate: (screen: Screen) => void;
}

const categories = ['Wszystkie', 'Zupy', 'Dania główne', 'Pizza', 'Napoje', 'Desery'];

export function RestaurantScreen({ onNavigate }: RestaurantScreenProps) {
  const restaurant = restaurants[0];

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">{restaurant.name.toUpperCase()}</div>
      </div>

      <section className="info-card large-info-card">
        <div className="image-placeholder wide-image">&lt;zdj. logo restauracji&gt;</div>
        <div className="restaurant-description">
          <p>{restaurant.tagline}</p>
          <p>Czas dostawy: &lt;{restaurant.deliveryTime}&gt;</p>
          <p>Minimalne zamówienie: &lt;{restaurant.minimumOrder}&gt;</p>
          <p>Ocena: &lt;{restaurant.rating}&gt;</p>
        </div>
      </section>

      <div className="category-row">
        {categories.map((category) => (
          <button className="category-pill" key={category}>
            {category}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {restaurant.dishes.map((dish) => (
          <article className="dish-card" key={dish.id}>
            <div className="dish-thumb">&lt;zdj. potrawa&gt;</div>
            <div className="dish-copy">
              <strong>{dish.name}</strong>
              <span>{dish.description}</span>
              <span>{dish.price}</span>
            </div>
            <div className="dish-actions">
              <button className="mini-action" onClick={() => onNavigate('restaurant')}>
                Zobacz
              </button>
              <button className="mint-button add-cart-button" type="button">
                Dodaj do koszyka
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
