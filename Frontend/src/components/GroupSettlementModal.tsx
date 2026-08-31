import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ordersApi, getAvatarUrl } from '../api/apiClient';
import { useNotify } from './NotificationProvider';

interface GroupSettlementModalProps {
  orderId: number;
  onClose: () => void;
}

type OsobaPlacaca = {
  id_uzytkownik: number;
  imie: string;
  nazwisko: string;
  zdjecie_profilowe: string | null;
  numer_telefonu: number | null;
  kwota: number;
  czy_oplacone: boolean;
  jest_hostem: boolean;
};

type SettlementData = {
  id_zamowienia: number;
  kod_zaproszenia: string | null;
  kwota_calkowita: number;
  status_zamowienia: string;
  status_platnosci: string;
  host: {
    id_uzytkownik: number;
    imie: string;
    nazwisko: string;
    email: string;
    zdjecie_profilowe: string | null;
  };
  twoja_kwota: number;
  twoje_czy_oplacone: boolean;
  jestes_hostem: boolean;
  osoby_placace: OsobaPlacaca[];
};

export function GroupSettlementModal({ orderId, onClose }: GroupSettlementModalProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const [data, setData] = useState<SettlementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettlement = async () => {
    try {
      const response = await ordersApi.getOrderSettlement(orderId);
      setData(response.data);
    } catch (error: any) {
      notify(error.response?.data?.detail || t('settlement.fetch_error'), 'error');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, [orderId]);

  const handleTogglePaid = async (targetUserId: number) => {
    try {
      const res = await ordersApi.toggleSettlementPaid(orderId, targetUserId);
      notify(res.data.msg || t('settlement.status_updated'), 'success');
      fetchSettlement();
    } catch (error: any) {
      notify(error.response?.data?.detail || t('settlement.status_update_error'), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', textAlign: 'center' }}>
          <p>{t('settlement.loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{t('settlement.title')} #{data.id_zamowienia}</h2>
            {data.kod_zaproszenia && (
              <span className="settlement-code-badge">
                {t('settlement.code_label')}: <strong>{data.kod_zaproszenia}</strong>
              </span>
            )}
          </div>
          <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'inherit' }} onClick={onClose}>×</button>
        </div>

        <div className="settlement-host-card">
          <div className="settlement-host-avatar">
            {getAvatarUrl(data.host.zdjecie_profilowe) ? (
              <img src={getAvatarUrl(data.host.zdjecie_profilowe)!} alt={data.host.imie} />
            ) : (
              <span>{data.host.imie[0]}</span>
            )}
          </div>
          <div className="settlement-host-info">
            <strong>{t('settlement.host_label')}: {data.host.imie} {data.host.nazwisko}</strong>
            <p>{data.host.email}</p>
            {data.osoby_placace.find(o => o.jest_hostem)?.numer_telefonu && (
              <p className="settlement-blik-info">
                Tel: <strong>{data.osoby_placace.find(o => o.jest_hostem)?.numer_telefonu}</strong>
              </p>
            )}
          </div>
        </div>

        {!data.jestes_hostem && (
          <div className={`settlement-my-share-box ${data.twoje_czy_oplacone ? 'paid' : 'unpaid'}`}>
            <div>
              <span className="settlement-my-share-label">{t('settlement.my_share_label')}</span>
              <strong className="settlement-my-share-amount">{data.twoja_kwota.toFixed(2)} zł</strong>
            </div>
            <div className="settlement-my-share-status">
              {data.twoje_czy_oplacone ? (
                <span className="settlement-status-badge paid">🟢 {t('settlement.status_paid_by_host')}</span>
              ) : (
                <span className="settlement-status-badge unpaid">🟡 {t('settlement.status_pending_transfer')}</span>
              )}
            </div>
          </div>
        )}

        <h4 style={{ margin: '20px 0 10px 0', fontSize: '1.1rem' }}>{t('settlement.participants_breakdown')}</h4>
        <div className="settlement-list">
          {data.osoby_placace.map((osoba) => (
            <div key={osoba.id_uzytkownik} className="settlement-item-row">
              <div className="settlement-item-user">
                <div className="settlement-thumb-small">
                  {getAvatarUrl(osoba.zdjecie_profilowe) ? (
                    <img src={getAvatarUrl(osoba.zdjecie_profilowe)!} alt={osoba.imie} />
                  ) : (
                    <span>{osoba.imie[0]}</span>
                  )}
                </div>
                <div>
                  <strong>{osoba.imie} {osoba.nazwisko}</strong>
                  {osoba.jest_hostem && <span className="settlement-host-tag"> ({t('settlement.host_tag')})</span>}
                </div>
              </div>

              <div className="settlement-item-actions">
                <strong className="settlement-item-amount">{osoba.kwota.toFixed(2)} zł</strong>

                {data.jestes_hostem && !osoba.jest_hostem ? (
                  <button
                    className={`secondary-button settlement-toggle-btn ${osoba.czy_oplacone ? 'btn-paid' : 'btn-unpaid'}`}
                    onClick={() => handleTogglePaid(osoba.id_uzytkownik)}
                  >
                    {osoba.czy_oplacone ? t('settlement.btn_mark_unpaid') : t('settlement.btn_mark_paid')}
                  </button>
                ) : (
                  <span className={`settlement-status-tag ${osoba.czy_oplacone ? 'paid' : 'unpaid'}`}>
                    {osoba.czy_oplacone ? t('settlement.tag_paid') : t('settlement.tag_unpaid')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="mint-button" onClick={onClose}>
            {t('settlement.close_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
