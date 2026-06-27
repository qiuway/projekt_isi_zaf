import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { TopBar } from './TopBar';

interface RestaurantScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function RestaurantScreen({ onNavigate }: RestaurantScreenProps) {
  const restId = localStorage.getItem('currentRestId');
  const [restauracja, setRestauracja] = useState<any>(null);
  const [produkty, setProdukty] = useState<any[]>([]);
    const dodajDoKoszyka = async (idProduktu: number) => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert('Musisz być zalogowany, aby dodać produkt do koszyka.');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/koszyk/dodaj', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_uzytkownik: Number(userId),
                    id_produkt: idProduktu,
                    ilosc: 1,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Dodano produkt do koszyka.');
                window.dispatchEvent(new Event('koszykChanged'));
            } else {
                alert(data.detail || 'Nie udało się dodać produktu do koszyka.');
            }
        } catch (error) {
            alert('Błąd połączenia z serwerem.');
        }
    };
  useEffect(() => {
    if (!restId) return;

    fetch(`http://127.0.0.1:8000/restauracja/${restId}`)
      .then(r => r.json())
      .then(data => setRestauracja(data));

    fetch(`http://127.0.0.1:8000/restauracja/${restId}/produkty`)
      .then(r => r.json())
      .then(data => setProdukty(data));
  }, [restId]);

  if (!restauracja) {
    return <div className="page-shell"><TopBar onNavigate={onNavigate} /><h2 style={{textAlign: 'center'}}>Wczytywanie restauracji...</h2></div>;
  }

  return (
    <div className="page-shell">
      <TopBar onNavigate={onNavigate} />

      <div className="single-ribbon-wrap">
        <div className="section-ribbon blue-ribbon large-ribbon">{restauracja.nazwa.toUpperCase()}</div>
      </div>

      <section className="settings-content" style={{ marginTop: '20px' }}>
         <p style={{ fontStyle: 'italic', color: '#5d4537' }}>{restauracja.opis}</p>
         <p> {restauracja.adres} | {restauracja.numer_telefonu}</p>
         <p>{restauracja.czynne ? ' Aktualnie otwarte' : ' Aktualnie zamknięte'}</p>

         <h3 style={{ borderBottom: '2px solid #dccbbd', paddingBottom: '10px', marginTop: '30px', color: '#5d4537' }}>Menu Restauracji</h3>

         {produkty.length === 0 ? (
            <p>Ta restauracja nie ma jeszcze dodanych dań.</p>
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             {produkty.map(prod => (
                <div key={prod.id_produkt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                   
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <strong style={{ fontSize: '1.1em', color: '#333' }}>{prod.nazwa}</strong> 
                     <span style={{ fontSize: '0.85em', color: '#888', marginTop: '4px' }}>
                       Kategoria: {prod.kategoria?.nazwa || 'Brak'}
                     </span>
                     {!prod.dostepny && <span style={{ color: '#d93838', fontSize: '0.85em', marginTop: '4px', fontWeight: 'bold' }}>Chwilowo niedostępne</span>}
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center' }}>
                     <strong style={{ color: '#60d3b4', fontSize: '1.3em', marginRight: '15px' }}>{prod.cena} zł</strong>

                       <button
                           className="mint-button"
                           style={{ padding: '8px 16px' }}
                           disabled={!prod.dostepny}
                           onClick={() => dodajDoKoszyka(prod.id_produkt)}
                       >
                           + Dodaj
                       </button>
                   </div>

                </div>
             ))}
           </div>
         )}
      </section>
    </div>
  );
}