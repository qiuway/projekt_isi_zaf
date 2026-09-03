import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { adminApi, userApi, couponsApi, restaurantsApi, getAvatarUrl } from '../api/apiClient';
import { useNotify } from './NotificationProvider';
import { ConfirmationProvider } from './ConfirmationProvider';

interface AdminPanelScreenProps {
  onNavigate: (screen: Screen) => void;
}

type AdminUser = {
  id_uzytkownik: number;
  imie: string;
  nazwisko: string;
  email: string;
  numer_telefonu: number | null;
  adres: string | null;
  zdjecie_profilowe: string | null;
  id_typ_konta: number;
  punkty: number;
  liczba_zamowien: number;
};

type AdminRestaurant = {
  id_restauracja: number;
  nazwa: string;
  opis?: string | null;
  adres: string | null;
  numer_telefonu: number | null;
  czynne: boolean;
  id_uzytkownik: number | null;
  wlasciciel_nazwa: string;
  liczba_dan: number;
  liczba_zamowien: number;
};

type AdminCoupon = {
  id_kupon: number;
  nazwa: string;
  opis: string | null;
  koszt_punktowy: number;
  wartosc_znizki: string | null;
  ikona: string | null;
};

type PlatformStats = {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  total_restaurants: number;
  total_products: number;
};

export function AdminPanelScreen({ onNavigate }: AdminPanelScreenProps) {
  const { t } = useTranslation();
  const notify = useNotify();

  const [activeTab, setActiveTab] = useState<'users' | 'restaurants' | 'coupons'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<number>(0);
  const [selectedRoles, setSelectedRoles] = useState<{ [userId: number]: number }>({});

  const [restSearchQuery, setRestSearchQuery] = useState('');
  const [restStatusFilter, setRestStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [restModalMode, setRestModalMode] = useState<'add' | 'edit'>('add');
  const [currentRestId, setCurrentRestId] = useState<number | null>(null);
  const [formRestNazwa, setFormRestNazwa] = useState('');
  const [formRestOpis, setFormRestOpis] = useState('');
  const [formRestAdres, setFormRestAdres] = useState('');
  const [formRestTel, setFormRestTel] = useState('');
  const [formRestCzynne, setFormRestCzynne] = useState(true);
  const [formRestOwnerId, setFormRestOwnerId] = useState<string>('');

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponMode, setCouponMode] = useState<'add' | 'edit'>('add');
  const [currentCouponId, setCurrentCouponId] = useState<number | null>(null);
  const [couponNazwa, setCouponNazwa] = useState('');
  const [couponOpis, setCouponOpis] = useState('');
  const [couponKoszt, setCouponKoszt] = useState('');
  const [couponZnizka, setCouponZnizka] = useState('');
  const [couponIkona, setCouponIkona] = useState('🏷️');


  const [ownUserId, setOwnUserId] = useState(null);

  const [confirmAction, setConfirmAction] = useState<null | {
    message: string;
    action: () => void;
  }>(null);

  const checkAdminAccess = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      notify('Musisz być zalogowany.', 'warning');
      onNavigate('login');
      return false;
    }

    try {
      const res = await userApi.getProfile(userId);
      if (res.data.id_typ_konta !== 3) {
        notify('Brak uprawnień administratora.', 'error');
        onNavigate('home');
        return false;
      }
      setOwnUserId(res.data.id_uzytkownik);
      return true;
    } catch {
      onNavigate('login');
      return false;
    }
  }, [onNavigate, notify]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getPlatformStats();
      setStats(res.data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAllUsers(searchQuery || undefined, roleFilter > 0 ? roleFilter : undefined);
      setUsers(res.data);
      const rolesMap: { [userId: number]: number } = {};
      res.data.forEach((u: AdminUser) => {
        rolesMap[u.id_uzytkownik] = u.id_typ_konta;
      });
      setSelectedRoles(rolesMap);
    } catch (err: any) {
      console.error(err);
      notify(err.response?.data?.detail || 'Błąd pobierania użytkowników', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter, notify]);

  const fetchRestaurants = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAllRestaurants(search !== undefined ? search : restSearchQuery);
      setRestaurants(res.data);
    } catch (err: any) {
      console.error(err);
      notify(err.response?.data?.detail || 'Błąd pobierania restauracji', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [restSearchQuery, notify]);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await couponsApi.getAll();
      setCoupons(res.data);
    } catch (err: any) {
      console.error(err);
      notify(err.response?.data?.detail || 'Błąd pobierania kuponów sklepu', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    checkAdminAccess().then((hasAccess) => {
      if (hasAccess) {
        fetchStats();
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'restaurants') {
          fetchRestaurants();
          if (users.length === 0) fetchUsers();
        }
        else if (activeTab === 'coupons') fetchCoupons();
      }
    });
  }, [activeTab, fetchUsers, fetchRestaurants, fetchCoupons, fetchStats, checkAdminAccess]);

  const handleRoleChange = async (userId: number) => {
    const newRole = selectedRoles[userId];
    if(userId === ownUserId) return;
    try {
      await adminApi.updateUserRole(userId, newRole);
      notify(t('admin.users.role_updated'), 'success');
      fetchUsers();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Błąd podczas zmiany roli.', 'error');
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    setConfirmAction({
      message: t('admin.users.confirm_delete', { email: user.email }),
      action: async () => {
        try {
          await adminApi.deleteUser(user.id_uzytkownik);
          notify(t('admin.users.user_deleted'), 'success');
          fetchUsers();
          fetchStats();
        } catch (err: any) {
          notify(err.response?.data?.detail || 'Błąd podczas usuwania użytkownika.', 'error');
        }
      },
    });
  };

  const handleToggleRestStatus = async (r: AdminRestaurant) => {
    try {
      await restaurantsApi.update(r.id_restauracja, {
        nazwa: r.nazwa,
        opis: r.opis || undefined,
        adres: r.adres || undefined,
        numer_telefonu: r.numer_telefonu,
        czynne: !r.czynne,
      });
      notify(t('admin.restaurants.status_changed'), 'success');
      fetchRestaurants();
      fetchStats();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Błąd zmiany statusu restauracji.', 'error');
    }
  };

  const openAddRestModal = () => {
    setRestModalMode('add');
    setCurrentRestId(null);
    setFormRestNazwa('');
    setFormRestOpis('');
    setFormRestAdres('');
    setFormRestTel('');
    setFormRestCzynne(true);
    setFormRestOwnerId(localStorage.getItem('userId') || '');
    setIsRestModalOpen(true);
  };

  const openEditRestModal = (r: AdminRestaurant) => {
    setRestModalMode('edit');
    setCurrentRestId(r.id_restauracja);
    setFormRestNazwa(r.nazwa);
    setFormRestOpis(r.opis || '');
    setFormRestAdres(r.adres || '');
    setFormRestTel(r.numer_telefonu ? String(r.numer_telefonu) : '');
    setFormRestCzynne(r.czynne);
    setFormRestOwnerId(r.id_uzytkownik ? String(r.id_uzytkownik) : '');
    setIsRestModalOpen(true);
  };

  const ADDRESS_REGEX = /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s.,\-/m#]*$/;

  const handleSaveRestaurant = async () => {
    if (!formRestNazwa.trim()) {
      notify(t('admin.restaurants.name_required'), 'warning');
      return;
    }

    if (formRestAdres && !ADDRESS_REGEX.test(formRestAdres.trim())) {
      notify(t('admin.restaurants.invalid_address', 'Adres lokalu może zawierać tylko litery, cyfry, spacje oraz znaki: . , - / #'), 'error');
      return;
    }

    const payload = {
      nazwa: formRestNazwa.trim(),
      opis: formRestOpis.trim() || undefined,
      adres: formRestAdres.trim() || undefined,
      numer_telefonu: formRestTel ? parseInt(formRestTel, 10) : null,
      czynne: formRestCzynne,
    };

    const ownerId = formRestOwnerId ? Number(formRestOwnerId) : Number(localStorage.getItem('userId'));

    try {
      if (restModalMode === 'add') {
        await restaurantsApi.create(ownerId, payload);
        notify(t('admin.restaurants.saved_success'), 'success');
      } else {
        await restaurantsApi.update(currentRestId!, payload);
        notify(t('admin.restaurants.saved_success'), 'success');
      }
      setIsRestModalOpen(false);
      fetchRestaurants();
      fetchStats();
    } catch (err: any) {
      notify(err.response?.data?.detail || t('admin.restaurants.save_error'), 'error');
    }
  };

  const handleDeleteRestaurant = (r: AdminRestaurant) => {
    setConfirmAction({
      message: t('admin.restaurants.confirm_delete', { name: r.nazwa }),
      action: async () => {
        try {
          await restaurantsApi.delete(r.id_restauracja);
          notify(t('admin.restaurants.deleted_success'), 'success');
          fetchRestaurants();
          fetchStats();
        } catch (err: any) {
          notify(err.response?.data?.detail || t('admin.restaurants.delete_error'), 'error');
        }
      },
    });
  };

  const handleViewRestaurant = (r: AdminRestaurant) => {
    localStorage.setItem('wybranaRestauracja', JSON.stringify({
      id_restauracja: r.id_restauracja,
      nazwa: r.nazwa,
      opis: r.opis,
      adres: r.adres,
      numer_telefonu: r.numer_telefonu,
      czynne: r.czynne,
    }));
    onNavigate('restaurant');
  };

  const openAddCouponModal = () => {
    setCouponMode('add');
    setCurrentCouponId(null);
    setCouponNazwa('');
    setCouponOpis('');
    setCouponKoszt('');
    setCouponZnizka('');
    setCouponIkona('🏷️');
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon: AdminCoupon) => {
    setCouponMode('edit');
    setCurrentCouponId(coupon.id_kupon);
    setCouponNazwa(coupon.nazwa);
    setCouponOpis(coupon.opis || '');
    setCouponKoszt(String(coupon.koszt_punktowy));
    setCouponZnizka(coupon.wartosc_znizki || '');
    setCouponIkona(coupon.ikona || '🏷️');
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async () => {
    if (!couponNazwa.trim() || !couponKoszt) {
      notify(t('admin.coupons.fields_required'), 'warning');
      return;
    }

    const payload = {
      nazwa: couponNazwa.trim(),
      opis: couponOpis.trim() || undefined,
      koszt_punktowy: parseInt(couponKoszt, 10),
      wartosc_znizki: couponZnizka.trim() || undefined,
      ikona: couponIkona || '🏷️',
    };

    try {
      if (couponMode === 'add') {
        await adminApi.createCoupon(payload);
        notify(t('admin.coupons.created_success'), 'success');
      } else {
        await adminApi.updateCoupon(currentCouponId!, payload);
        notify(t('admin.coupons.updated_success'), 'success');
      }
      setIsCouponModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      notify(err.response?.data?.detail || t('admin.coupons.save_error'), 'error');
    }
  };

  const handleDeleteCoupon = (coupon: AdminCoupon) => {
    setConfirmAction({
      message: t('admin.coupons.confirm_delete', { name: coupon.nazwa }),
      action: async () => {
        try {
          await adminApi.deleteCoupon(coupon.id_kupon);
          notify(t('admin.coupons.deleted_success'), 'success');
          fetchCoupons();
        } catch (err: any) {
          notify(err.response?.data?.detail || t('admin.coupons.delete_error'), 'error');
        }
      },
    });
  };

  const filteredRestaurants = restaurants.filter((r) => {
    if (restStatusFilter === 'open') return r.czynne;
    if (restStatusFilter === 'closed') return !r.czynne;
    return true;
  });

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">{t('admin.title')}</div>
      </div>

      {stats && (
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-label">{t('admin.stats.users')}</div>
            <strong className="admin-stat-value">{stats.total_users}</strong>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">{t('admin.stats.orders')}</div>
            <strong className="admin-stat-value">{stats.total_orders}</strong>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">{t('admin.stats.revenue')}</div>
            <strong className="admin-stat-value highlight">{stats.total_revenue.toFixed(2)} zł</strong>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">{t('admin.stats.restaurants')}</div>
            <strong className="admin-stat-value">{stats.total_restaurants}</strong>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">{t('admin.stats.products')}</div>
            <strong className="admin-stat-value">{stats.total_products}</strong>
          </div>
        </section>
      )}

      <div className="admin-tabs-nav">
        <button
          className={`secondary-button admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          {t('admin.tabs.users')}
        </button>
        <button
          className={`secondary-button admin-tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          {t('admin.tabs.restaurants')}
        </button>
        <button
          className={`secondary-button admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          {t('admin.tabs.coupons')}
        </button>
      </div>

      {activeTab === 'users' && (
        <section style={{ marginTop: '20px' }}>
          <div className="admin-search-bar">
            <input
              className="soft-input admin-search-input"
              placeholder={t('admin.users.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="soft-input admin-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(Number(e.target.value))}
            >
              <option value={0}>{t('admin.users.filter_all_roles')}</option>
              <option value={1}>{t('admin.users.filter_clients')}</option>
              <option value={2}>{t('admin.users.filter_owners')}</option>
              <option value={3}>{t('admin.users.filter_admins')}</option>
            </select>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center' }}>Ładowanie...</p>
          ) : users.length === 0 ? (
            <p className="admin-empty-state" style={{ textAlign: 'center' }}>{t('admin.users.no_users')}</p>
          ) : (
            <div className="admin-card-list">
              {users.map((u) => (
                <div key={u.id_uzytkownik} className="admin-card-item">
                  <div className="admin-user-info-wrap">
                    <div className="admin-avatar-thumb">
                      {getAvatarUrl(u.zdjecie_profilowe) ? (
                        <img src={getAvatarUrl(u.zdjecie_profilowe)!} alt="Avatar" />
                      ) : (
                        <span>{u.imie ? u.imie[0] : 'U'}</span>
                      )}
                    </div>
                    <div className="admin-user-details">
                      <strong>{u.imie} {u.nazwisko}</strong>
                      <div className="admin-email">{u.email}</div>
                      <div className="admin-meta">
                        {t('admin.users.orders_count', { count: u.liczba_zamowien })} | {t('admin.users.points_count', { count: u.punkty })}
                      </div>
                    </div>
                  </div>

                  <div className="admin-user-actions">
                    <select
                      className="soft-input admin-inline-role-select"
                      value={selectedRoles[u.id_uzytkownik] || u.id_typ_konta}
                      onChange={(e) =>
                        setSelectedRoles((prev) => ({
                          ...prev,
                          [u.id_uzytkownik]: Number(e.target.value),
                        }))
                      }
                    >
                      <option value={1}>{t('admin.users.role_client')}</option>
                      <option value={2}>{t('admin.users.role_owner')}</option>
                      <option value={3}>{t('admin.users.role_admin')}</option>
                    </select>

                    <button
                      className="secondary-button"
                      disabled={selectedRoles[u.id_uzytkownik] === u.id_typ_konta}
                      onClick={() => handleRoleChange(u.id_uzytkownik)}
                    >
                      {t('admin.users.btn_change_role')}
                    </button>

                    <button
                      className="secondary-button admin-btn-delete"
                      onClick={() => handleDeleteUser(u)}
                    >
                      {t('admin.users.btn_delete_user')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'restaurants' && (
        <section style={{ marginTop: '20px' }}>
          <div className="admin-search-bar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="soft-input admin-search-input"
              style={{ flex: 1, minWidth: '220px' }}
              placeholder={t('admin.restaurants.search_placeholder')}
              value={restSearchQuery}
              onChange={(e) => {
                setRestSearchQuery(e.target.value);
                fetchRestaurants(e.target.value);
              }}
            />

            <select
              className="soft-input admin-filter-select"
              value={restStatusFilter}
              onChange={(e) => setRestStatusFilter(e.target.value as any)}
            >
              <option value="all">{t('admin.restaurants.filter_all')}</option>
              <option value="open">{t('admin.restaurants.filter_open')}</option>
              <option value="closed">{t('admin.restaurants.filter_closed')}</option>
            </select>

            <button className="mint-button" onClick={openAddRestModal}>
              + {t('admin.restaurants.btn_add_restaurant')}
            </button>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center' }}>Ładowanie...</p>
          ) : filteredRestaurants.length === 0 ? (
            <p className="admin-empty-state" style={{ textAlign: 'center' }}>{t('admin.restaurants.no_restaurants')}</p>
          ) : (
            <div className="admin-card-list">
              {filteredRestaurants.map((r) => (
                <div key={r.id_restauracja} className="admin-card-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div className="admin-user-details">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '1.2rem' }}>{r.nazwa}</strong>
                        <span className={r.czynne ? 'admin-badge-open' : 'admin-badge-closed'}>
                          {r.czynne ? t('admin.restaurants.status_open') : t('admin.restaurants.status_closed')}
                        </span>
                      </div>
                      {r.opis && <div className="admin-email" style={{ fontStyle: 'italic', marginTop: '2px' }}>{r.opis}</div>}
                      <div className="admin-email" style={{ marginTop: '4px' }}>
                        {r.adres || 'Brak adresu'} {r.numer_telefonu ? `| ${r.numer_telefonu}` : ''}
                      </div>
                      <div className="admin-meta" style={{ marginTop: '4px' }}>
                        {t('admin.restaurants.owner', { name: r.wlasciciel_nazwa })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="admin-meta">
                        {t('admin.restaurants.dishes', { count: r.liczba_dan })} | {t('admin.restaurants.orders', { count: r.liczba_zamowien })}
                      </div>
                    </div>
                  </div>

                  <div className="admin-user-actions" style={{ justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px', flexWrap: 'wrap' }}>
                    <button
                      className="secondary-button"
                      style={{ background: r.czynne ? '#ffebee' : '#e8f5e9', borderColor: r.czynne ? '#ffcdd2' : '#c8e6c9', color: r.czynne ? '#c62828' : '#2e7d32' }}
                      onClick={() => handleToggleRestStatus(r)}
                    >
                      {r.czynne ? t('admin.restaurants.status_closed') : t('admin.restaurants.status_open')}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => handleViewRestaurant(r)}
                    >
                      {t('admin.restaurants.btn_view_restaurant')}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => openEditRestModal(r)}
                    >
                      {t('admin.restaurants.btn_edit')}
                    </button>

                    <button
                      className="secondary-button admin-btn-delete"
                      onClick={() => handleDeleteRestaurant(r)}
                    >
                      {t('admin.restaurants.btn_delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'coupons' && (
        <section style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="admin-tab-heading" style={{ margin: 0 }}>{t('admin.tabs.coupons')}</h3>
            <button className="mint-button" onClick={openAddCouponModal}>
              {t('admin.coupons.btn_add_coupon')}
            </button>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center' }}>Ładowanie...</p>
          ) : coupons.length === 0 ? (
            <p className="admin-empty-state" style={{ textAlign: 'center' }}>{t('admin.coupons.no_coupons')}</p>
          ) : (
            <div className="admin-card-list">
              {coupons.map((c) => (
                <div key={c.id_kupon} className="admin-card-item">
                  <div className="admin-user-info-wrap">
                    <div className="admin-avatar-thumb" style={{ fontSize: '1.8rem' }}>
                      {c.ikona || '🏷️'}
                    </div>
                    <div className="admin-user-details">
                      <strong>{c.nazwa}</strong>
                      {c.opis && <div className="admin-email">{c.opis}</div>}
                      <div className="admin-meta" style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                        <span>{t('admin.coupons.cost_label', { cost: c.koszt_punktowy })}</span>
                        {c.wartosc_znizki && <span>{t('admin.coupons.discount_label', { value: c.wartosc_znizki })}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="admin-user-actions">
                    <button
                      className="secondary-button"
                      onClick={() => openEditCouponModal(c)}
                    >
                      {t('admin.coupons.btn_edit')}
                    </button>
                    <button
                      className="secondary-button admin-btn-delete"
                      onClick={() => handleDeleteCoupon(c)}
                    >
                      {t('admin.coupons.btn_delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {isRestModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="admin-modal-heading" style={{ margin: 0 }}>
                {restModalMode === 'add' ? t('admin.restaurants.modal_add_title') : t('admin.restaurants.modal_edit_title')}
              </h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                onClick={() => setIsRestModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="settings-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>
                {t('admin.restaurants.labels_name')} *
                <input
                  className="soft-input"
                  placeholder="np. Pizzeria Bella Italia"
                  value={formRestNazwa}
                  onChange={(e) => setFormRestNazwa(e.target.value)}
                />
              </label>

              <label>
                {t('admin.restaurants.labels_desc')}
                <textarea
                  className="soft-input"
                  rows={2}
                  placeholder="np. Najlepsza włoska pizza z pieca opalanego drewnem"
                  value={formRestOpis}
                  onChange={(e) => setFormRestOpis(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <label>
                  {t('admin.restaurants.labels_address')}
                  <input
                    className="soft-input"
                    placeholder="np. ul. Sienkiewicza 12, Kielce"
                    value={formRestAdres}
                    onChange={(e) => setFormRestAdres(e.target.value)}
                  />
                </label>

                <label>
                  {t('admin.restaurants.labels_phone')}
                  <input
                    className="soft-input"
                    type="number"
                    placeholder="np. 600100200"
                    value={formRestTel}
                    onChange={(e) => setFormRestTel(e.target.value)}
                  />
                </label>
              </div>

              <label>
                {t('admin.restaurants.labels_owner')}
                <select
                  className="soft-input"
                  value={formRestOwnerId}
                  onChange={(e) => setFormRestOwnerId(e.target.value)}
                >
                  <option value="">{t('admin.restaurants.owner_none')}</option>
                  {users.map((u) => (
                    <option key={u.id_uzytkownik} value={u.id_uzytkownik}>
                      {u.imie} {u.nazwisko} ({u.email}) {u.id_typ_konta === 2 ? '[Właściciel]' : u.id_typ_konta === 3 ? '[Admin]' : '[Klient]'}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '5px' }}>
                <input
                  type="checkbox"
                  checked={formRestCzynne}
                  onChange={(e) => setFormRestCzynne(e.target.checked)}
                />
                <strong>{t('admin.restaurants.labels_status')}</strong>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px' }}>
              <button className="secondary-button" onClick={() => setIsRestModalOpen(false)}>
                {t('common.cancel', 'Anuluj')}
              </button>
              <button className="mint-button" onClick={handleSaveRestaurant}>
                {t('common.save', 'Zapisz')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCouponModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="admin-modal-heading" style={{ margin: 0 }}>
                {couponMode === 'add' ? t('admin.coupons.modal_add_title') : t('admin.coupons.modal_edit_title')}
              </h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                onClick={() => setIsCouponModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="settings-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>
                {t('admin.coupons.labels_name')} *
                <input
                  className="soft-input"
                  placeholder="np. Zniżka 15 zł na całe menu"
                  value={couponNazwa}
                  onChange={(e) => setCouponNazwa(e.target.value)}
                />
              </label>

              <label>
                {t('admin.coupons.labels_desc')}
                <textarea
                  className="soft-input"
                  rows={2}
                  placeholder="np. Obowiązuje przy zamówieniach od 50 zł"
                  value={couponOpis}
                  onChange={(e) => setCouponOpis(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <label>
                  {t('admin.coupons.labels_cost')} *
                  <input
                    className="soft-input"
                    type="number"
                    min="0"
                    placeholder="np. 100"
                    value={couponKoszt}
                    onChange={(e) => setCouponKoszt(e.target.value)}
                  />
                </label>

                <label>
                  {t('admin.coupons.labels_discount')}
                  <input
                    className="soft-input"
                    placeholder="np. 15% lub 10 zł"
                    value={couponZnizka}
                    onChange={(e) => setCouponZnizka(e.target.value)}
                  />
                </label>
              </div>

              <label>
                {t('admin.coupons.labels_icon')}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <input
                    className="soft-input"
                    style={{ width: '80px', textAlign: 'center', fontSize: '1.2rem' }}
                    value={couponIkona}
                    onChange={(e) => setCouponIkona(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {['🏷️', '🎁', '🍔', '🍕', '🚚', '🍰', '⭐', '☕', '🥤'].map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        className="secondary-button"
                        style={{ padding: '6px 10px', fontSize: '1.1rem' }}
                        onClick={() => setCouponIkona(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px' }}>
              <button className="secondary-button" onClick={() => setIsCouponModalOpen(false)}>
                {t('admin.coupons.btn_cancel')}
              </button>
              <button className="mint-button" onClick={handleSaveCoupon}>
                {t('admin.coupons.btn_save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmationProvider
          message={confirmAction.message}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            confirmAction.action();
            setConfirmAction(null);
          }}
        />
      )}
    </div>
  );
}
