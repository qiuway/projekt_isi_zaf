import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
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
    fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUserData(data);
        if (data.id_typ_konta === 2 || data.id_typ_konta === 3) {
          fetch(`http://127.0.0.1:8000/restauracje/zarzadzaj/${userId}`)
            .then(r => r.json())
            .then(rests => setManagedRestaurants(rests));
            
          fetch(`http://127.0.0.1:8000/kategorie`)
            .then(r => r.json())
            .then(kat => {
                setKategorie(kat);
                if (kat.length > 0) setProdKategoria(String(kat[0].id_kategoria));
            });
        }
      });
  };

  useEffect(() => {
    fetchProfileAndRestaurants();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
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

  const handleSaveRestaurant = async () => {
    const payload = { 
        nazwa: formNazwa, 
        opis: formOpis || null, 
        adres: formAdres || null, 
        numer_telefonu: formTel ? parseInt(formTel) : null, 
        czynne: formCzynne 
    };
    const url = modalMode === 'add' ? `http://127.0.0.1:8000/restauracje/zarzadzaj/${userId}` : `http://127.0.0.1:8000/restauracje/zarzadzaj/${currentRestId}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';
    
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      alert(modalMode === 'add' ? 'Dodano restaurację!' : 'Zapisano zmiany!');
      setIsModalOpen(false); 
      fetchProfileAndRestaurants();
    }
  };

  const handleDeleteRestaurant = async (restId: number) => {
    if(!window.confirm("Usunąć restaurację?")) return;
    const res = await fetch(`http://127.0.0.1:8000/restauracje/zarzadzaj/${restId}`, { method: 'DELETE' });
    if (res.ok) fetchProfileAndRestaurants();
  };

  const fetchMenuProducts = (restId: number) => {
    fetch(`http://127.0.0.1:8000/restauracja/${restId}/produkty`)
        .then(r => r.json())
        .then(data => setMenuProducts(data));
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
    if(!prodNazwa || !prodCena || !prodKategoria) return alert("Wypełnij wymagane pola!");
    
    const payload = {
        nazwa: prodNazwa,
        cena: parseFloat(prodCena),
        id_kategoria: parseInt(prodKategoria),
        dostepny: prodDostepny
    };

    const url = prodMode === 'add' 
        ? `http://127.0.0.1:8000/restauracja/${currentRestId}/produkty`
        : `http://127.0.0.1:8000/produkty/${currentProdId}`;
    
    const method = prodMode === 'add' ? 'POST' : 'PUT';

    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        fetchMenuProducts(currentRestId!);
        resetProductForm();
    } else {
        alert('Błąd podczas zapisywania produktu.');
    }
  };

  const handleDeleteProduct = async (prodId: number) => {
    if(!window.confirm("Usunąć ten produkt z menu?")) return;
    const res = await fetch(`http://127.0.0.1:8000/produkty/${prodId}`, { method: 'DELETE' });
    if (res.ok) fetchMenuProducts(currentRestId!);
  };

  const canManage = userData && (userData.id_typ_konta === 2 || userData.id_typ_konta === 3);

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">MÓJ PROFIL</div>
      </div>

      <section className="profile-card">
        <div className="avatar-column">
          <div className="avatar-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {userData?.zdjecie_profilowe ? (
              <img src={`http://127.0.0.1:8000${userData.zdjecie_profilowe}?t=${Date.now()}`} alt="Awatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <><div className="avatar-head" /><div className="avatar-body" /></>
            )}
          </div>
          <div style={{ marginTop: '10px', fontWeight: 'bold', color: '#6d4b3a', fontSize: '0.9rem' }}>
            Konto: {userData?.id_typ_konta === 3 ? "Admin" : userData?.id_typ_konta === 2 ? "Właściciel" : "Klient"}
          </div>
        </div>

        <div className="profile-info">
          {userData ? (
            <>
              <div className="profile-line"><span>Imię i nazwisko</span><strong>{userData.imie} {userData.nazwisko}</strong></div>
              <div className="profile-line"><span>Email</span><strong>{userData.email}</strong></div>
              <div className="profile-line"><span>Numer telefonu</span><strong>{userData.numer_telefonu || 'Brak'}</strong></div>
              <div className="profile-line"><span>Adres</span><strong>{userData.adres || 'Brak'}</strong></div>
            </>
          ) : <p>Ładowanie...</p>}
          <div className="profile-actions">
            <button className="secondary-button" onClick={() => onNavigate('profileEdit')}>EDYTUJ PROFIL</button>
            <button className="mint-button logout-button" onClick={handleLogout}>WYLOGUJ</button>
          </div>
        </div>
      </section>

      {canManage && (
        <section className="management-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#5d4537', margin: 0 }}>Zarządzanie Restauracjami</h2>
            <button className="mint-button" onClick={openModalForAdd}>+ Dodaj restaurację</button>
          </div>
          {managedRestaurants.map(rest => (
            <div key={rest.id_restauracja} className="restaurant-list-item">
              <div>
                <strong>{rest.nazwa}</strong>
                <div style={{ fontSize: '0.85rem', color: '#888' }}>{rest.czynne ? '🟢 Otwarte' : '🔴 Zamknięte'} | {rest.adres}</div>
              </div>
              <div className="restaurant-list-actions">
                <button className="secondary-button" style={{ background: '#e0f7fa', borderColor: '#b2ebf2' }} onClick={() => openMenuModal(rest.id_restauracja)}>
                  📋 Menu
                </button>
                <button className="secondary-button" onClick={() => openModalForEdit(rest)}>Edytuj</button>
                <button className="secondary-button" style={{ background: '#ffcccc', color: '#cc0000', borderColor: '#ff9999' }} onClick={() => handleDeleteRestaurant(rest.id_restauracja)}>Usuń</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{modalMode === 'add' ? 'Nowa restauracja' : 'Edytuj restaurację'}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="settings-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>Nazwa Restauracji * <input className="soft-input" value={formNazwa} onChange={e => setFormNazwa(e.target.value)} /></label>
              <label>Opis <textarea className="soft-input" rows={3} value={formOpis} onChange={e => setFormOpis(e.target.value)} /></label>
              <label>Adres <input className="soft-input" value={formAdres} onChange={e => setFormAdres(e.target.value)} /></label>
              <label>Numer telefonu <input className="soft-input" type="number" value={formTel} onChange={e => setFormTel(e.target.value)} /></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={formCzynne} onChange={e => setFormCzynne(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#60d3b4' }} />
                Restauracja aktualnie otwarta
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
              <button className="secondary-button" onClick={() => setIsModalOpen(false)}>Anuluj</button>
              <button className="mint-button" onClick={handleSaveRestaurant}>Zapisz</button>
            </div>
          </div>
        </div>
      )}

      {isMenuModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#5d4537' }}>Zarządzanie Menu</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsMenuModalOpen(false)}>×</button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', borderBottom: '2px solid #dccbbd', paddingBottom: '15px' }}>
                {menuProducts.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Brak produktów w menu. Dodaj pierwszy poniżej!</p>
                ) : (
                    menuProducts.map(prod => (
                        <div key={prod.id_produkt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '10px', marginBottom: '8px', borderRadius: '5px', border: '1px solid #e0e0e0' }}>
                            <div>
                                <strong>{prod.nazwa}</strong> - {prod.cena} zł
                                <div style={{ fontSize: '0.8rem', color: prod.dostepny ? 'green' : 'red' }}>
                                    {prod.dostepny ? 'Dostępne' : 'Niedostępne'} | {prod.kategoria?.nazwa}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button className="secondary-button" style={{ padding: '5px 10px', fontSize: '0.85rem' }} onClick={() => startEditProduct(prod)}>Edytuj</button>
                                <button className="secondary-button" style={{ padding: '5px 10px', fontSize: '0.85rem', background: '#ffcccc', color: '#cc0000', borderColor: '#ff9999' }} onClick={() => handleDeleteProduct(prod.id_produkt)}>Usuń</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <h4 style={{ margin: '0 0 15px 0', color: '#5d4537' }}>
                {prodMode === 'add' ? 'Dodaj nowe danie' : `Edytujesz: ${prodNazwa}`}
                {prodMode === 'edit' && <button style={{ marginLeft: '15px', fontSize: '0.8rem', cursor: 'pointer' }} onClick={resetProductForm}>Anuluj edycję</button>}
            </h4>

            <div className="settings-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>Nazwa dania *
                <input className="soft-input" value={prodNazwa} onChange={e => setProdNazwa(e.target.value)} />
              </label>
              <label>Cena (zł) *
                <input className="soft-input" type="number" step="0.01" placeholder="np. 25.50" value={prodCena} onChange={e => setProdCena(e.target.value)} />
              </label>
              <label>Kategoria *
                <select className="soft-input" value={prodKategoria} onChange={e => setProdKategoria(e.target.value)}>
                    {kategorie.map(k => <option key={k.id_kategoria} value={k.id_kategoria}>{k.nazwa}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" checked={prodDostepny} onChange={e => setProdDostepny(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#60d3b4' }} />
                Danie jest aktualnie dostępne
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="mint-button" onClick={handleSaveProduct}>
                {prodMode === 'add' ? 'Dodaj do menu' : 'Zapisz zmiany w daniu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}