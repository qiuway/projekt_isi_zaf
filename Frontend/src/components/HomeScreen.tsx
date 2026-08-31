import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { restaurantsApi } from '../api/apiClient';

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

  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
      restaurantsApi.getAll()
          .then((response) => setRestaurants(response.data))
          .catch((error) => console.error(t('home.errors.fetch_error'), error));
  }, [t]);

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.nazwa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'open' ? r.czynne : true;
    return matchesSearch && matchesStatus;
  });

  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    if (sortBy === 'name_asc') return a.nazwa.localeCompare(b.nazwa);
    if (sortBy === 'name_desc') return b.nazwa.localeCompare(a.nazwa);
    return 0;
  });

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="toolbar-row">
        <div className="filter-box yellow-box">
          <div className="toolbar-group">
            <span className="toolbar-label">{t('home.toolbar.filters')}</span>
            <select
              className="soft-input toolbar-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
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

      <div className="home-content-wrap">
        <div className="single-ribbon-wrap">
          <div className="section-ribbon blue-ribbon home-ribbon" style={{ margin: '0 auto 20px auto' }}>
            {t('home.sections.recommended')}
          </div>
        </div>

        {sortedRestaurants.length > 0 ? (
          <div className="home-restaurants-grid">
            {sortedRestaurants.map((restaurant) => (
              <button
                key={restaurant.id_restauracja}
                className="home-restaurant-card"
                onClick={() => {
                  localStorage.setItem('currentRestId', String(restaurant.id_restauracja));
                  onNavigate('restaurant');
                }}
              >
                <div className="home-restaurant-card-header">
                  <strong className="home-restaurant-title">{restaurant.nazwa}</strong>
                  <span className={`home-status-badge ${restaurant.czynne ? 'status-open' : 'status-closed'}`}>
                    {restaurant.czynne ? t('home.status_open') : t('home.status_closed')}
                  </span>
                </div>

                {(restaurant.opis || restaurant.adres) && (
                  <div className="home-restaurant-details">
                    {restaurant.opis && (
                      <p className="home-restaurant-desc">{restaurant.opis}</p>
                    )}
                    {restaurant.adres && (
                      <span className="home-restaurant-address">{restaurant.adres}</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="home-no-restaurants" style={{ textAlign: 'center', padding: '40px' }}>
            {t('home.no_restaurants')}
          </p>
        )}
      </div>
    </div>
  );
}