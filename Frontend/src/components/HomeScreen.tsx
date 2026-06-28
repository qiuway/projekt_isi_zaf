import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restauracja[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/restauracje/')
      .then((response) => response.json())
      .then((data) => setRestaurants(data))
      .catch((error) => console.error(t('home.errors.fetch_error'), error));
  }, [t]);

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
            <span className="toolbar-label">{t('home.toolbar.filters')}</span>
            <select className="soft-input toolbar-control">
              <option value="all">{t('home.toolbar.filter_all')}</option>
              <option value="open">{t('home.toolbar.filter_open')}</option>
            </select>
          </div>
        </div>

        <div className="filter-box orange-box">
          <div className="toolbar-group">
            <span className="toolbar-label">{t('home.toolbar.search')}</span>
            <input
              type="text"
              className="soft-input toolbar-control"
              placeholder={t('home.toolbar.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-box brown-box">
          <div className="toolbar-group">
            <span className="toolbar-label">{t('home.toolbar.sorting')}</span>
            <select
              className="soft-input toolbar-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">{t('home.toolbar.sort_az')}</option>
              <option value="name_desc">{t('home.toolbar.sort_za')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="two-column-layout home-layout">
        <section className="column-panel">
          <div className="single-ribbon-wrap">
            <div className="section-ribbon blue-ribbon home-ribbon" style={{ margin: 0 }}>
              {t('home.sections.recommended')}
            </div>
          </div>
          
          <div className="restaurant-stack">
            {leftGroups.length > 0 ? (
              <article className="restaurant-card home-restaurant-panel">
                <div className="restaurant-grid">
                  {leftGroups.map((restaurant) => (
                    <button
                      key={restaurant.id_restauracja}
                      className="tile home-restaurant-tile"
                      onClick={() => {
                        localStorage.setItem('currentRestId', String(restaurant.id_restauracja));
                        onNavigate('restaurant');
                      }}
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
                {t('home.no_restaurants')}
              </p>
            )}
          </div>
        </section>

        <section className="column-panel">
          {rightGroups.length > 0 && (
            <>
              <div className="single-ribbon-wrap">
                <div className="section-ribbon green-ribbon home-ribbon" style={{ margin: 0 }}>
                  {t('home.sections.promotions')}
                </div>
              </div>
              
              <div className="restaurant-stack">
                <article className="restaurant-card home-restaurant-panel">
                  <div className="restaurant-grid">
                    {rightGroups.map((restaurant) => (
                      <button
                        key={restaurant.id_restauracja}
                        className="tile home-restaurant-tile"
                        onClick={() => {
                          localStorage.setItem('currentRestId', String(restaurant.id_restauracja));
                          onNavigate('restaurant');
                        }}
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