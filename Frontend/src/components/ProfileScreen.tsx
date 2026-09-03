import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { userApi, restaurantsApi, productsApi, getAvatarUrl } from '../api/apiClient';
import { useNotify } from './NotificationProvider';
import { ConfirmationProvider } from './ConfirmationProvider';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const [confirmAction, setConfirmAction] = useState<null | {
      message: string;
      action: () => void;
  }>(null);
  const [userData, setUserData] = useState<any>(null);
  const [managedRestaurants, setManagedRestaurants] = useState<any[]>([]);
  const userId = localStorage.getItem('userId');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentRestId, setCurrentRestId] = useState<number | null>(null);
  
  const [formNazwa, setFormNazwa] = useState('');
  const [formOpis, setFormOpis] = useState('');
  const [formAdres, setFormAdres] = useState('');
  const [formTel, setFormTel] = useState('');
  const [formCzynne, setFormCzynne] = useState(false);

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  const [kategorie, setKategorie] = useState<any[]>([]);
  
  const [prodMode, setProdMode] = useState<'add' | 'edit'>('add');
  const [currentProdId, setCurrentProdId] = useState<number | null>(null);
  const [prodNazwa, setProdNazwa] = useState('');
  const [prodCena, setProdCena] = useState('');
  const [prodKategoria, setProdKategoria] = useState('');
  const [prodDostepny, setProdDostepny] = useState(true);

    const fetchProfileAndRestaurants = () => {
        if (!userId) return;

        userApi.getProfile(userId)
            .then((response) => {
                const data = response.data;

                setUserData(data);

                if (data.id_typ_konta === 2 || data.id_typ_konta === 3) {
                    restaurantsApi.getManaged(userId)
                        .then((response) => setManagedRestaurants(response.data));

                    productsApi.getCategories()
                        .then((response) => {
                            const kat = response.data;

                            setKategorie(kat);

                            if (kat.length > 0) {
                                setProdKategoria(String(kat[0].id_kategoria));
                            }
                        });
                }
            })
            .catch(console.error);
    };

  useEffect(() => {
    fetchProfileAndRestaurants();
  }, [userId]);

  const handleLogout = () => {
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('punkty');
      localStorage.removeItem('currentScreen');

      notify(t('profile.alerts.logged_out'), 'success');
      onNavigate('login');
  };

  const openModalForAdd = () => {
    setModalMode('add');
    setFormNazwa(''); setFormOpis(''); setFormAdres(''); setFormTel(''); setFormCzynne(true);
    setIsModalOpen(true);
  };

  const openModalForEdit = (rest: any) => {
    setModalMode('edit');
    setCurrentRestId(rest.id_restauracja);
    setFormNazwa(rest.nazwa || ''); 
    setFormOpis(rest.opis || ''); 
    setFormAdres(rest.adres || '');
    setFormTel(rest.numer_telefonu ? String(rest.numer_telefonu) : ''); 
    setFormCzynne(rest.czynne);
    setIsModalOpen(true);
  };

  const ADDRESS_REGEX = /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s.,\-/m#]*$/;

  const handleSaveRestaurant = async () => {
        if (!formNazwa.trim()) {
            notify(t('profile.alerts.rest_name_required'), 'warning');
            return;
        }

        if (!formOpis.trim() || !formAdres.trim() || !formTel.trim()) {
            notify(t('profile.alerts.rest_fields_required'), 'warning');
            return;
        }

        if (!ADDRESS_REGEX.test(formAdres.trim())) {
            notify(t('profile.alerts.invalid_address'), 'error');
            return;
        }
        const payload = {
        nazwa: formNazwa.trim(), 
        opis: formOpis.trim() || undefined, 
        adres: formAdres.trim() || undefined, 
        numer_telefonu: formTel ? parseInt(formTel) : null, 
        czynne: formCzynne 
    };
      try {
          if (modalMode === 'add') {
              await restaurantsApi.create(userId!, payload);
          } else {
              await restaurantsApi.update(currentRestId!, payload);
          }

          notify(
              modalMode === 'add' ? t('profile.alerts.rest_added') : t('profile.alerts.rest_saved'),
              'success'
          );
          setIsModalOpen(false);
          fetchProfileAndRestaurants();
      } catch (error: any) {
          notify(error.response?.data?.detail || t('profile.alerts.rest_save_error'), 'error');
      }
  };

    const handleDeleteRestaurant = async (restId: number) => {
        try {
            await restaurantsApi.delete(restId);
            notify(t('profile.alerts.rest_deleted'), 'success');
            fetchProfileAndRestaurants();
        } catch (error: any) {
            notify(error.response?.data?.detail || t('profile.alerts.rest_delete_error'), 'error');
        }
    };

    const fetchMenuProducts = (restId: number) => {
        productsApi.getByRestaurant(restId)
            .then((response) => setMenuProducts(response.data))
            .catch(() => notify(t('profile.alerts.menu_fetch_error'), 'error'));
    };

  const openMenuModal = (restId: number) => {
    setCurrentRestId(restId);
    setProdMode('add');
    resetProductForm();
    fetchMenuProducts(restId);
    setIsMenuModalOpen(true);
  };

  const resetProductForm = () => {
    setProdNazwa(''); setProdCena(''); setProdDostepny(true);
    if (kategorie.length > 0) setProdKategoria(String(kategorie[0].id_kategoria));
    setProdMode('add');
    setCurrentProdId(null);
  };

  const startEditProduct = (prod: any) => {
    setProdMode('edit');
    setCurrentProdId(prod.id_produkt);
    setProdNazwa(prod.nazwa);
    setProdCena(String(prod.cena));
    setProdKategoria(String(prod.id_kategoria));
    setProdDostepny(prod.dostepny);
  };

  const handleSaveProduct = async () => {
      if (!prodNazwa || !prodCena || !prodKategoria) {
          notify(t('profile.alerts.prod_required'), 'warning');
          return;
      }
    
    const payload = {
        nazwa: prodNazwa,
        cena: parseFloat(prodCena),
        id_kategoria: parseInt(prodKategoria),
        dostepny: prodDostepny
    };

      try {
          if (prodMode === 'add') {
              await productsApi.create(currentRestId!, payload);
          } else {
              await productsApi.update(currentProdId!, payload);
          }

          notify(
              prodMode === 'add' ? t('profile.alerts.prod_added') : t('profile.alerts.prod_updated'),
              'success'
          );

          fetchMenuProducts(currentRestId!);
          resetProductForm();
      } catch (error: any) {
          notify(error.response?.data?.detail || t('profile.alerts.prod_save_error'), 'error');
      }
  };

    const handleDeleteProduct = async (prodId: number) => {
        try {
            await productsApi.delete(prodId);
            notify(t('profile.alerts.prod_deleted'), 'success');
            fetchMenuProducts(currentRestId!);
        } catch (error: any) {
            notify(error.response?.data?.detail || t('profile.alerts.prod_delete_error'), 'error');
        }
    };

    const handleUploadProductPhoto = async (prodId: number, file: File) => {
        try {
            await productsApi.uploadPhoto(prodId, file);
            notify(t('profile.alerts.photo_uploaded'), 'success');
            fetchMenuProducts(currentRestId!);
        } catch (error: any) {
            notify(error.response?.data?.detail || t('profile.alerts.photo_upload_error'), 'error');
        }
    };

  const canManage = userData && (userData.id_typ_konta === 2 || userData.id_typ_konta === 3);

  const getAccountTypeLabel = (typeId: number) => {
    if (typeId === 3) return t('profile.roles.admin');
    if (typeId === 2) return t('profile.roles.owner');
    return t('profile.roles.client');
  };

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">{t('profile.title')}</div>
      </div>

      <section className="profile-card">
        <div className="avatar-column">
          <div className="avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getAvatarUrl(userData?.zdjecie_profilowe) ? (
              <img src={getAvatarUrl(userData?.zdjecie_profilowe)!} alt={t('profile.avatar_alt')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <><div className="avatar-head" /><div className="avatar-body" /></>
            )}
          </div>
          <div className="profile-account-type-badge">
            {t('profile.account_type', { type: getAccountTypeLabel(userData?.id_typ_konta) })}
          </div>
          
          <button 
            className="secondary-button" 
            style={{ marginTop: '20px', width: '100%', fontSize: '0.85rem' }} 
            onClick={() => onNavigate('orderHistory' as Screen)}
          >
            {t('profile.order_history', 'Historia zamówień')}
          </button>

          {userData?.id_typ_konta === 3 && (
            <button 
              className="mint-button" 
              style={{ marginTop: '10px', width: '100%', fontSize: '0.85rem' }} 
              onClick={() => onNavigate('adminPanel')}
            >
              {t('topbar.menu.adminPanel', 'Panel Administratora')}
            </button>
          )}
          
        </div>

        <div className="profile-info">
          {userData ? (
            <>
              <div className="profile-line"><span>{t('profile.info.name')}</span><strong>{userData.imie} {userData.nazwisko}</strong></div>
              <div className="profile-line"><span>{t('profile.info.email')}</span><strong>{userData.email}</strong></div>
              <div className="profile-line"><span>{t('profile.info.phone')}</span><strong>{userData.numer_telefonu || t('profile.info.none')}</strong></div>
              <div className="profile-line"><span>{t('profile.info.address')}</span><strong>{userData.adres || t('profile.info.none')}</strong></div>
            </>
          ) : <p>{t('profile.loading')}</p>}
          <div className="profile-actions">
            <button className="secondary-button" onClick={() => onNavigate('profileEdit')}>{t('profile.actions.edit')}</button>
            <button className="mint-button logout-button" onClick={handleLogout}>{t('profile.actions.logout')}</button>
          </div>
        </div>
      </section>

      {canManage && (
        <section className="management-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="profile-section-heading" style={{ margin: 0 }}>{t('profile.management.title')}</h2>
            <button className="mint-button" onClick={openModalForAdd}>{t('profile.management.add_restaurant')}</button>
          </div>
          {managedRestaurants.map(rest => (
            <div key={rest.id_restauracja} className="restaurant-list-item">
              <div>
                <strong>{rest.nazwa}</strong>
                <div className="profile-rest-subtitle">
                  {rest.czynne ? t('profile.management.status_open') : t('profile.management.status_closed')} | {rest.adres}
                </div>
              </div>
              <div className="restaurant-list-actions">
                <button 
                  className="secondary-button" 
                  style={{ background: '#e0f7fa', borderColor: '#b2ebf2' }} 
                  onClick={() => openMenuModal(rest.id_restauracja)}
                >
                  {t('profile.management.btn_menu')}
                </button>
                <button 
                  className="secondary-button" 
                  style={{ background: '#ffeb3b', borderColor: '#fbc02d' }} 
                  onClick={() => {
                    localStorage.setItem('restaurantOrdersRestId', String(rest.id_restauracja));
                    localStorage.setItem('restaurantOrdersRestName', rest.nazwa);
                    onNavigate('restaurantOrders');
                  }}
                >
                  {t('profile.management.btn_orders')}
                </button>
                <button 
                  className="secondary-button" 
                  onClick={() => openModalForEdit(rest)}
                >
                  {t('profile.management.btn_edit')}
                </button>
                <button 
                  className="secondary-button" 
                  style={{ background: '#ffcccc', color: '#cc0000', borderColor: '#ff9999' }}
                  onClick={() =>
                      setConfirmAction({
                          message: t('profile.alerts.rest_delete_confirm'),
                          action: () => handleDeleteRestaurant(rest.id_restauracja)
                      })
                  }
                >
                  {t('profile.management.btn_delete')}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 className="profile-modal-heading" style={{ margin: 0 }}>
                {modalMode === 'add' ? t('profile.restaurant_modal.title_add') : t('profile.restaurant_modal.title_edit')}
              </h2>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="settings-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>{t('profile.restaurant_modal.labels.name')}
                <input className="soft-input" value={formNazwa} onChange={e => setFormNazwa(e.target.value)} />
              </label>
              <label>{t('profile.restaurant_modal.labels.description')}
                <textarea className="soft-input" rows={3} value={formOpis} onChange={e => setFormOpis(e.target.value)} />
              </label>
              <label>{t('profile.restaurant_modal.labels.address')}
                <input className="soft-input" value={formAdres} onChange={e => setFormAdres(e.target.value)} />
              </label>
              <label>{t('profile.restaurant_modal.labels.phone')}
                <input className="soft-input" type="number" value={formTel} onChange={e => setFormTel(e.target.value)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={formCzynne} onChange={e => setFormCzynne(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#60d3b4' }} />
                {t('profile.restaurant_modal.labels.is_open')}
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="secondary-button" onClick={() => setIsModalOpen(false)}>{t('profile.restaurant_modal.btn_cancel')}</button>
              <button className="mint-button" onClick={handleSaveRestaurant}>{t('profile.restaurant_modal.btn_save')}</button>
            </div>
          </div>
        </div>
      )}

      {isMenuModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 className="profile-modal-heading" style={{ margin: 0 }}>{t('profile.menu_modal.title')}</h2>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'inherit' }} onClick={() => setIsMenuModalOpen(false)}>×</button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', borderBottom: '2px solid rgba(184, 138, 118, 0.4)', paddingBottom: '15px' }}>
                {menuProducts.length === 0 ? (
                    <p className="profile-empty-text" style={{ textAlign: 'center' }}>{t('profile.menu_modal.empty')}</p>
                ) : (
                    menuProducts.map(prod => (
                        <div className="menu-product-item" key={prod.id_produkt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: '8px', borderRadius: '10px', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {prod.zdjecie && (
                                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={getAvatarUrl(prod.zdjecie)!} alt={prod.nazwa} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                )}
                                <div>
                                    <strong className="profile-menu-prod-name">{prod.nazwa}</strong> - {prod.cena} {t('restaurant.currency', 'zł')}
                                    <div style={{ fontSize: '0.8rem', color: prod.dostepny ? '#2e856e' : '#d93838' }}>
                                        {prod.dostepny ? t('profile.menu_modal.status_available') : t('profile.menu_modal.status_unavailable')} | {String(t(`categories.${prod.kategoria?.nazwa}`, prod.kategoria?.nazwa || ''))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <label className="secondary-button" style={{ padding: '5px 10px', fontSize: '0.82rem', cursor: 'pointer', margin: 0 }}>
                                    {t('profile.management.btn_photo')}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleUploadProductPhoto(prod.id_produkt, e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                                <button className="secondary-button" style={{ padding: '5px 10px', fontSize: '0.82rem' }} onClick={() => startEditProduct(prod)}>{t('profile.management.btn_edit')}</button>
                                <button className="secondary-button" style={{ padding: '5px 10px', fontSize: '0.82rem', background: '#ffcccc', color: '#cc0000', borderColor: '#ff9999' }}
                                        onClick={() =>
                                            setConfirmAction({
                                                message: t('profile.alerts.prod_delete_confirm'),
                                                action: () => handleDeleteProduct(prod.id_produkt)
                                            })
                                        }
                                >{t('profile.management.btn_delete')}</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <h4 className="profile-modal-subheading" style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>{prodMode === 'add' ? t('profile.menu_modal.section_add') : t('profile.menu_modal.section_edit', { name: prodNazwa })}</span>
                {prodMode === 'edit' && (
                    <button
                        className="secondary-button"
                        style={{
                            padding: '4px 12px',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: 600
                        }}
                        onClick={resetProductForm}
                    >
                        {t('profile.menu_modal.cancel_edit')}
                    </button>
                )}
            </h4>

            <div className="settings-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>{t('profile.menu_modal.labels.name')}
                <input className="soft-input" value={prodNazwa} onChange={e => setProdNazwa(e.target.value)} />
              </label>
              <label>{t('profile.menu_modal.labels.price')}
                <input className="soft-input" type="number" step="0.01" placeholder={t('profile.menu_modal.labels.price_placeholder')} value={prodCena} onChange={e => setProdCena(e.target.value)} />
              </label>
              <label>{t('profile.menu_modal.labels.category')}
                <select className="soft-input" value={prodKategoria} onChange={e => setProdKategoria(e.target.value)}>
                    {kategorie.map(k => <option key={k.id_kategoria} value={k.id_kategoria}>{String(t(`categories.${k.nazwa}`, k.nazwa))}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={prodDostepny} onChange={e => setProdDostepny(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#60d3b4' }} />
                {t('profile.menu_modal.labels.is_available')}
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="mint-button" onClick={handleSaveProduct}>
                {prodMode === 'add' ? t('profile.menu_modal.btn_add') : t('profile.menu_modal.btn_save')}
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