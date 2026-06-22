import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Restauracja {
  id_restauracja: number;
  nazwa: string;
  czynne: boolean;
  opis?: string;
  adres?: string;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [restaurants, setRestaurants] = useState<Restauracja[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/restauracje/')
      .then((response) => response.json())
      .then((data) => setRestaurants(data))
      .catch((error) => console.error('Błąd pobierania danych:', error));
  }, []);

  const filteredRestaurants = restaurants.filter((r) =>
    r.nazwa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    if (sortBy === 'name_asc') return a.nazwa.localeCompare(b.nazwa);
    if (sortBy === 'name_desc') return b.nazwa.localeCompare(a.nazwa);
    return 0;
  });

  const half = Math.ceil(sortedRestaurants.length / 2);
  const leftGroups = sortedRestaurants.length > 0 ? sortedRestaurants.slice(0, half) : [];
  const rightGroups = sortedRestaurants.length > 0 ? sortedRestaurants.slice(half) : [];

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="toolbar-row">
        <div className="filter-box yellow-box">
          <div className="toolbar-group">
            <span className="toolbar-label">Filtry:</span>
            <select className="soft-input toolbar-control">
              <option value="all">Wszystkie</option>
              <option value="open">Tylko otwarte</option>
            </select>
          </div>
        </div>

        <div className="filter-box orange-box">
          <div className="toolbar-group">
            <span className="toolbar-label">Wyszukiwanie:</span>
            <input
              type="text"
              className="soft-input toolbar-control"
              placeholder="Wpisz nazwę..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-box brown-box">
          <div className="toolbar-group">
            <span className="toolbar-label">Sortowanie:</span>
            <select
              className="soft-input toolbar-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">Od A do Z</option>
              <option value="name_desc">Od Z do A</option>
            </select>
          </div>
        </div>
      </div>

      <div className="two-column-layout home-layout">
        <section className="column-panel divider-right">
          {/* WYŚRODKOWANA WSTĄŻKA */}
          <div className="single-ribbon-wrap">
            <div className="section-ribbon blue-ribbon home-ribbon" style={{ margin: 0 }}>POLECANE I NOWOŚCI</div>
          </div>
          
          <div className="restaurant-stack">
            {leftGroups.length > 0 ? (
              <article className="restaurant-card home-restaurant-panel">
                <div className="restaurant-grid">
                  {leftGroups.map((restaurant) => (
                    <button
                      key={restaurant.id_restauracja}
                      className="tile home-restaurant-tile"
                      onClick={() => onNavigate('restaurant')}
                    >
                      <strong>{restaurant.nazwa}</strong>
                      {(restaurant.opis || restaurant.adres) && (
                        <div className="restaurant-meta">
                          {restaurant.opis && <span>{restaurant.opis}</span>}
                          {restaurant.adres && (
                            <span className="meta-address">📍 {restaurant.adres}</span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </article>
            ) : (
              <p style={{ textAlign: 'center', padding: '20px', color: '#5d4537' }}>
                Brak restauracji do wyświetlenia.
              </p>
            )}
          </div>
        </section>

        <section className="column-panel">
          {/* WYŚRODKOWANA WSTĄŻKA - pojawia się tylko, gdy są wyniki */}
          {rightGroups.length > 0 && (
            <>
              <div className="single-ribbon-wrap">
                <div className="section-ribbon green-ribbon home-ribbon" style={{ margin: 0 }}>SPECJALNE PROMOCJE</div>
              </div>
              
              <div className="restaurant-stack">
                <article className="restaurant-card home-restaurant-panel">
                  <div className="restaurant-grid">
                    {rightGroups.map((restaurant) => (
                      <button
                        key={restaurant.id_restauracja}
                        className="tile home-restaurant-tile"
                        onClick={() => onNavigate('restaurant')}
                      >
                        <strong>{restaurant.nazwa}</strong>
                        {(restaurant.opis || restaurant.adres) && (
                          <div className="restaurant-meta">
                            {restaurant.opis && <span>{restaurant.opis}</span>}
                            {restaurant.adres && (
                              <span className="meta-address">📍 {restaurant.adres}</span>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}