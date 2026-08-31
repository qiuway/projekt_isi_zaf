import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../types';
import { TopBar } from './TopBar';
import { restaurantsApi, productsApi, cartApi, reviewsApi, getAvatarUrl } from '../api/apiClient';
import { useNotify } from './NotificationProvider';
import { ConfirmationProvider } from './ConfirmationProvider';

interface RestaurantScreenProps {
    onNavigate: (screen: Screen) => void;
}

type ReviewItem = {
    id_opinia: number;
    id_uzytkownik: number;
    id_restauracja: number;
    ocena: number;
    komentarz: string | null;
    autor_nazwa: string;
    autor_awatar: string | null;
};

type ReviewsSummary = {
    id_restauracja: number;
    srednia_ocen: number;
    liczba_opinii: number;
    opinie: ReviewItem[];
};

export function RestaurantScreen({ onNavigate }: RestaurantScreenProps) {
    const { t } = useTranslation();
    const notify = useNotify();
    const restId = localStorage.getItem('currentRestId');
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    const currentUserRole = Number(localStorage.getItem('role') || '1');

    const [restauracja, setRestauracja] = useState<any>(null);
    const [produkty, setProdukty] = useState<any[]>([]);
    const [reviewsData, setReviewsData] = useState<ReviewsSummary | null>(null);

    const [newRating, setNewRating] = useState<number>(5);
    const [newComment, setNewComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [confirmAction, setConfirmAction] = useState<null | {
        message: string;
        action: () => void;
    }>(null);

    const dodajDoKoszyka = async (idProduktu: number) => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            notify(t('restaurant.alerts.cart_auth_error'));
            return;
        }

        const activeGroup = localStorage.getItem('activeGroupCode');

        try {
            if (activeGroup) {
                await cartApi.addGroupItem(activeGroup, idProduktu, 1);
                notify(t('restaurant.alerts.add_group_success', 'Dodano do koszyka grupowego!'));
            } else {
                await cartApi.addItem(userId, idProduktu, 1);
                notify(t('restaurant.alerts.add_success'));
            }

            window.dispatchEvent(new Event('koszykChanged'));
        } catch (error: any) {
            notify(
                error.response?.data?.detail ||
                t('restaurant.alerts.server_error')
            );
        }
    };

    const fetchReviews = useCallback((restaurantId: string | number) => {
        reviewsApi.getRestaurantReviews(restaurantId)
            .then((res) => setReviewsData(res.data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (!restId) return;

        restaurantsApi.getById(restId)
            .then((response) => setRestauracja(response.data))
            .catch((err) => console.error(err));

        productsApi.getByRestaurant(restId)
            .then((response) => setProdukty(response.data))
            .catch((err) => console.error(err));

        fetchReviews(restId);
    }, [restId, fetchReviews]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserId) {
            notify(t('reviews.auth_required'), 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await reviewsApi.addReview(restId!, {
                id_uzytkownik: currentUserId,
                ocena: newRating,
                komentarz: newComment.trim() || undefined,
            });
            notify(t('reviews.success_added'), 'success');
            setNewComment('');
            fetchReviews(restId!);
        } catch (err: any) {
            notify(err.response?.data?.detail || t('reviews.save_error'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReview = (reviewId: number) => {
        setConfirmAction({
            message: t('reviews.confirm_delete'),
            action: async () => {
                try {
                    await reviewsApi.deleteReview(reviewId);
                    notify(t('reviews.success_deleted'), 'success');
                    fetchReviews(restId!);
                } catch (err: any) {
                    notify(err.response?.data?.detail || t('reviews.delete_error'), 'error');
                }
            },
        });
    };

    if (!restauracja) {
        return (
            <div className="page-shell">
                <TopBar onNavigate={onNavigate} />
                <h2 style={{ textAlign: 'center' }}>{t('restaurant.loading')}</h2>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <TopBar onNavigate={onNavigate} />

            <div className="single-ribbon-wrap">
                <div className="section-ribbon blue-ribbon large-ribbon">
                    {restauracja.nazwa.toUpperCase()}
                </div>
            </div>

            <section className="settings-content" style={{ marginTop: '20px' }}>
                {restauracja.opis && (
                    <div className="restaurant-page-description-wrap">
                        <strong className="restaurant-page-label">{t('restaurant.description_label', 'Opis:')}</strong>
                        <p className="restaurant-page-description">{restauracja.opis}</p>
                    </div>
                )}
                <div className="restaurant-page-details-wrap">
                    <p className="restaurant-page-contact">
                        <strong>{t('restaurant.address_label', 'Adres:')}</strong> {restauracja.adres}
                        {restauracja.numer_telefonu && (
                            <span> | <strong>{t('restaurant.phone_label', 'Telefon:')}</strong> {restauracja.numer_telefonu}</span>
                        )}
                    </p>
                    <p className="restaurant-page-status">
                        {restauracja.czynne ? `${t('restaurant.status_open')}` : `${t('restaurant.status_closed')}`}
                        {reviewsData && reviewsData.liczba_opinii > 0 && (
                            <span> | ⭐ <strong>{reviewsData.srednia_ocen.toFixed(1)}</strong> ({reviewsData.liczba_opinii} {reviewsData.liczba_opinii === 1 ? 'opinia' : 'opinii'})</span>
                        )}
                    </p>
                </div>

                <h3 className="restaurant-menu-heading">
                    {t('restaurant.menu_title')}
                </h3>

                {produkty.length === 0 ? (
                    <p className="restaurant-empty-menu-text">{t('restaurant.empty_menu')}</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {produkty.map((prod) => (
                            <div
                                className="restaurant-menu-item"
                                key={prod.id_produkt}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    gap: '15px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {prod.zdjecie && (
                                        <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img
                                                src={getAvatarUrl(prod.zdjecie)!}
                                                alt={prod.nazwa}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <strong className="restaurant-prod-name">
                                            {prod.nazwa}
                                        </strong>

                                        <span className="restaurant-prod-category">
                                            {t('restaurant.category', {
                                                category: prod.kategoria?.nazwa || t('restaurant.none'),
                                            })}
                                        </span>

                                        {!prod.dostepny && (
                                            <span
                                                style={{
                                                    color: '#d93838',
                                                    fontSize: '0.85em',
                                                    marginTop: '4px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {t('restaurant.unavailable')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <strong
                                        style={{
                                            color: '#60d3b4',
                                            fontSize: '1.3em',
                                            marginRight: '15px',
                                        }}
                                    >
                                        {prod.cena} {t('restaurant.currency')}
                                    </strong>

                                    <button
                                        className="mint-button"
                                        style={{ padding: '8px 16px' }}
                                        disabled={!prod.dostepny}
                                        onClick={() => dodajDoKoszyka(prod.id_produkt)}
                                    >
                                        {t('restaurant.add_button')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <section className="reviews-section">
                    <h3 className="restaurant-reviews-heading">
                        {t('reviews.title')}
                    </h3>

                    {reviewsData && (
                        <div className="reviews-summary-bar">
                            <div className="reviews-score-badge">
                                <span>⭐</span>
                                <span>{reviewsData.srednia_ocen > 0 ? reviewsData.srednia_ocen.toFixed(1) : '-'} / 5</span>
                                <span className="reviews-count-text">
                                    ({reviewsData.liczba_opinii} {reviewsData.liczba_opinii === 1 ? 'opinia' : 'opinii'})
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="review-form-card">
                        <h4>{t('reviews.add_review_title')}</h4>
                        <form onSubmit={handleReviewSubmit}>
                            <div className="star-picker-wrap">
                                <span>{t('reviews.your_rating')}</span>
                                <div className="star-picker">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            className={`star-btn ${star <= newRating ? 'filled' : 'empty'}`}
                                            onClick={() => setNewRating(star)}
                                            aria-label={`${star} gwiazdek`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                className="soft-input review-textarea"
                                placeholder={t('reviews.comment_placeholder')}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />

                            <button
                                type="submit"
                                className="mint-button"
                                disabled={isSubmitting}
                                style={{ padding: '8px 20px' }}
                            >
                                {t('reviews.btn_submit')}
                            </button>
                        </form>
                    </div>

                    {reviewsData && reviewsData.opinie.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '20px 0' }}>
                            {t('reviews.no_reviews')}
                        </p>
                    ) : (
                        <div className="reviews-list">
                            {reviewsData?.opinie.map((rev) => (
                                <div key={rev.id_opinia} className="review-card">
                                    <div className="review-card-top">
                                        <div className="review-author-info">
                                            <div className="review-avatar">
                                                {getAvatarUrl(rev.autor_awatar) ? (
                                                    <img
                                                        src={getAvatarUrl(rev.autor_awatar)!}
                                                        alt="Avatar"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    '👤'
                                                )}
                                            </div>
                                            <div>
                                                <div className="review-author-name">{rev.autor_nazwa}</div>
                                                <div className="review-stars-display">
                                                    {'★'.repeat(rev.ocena)}{'☆'.repeat(5 - rev.ocena)}
                                                </div>
                                            </div>
                                        </div>

                                        {(currentUserId === rev.id_uzytkownik || currentUserRole === 3) && (
                                            <button
                                                className="secondary-button admin-btn-delete"
                                                onClick={() => handleDeleteReview(rev.id_opinia)}
                                            >
                                                {t('reviews.btn_delete')}
                                            </button>
                                        )}
                                    </div>

                                    {rev.komentarz && (
                                        <p className="review-comment-text">{rev.komentarz}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </section>

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