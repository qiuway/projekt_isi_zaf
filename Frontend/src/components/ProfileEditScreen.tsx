import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TopBar } from './TopBar';
import { apiClient } from '../api/apiClient';

interface ProfileEditScreenProps {
    onNavigate: (screen: string) => void;
}

export function ProfileEditScreen({ onNavigate }: ProfileEditScreenProps) {
    const { t } = useTranslation();
    const [imie, setImie] = useState('');
    const [nazwisko, setNazwisko] = useState('');
    const [email, setEmail] = useState('');
    const [telefon, setTelefon] = useState('');
    const [adres, setAdres] = useState('');
    const [zdjecie, setZdjecie] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const userId = localStorage.getItem('userId');

    const fetchUserData = () => {
        if (!userId) return;

        apiClient.get(`/uzytkownik/${userId}`)
            .then((response) => {
                const data = response.data;

                setImie(data.imie || '');
                setNazwisko(data.nazwisko || '');
                setEmail(data.email || '');
                setTelefon(data.numer_telefonu ? String(data.numer_telefonu) : '');
                setAdres(data.adres || '');
                setZdjecie(data.zdjecie_profilowe || null);
            })
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const handleSaveTextData = async () => {
        if (!userId) {
            alert(t('profile_edit.alerts.no_user'));
            return;
        }

        const payload = {
            imie,
            nazwisko,
            email,
            numer_telefonu: telefon ? parseInt(telefon) : null,
            adres: adres || null,
        };

        try {
            await apiClient.put(`/uzytkownik/${userId}`, payload);

            alert(t('profile_edit.alerts.save_success'));
            onNavigate('profile');
        } catch (error: any) {
            console.error(error);

            alert(
                error.response?.data?.detail ||
                t('profile_edit.alerts.server_error')
            );
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (!files || files.length === 0 || !userId) {
            return;
        }

        const fileToUpload = files[0];
        const formData = new FormData();
        formData.append('file', fileToUpload);

        try {
            await apiClient.post(`/uzytkownik/${userId}/avatar`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            fetchUserData();
        } catch (error: any) {
            console.error('Błąd sieciowy:', error);

            alert(
                error.response?.data?.detail ||
                t('profile_edit.alerts.upload_error')
            );
        }
    };

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">{t('profile_edit.title')}</div>
            </div>

            <section className="settings-content">
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginBottom: '30px',
                    }}
                >
                    <div
                        className="avatar-circle"
                        style={{
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '15px',
                        }}
                    >
                        {zdjecie ? (
                            <img
                                src={`http://127.0.0.1:8000${zdjecie}?t=${Date.now()}`}
                                alt={t('profile_edit.avatar_alt')}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <>
                                <div className="avatar-head" />
                                <div className="avatar-body" />
                            </>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    <button
                        className="secondary-button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {t('profile_edit.change_photo')}
                    </button>
                </div>

                <h3
                    style={{
                        borderBottom: '1px solid #dccbbd',
                        paddingBottom: '10px',
                        marginBottom: '20px',
                        color: '#5d4537',
                    }}
                >
                    {t('profile_edit.user_data')}
                </h3>

                <div className="settings-form-grid">
                    <label>
                        {t('profile_edit.labels.first_name')}
                        <input
                            className="soft-input"
                            value={imie}
                            onChange={(e) => setImie(e.target.value)}
                        />
                    </label>

                    <label>
                        {t('profile_edit.labels.last_name')}
                        <input
                            className="soft-input"
                            value={nazwisko}
                            onChange={(e) => setNazwisko(e.target.value)}
                        />
                    </label>

                    <label>
                        {t('profile_edit.labels.email')}
                        <input
                            className="soft-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>

                    <label>
                        {t('profile_edit.labels.phone')}
                        <input
                            className="soft-input"
                            type="number"
                            placeholder={t('profile_edit.placeholders.phone')}
                            value={telefon}
                            onChange={(e) => setTelefon(e.target.value)}
                        />
                    </label>

                    <label style={{ gridColumn: '1 / -1' }}>
                        {t('profile_edit.labels.address')}
                        <input
                            className="soft-input"
                            placeholder={t('profile_edit.placeholders.address')}
                            value={adres}
                            onChange={(e) => setAdres(e.target.value)}
                        />
                    </label>
                </div>

                <div className="settings-actions" style={{ marginTop: '30px' }}>
                    <button className="secondary-button" onClick={() => onNavigate('profile')}>
                        {t('profile_edit.buttons.cancel')}
                    </button>

                    <button className="mint-button" onClick={handleSaveTextData}>
                        {t('profile_edit.buttons.save')}
                    </button>
                </div>
            </section>
        </div>
    );
}