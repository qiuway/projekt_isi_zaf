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

  // Stany dla Pop-upa (Modala)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentRestId, setCurrentRestId] = useState<number | null>(null);
  
  // Dane formularza wewnątrz Pop-upa
  const [formNazwa, setFormNazwa] = useState('');
  const [formOpis, setFormOpis] = useState('');
  const [formAdres, setFormAdres] = useState('');
  const [formTel, setFormTel] = useState('');
  const [formCzynne, setFormCzynne] = useState(false);

  const fetchProfileAndRestaurants = () => {
    if (!userId) return;
    
    // 1. Pobieranie danych profilu
    fetch(`http://127.0.0.1:8000/uzytkownik/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUserData(data);
        // 2. Jeśli to Właściciel (2) lub Admin (3), pobierz listę restauracji
        if (data.id_typ_konta === 2 || data.id_typ_konta === 3) {
          fetch(`http://127.0.0.1:8000/restauracje/zarzadzaj/${userId}`)
            .then(r => r.json())
            .then(rests => setManagedRestaurants(rests));
        }
      })
      .catch((err) => console.error('Błąd ładowania profilu:', err));
  };

  useEffect(() => {
    fetchProfileAndRestaurants();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    onNavigate('login');
  };

  // --- LOGIKA MODALA ---
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

    const url = modalMode === 'add' 
      ? `http://127.0.0.1:8000/restauracje/zarzadzaj/${userId}`
      : `http://127.0.0.1:8000/restauracje/zarzadzaj/${currentRestId}`;
      
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(modalMode === 'add' ? 'Dodano restaurację!' : 'Zapisano zmiany!');
      setIsModalOpen(false);
      fetchProfileAndRestaurants(); // Odśwież listę po zapisie
    } else {
      alert('Wystąpił błąd podczas zapisywania.');
    }
  };

  const handleDeleteRestaurant = async (restId: number) => {
    if(!window.confirm("Czy na pewno chcesz trwale usunąć tę restaurację?")) return;

    const res = await fetch(`http://127.0.0.1:8000/restauracje/zarzadzaj/${restId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchProfileAndRestaurants(); // Odśwież listę
    }
  };

  // Czy użytkownik ma uprawnienia do panelu zarządzania?
  const canManage = userData && (userData.id_typ_konta === 2 || userData.id_typ_konta === 3);
  const rolaTekst = userData?.id_typ_konta === 3 ? "Administrator" : userData?.id_typ_konta === 2 ? "Właściciel restauracji" : "Klient";

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
              <img 
                src={`http://127.0.0.1:8000${userData.zdjecie_profilowe}?t=${Date.now()}`} 
                alt="Awatar użytkownika" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <div className="avatar-head" />
                <div className="avatar-body" />
              </>
            )}
          </div>
          {/* Typ konta wyświetlany pod avatarem dla pewności */}
          <div style={{ marginTop: '10px', fontWeight: 'bold', color: '#6d4b3a', fontSize: '0.9rem' }}>
            Konto: {rolaTekst}
          </div>
        </div>

        <div className="profile-info">
          {userData ? (
            <>
              <div className="profile-line"><span>Imię i nazwisko</span><strong>{userData.imie} {userData.nazwisko}</strong></div>
              <div className="profile-line"><span>Email</span><strong>{userData.email}</strong></div>
              <div className="profile-line"><span>Numer telefonu</span><strong>{userData.numer_telefonu ? userData.numer_telefonu : 'Brak danych'}</strong></div>
              <div className="profile-line"><span>Adres dostawy</span><strong>{userData.adres ? userData.adres : 'Brak danych'}</strong></div>
            </>
          ) : (
            <p>Ładowanie danych...</p>
          )}

          <div className="profile-actions">
            <button className="secondary-button" onClick={() => onNavigate('settings')}>
              EDYTUJ PROFIL
            </button>
            <button className="mint-button logout-button" onClick={handleLogout}>
              WYLOGUJ
            </button>
          </div>
        </div>
      </section>

      {/* --- SEKCJA ZARZĄDZANIA RESTAURACJAMI (Tylko Admin i Właściciel) --- */}
      {canManage && (
        <section className="management-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#5d4537', margin: 0 }}>
              {userData.id_typ_konta === 3 ? "Wszystkie Restauracje (Tryb Admina)" : "Zarządzanie Twoimi Restauracjami"}
            </h2>
            <button className="mint-button" onClick={openModalForAdd}>+ Dodaj restaurację</button>
          </div>

          {managedRestaurants.length === 0 ? (
            <p>Brak restauracji do wyświetlenia.</p>
          ) : (
            managedRestaurants.map(rest => (
              <div key={rest.id_restauracja} className="restaurant-list-item">
                <div>
                  <strong>{rest.nazwa}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    {rest.czynne ? '🟢 Otwarte' : '🔴 Zamknięte'} | {rest.adres}
                  </div>
                </div>
                <div className="restaurant-list-actions">
                  <button className="secondary-button" onClick={() => openModalForEdit(rest)}>Edytuj</button>
                  <button className="secondary-button" style={{ background: '#ffcccc', color: '#cc0000', borderColor: '#ff9999' }} onClick={() => handleDeleteRestaurant(rest.id_restauracja)}>
                    Usuń
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* --- POP-UP (MODAL) DO DODAWANIA I EDYCJI --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#5d4537' }}>
                {modalMode === 'add' ? 'Dodaj nową restaurację' : 'Edytuj restaurację'}
              </h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="settings-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label>
                Nazwa Restauracji *
                <input className="soft-input" value={formNazwa} onChange={e => setFormNazwa(e.target.value)} />
              </label>
              <label>
                Opis
                <textarea className="soft-input" rows={3} value={formOpis} onChange={e => setFormOpis(e.target.value)} />
              </label>
              <label>
                Adres
                <input className="soft-input" value={formAdres} onChange={e => setFormAdres(e.target.value)} />
              </label>
              <label>
                Numer telefonu
                <input className="soft-input" type="number" value={formTel} onChange={e => setFormTel(e.target.value)} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input 
                  type="checkbox" 
                  checked={formCzynne} 
                  onChange={e => setFormCzynne(e.target.checked)} 
                  style={{ width: '20px', height: '20px', accentColor: '#60d3b4' }}
                />
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
    </div>
  );
}