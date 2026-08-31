import axios from 'axios';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAvatarUrl = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string' || !url.trim()) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const backendBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendBase}${cleanPath}`;
};

export const isTokenExpired = (token: string | null): boolean => {
    if (!token || token === 'null' || token === 'undefined') return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp) return false;
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
};

export const clearAuthSession = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('punkty');
    localStorage.removeItem('role');
    localStorage.removeItem('currentScreen');
    localStorage.removeItem('restaurantOrdersRestId');
    localStorage.removeItem('restaurantOrdersRestName');
};

let isLoggingOut = false;

export const logoutUser = (reason?: string) => {
    if (isLoggingOut) return;
    isLoggingOut = true;
    clearAuthSession();

    window.dispatchEvent(new CustomEvent('sessionExpired', {
        detail: {
            message: reason || 'Twoja sesja wygasła. Zaloguj się ponownie.'
        }
    }));

    setTimeout(() => {
        isLoggingOut = false;
    }, 1000);
};

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && token !== 'undefined' && token !== 'null') {
            if (isTokenExpired(token)) {
                logoutUser();
                return Promise.reject(new axios.Cancel('Sesja wygasła.'));
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('401 Unauthorized - sesja wygasła lub brak uprawnień.');
            const token = localStorage.getItem('token');
            if (token) {
                logoutUser(error.response?.data?.detail);
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (payload: { email: string; haslo: string }) =>
        apiClient.post('/logowanie', payload),

    register: (payload: { imie: string; nazwisko: string; email: string; haslo: string; is_owner: boolean }) =>
        apiClient.post('/rejestracja', payload),

    getGoogleLoginUrl: () => {
        const baseUrl = apiClient.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${baseUrl}/auth/google/login`;
    },
};

export const userApi = {
    getProfile: (userId: number | string) =>
        apiClient.get(`/uzytkownik/${userId}`),

    getMyProfile: () =>
        apiClient.get('/uzytkownik/me/profil'),

    getPoints: (userId: number | string) =>
        apiClient.get(`/uzytkownik/${userId}/punkty`),

    updateProfile: (userId: number | string, data: { imie: string; nazwisko: string; email: string; numer_telefonu?: number | null; adres?: string | null }) =>
        apiClient.put(`/uzytkownik/${userId}`, data),

    uploadAvatar: (userId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/uzytkownik/${userId}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const restaurantsApi = {
    getAll: () =>
        apiClient.get('/restauracje/'),

    getById: (restId: number | string) =>
        apiClient.get(`/restauracja/${restId}`),

    getManaged: (userId: number | string) =>
        apiClient.get(`/restauracje/zarzadzaj/${userId}`),

    create: (userId: number | string, data: { nazwa: string; opis?: string; adres?: string; numer_telefonu?: number | null; czynne?: boolean }) =>
        apiClient.post(`/restauracje/zarzadzaj/${userId}`, data),

    update: (restId: number | string, data: { nazwa: string; opis?: string; adres?: string; numer_telefonu?: number | null; czynne?: boolean }) =>
        apiClient.put(`/restauracje/zarzadzaj/${restId}`, data),

    delete: (restId: number | string) =>
        apiClient.delete(`/restauracje/zarzadzaj/${restId}`),
};

export const productsApi = {
    getCategories: () =>
        apiClient.get('/kategorie'),

    getByRestaurant: (restId: number | string) =>
        apiClient.get(`/restauracja/${restId}/produkty`),

    create: (restId: number | string, data: { nazwa: string; cena: number; id_kategoria: number; dostepny?: boolean }) =>
        apiClient.post(`/restauracja/${restId}/produkty`, data),

    update: (prodId: number | string, data: { nazwa: string; cena: number; id_kategoria: number; dostepny?: boolean }) =>
        apiClient.put(`/produkty/${prodId}`, data),

    uploadPhoto: (prodId: number | string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/produkty/${prodId}/zdjecie`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    delete: (prodId: number | string) =>
        apiClient.delete(`/produkty/${prodId}`),
};

export const cartApi = {
    getCart: (userId: number | string) =>
        apiClient.get(`/koszyk/${userId}`),

    addItem: (userId: number | string, productId: number, quantity: number = 1, zastapKoszyk: boolean = false) =>
        apiClient.post('/koszyk/dodaj', {
            id_uzytkownik: Number(userId),
            id_produkt: productId,
            ilosc: quantity,
            zastap_koszyk: zastapKoszyk,
        }),

    updateItem: (userId: number | string, productId: number, quantity: number) =>
        apiClient.put('/koszyk/aktualizuj', {
            id_uzytkownik: Number(userId),
            id_produkt: productId,
            ilosc: quantity,
        }),

    createGroupCart: () =>
        apiClient.post('/koszyk/grupa/utworz'),

    joinGroupCart: (groupCode: string) =>
        apiClient.post('/koszyk/grupa/dolacz', { kod_grupy: groupCode }),

    getGroupCart: (groupCode: string) =>
        apiClient.get(`/koszyk/grupa/${groupCode}`),

    addGroupItem: (groupCode: string, productId: number, quantity: number = 1, zastapKoszyk: boolean = false) =>
        apiClient.post(`/koszyk/grupa/${groupCode}/dodaj`, {
            id_produkt: productId,
            ilosc: quantity,
            zastap_koszyk: zastapKoszyk,
        }),

    updateGroupItem: (groupCode: string, positionId: number, quantity: number) =>
        apiClient.put(`/koszyk/grupa/${groupCode}/pozycja`, {
            id_pozycja_koszyka: positionId,
            ilosc: quantity,
        }),

    leaveGroupCart: (groupCode: string) =>
        apiClient.post(`/koszyk/grupa/${groupCode}/opusc`),
};

export const ordersApi = {
    createOrder: (payload: {
        id_uzytkownik: number;
        id_restauracja: number;
        pozycje: { id_produkt: number; ilosc: number }[];
        czy_skladka: boolean;
        uczestnicy_skladki?: { id_uzytkownik: number; kwota_deklarowana: number }[] | null;
        typ_platnosci: string;
        id_posiadany_kupon?: number | null;
    }) => apiClient.post('/zamowienia/', payload),

    getUserOrders: (userId: number | string) =>
        apiClient.get(`/uzytkownik/${userId}/zamowienia`),

    getRestaurantOrders: (restId: number | string) =>
        apiClient.get(`/restauracja/${restId}/zamowienia`),

    acceptOrder: (orderId: number | string) =>
        apiClient.put(`/zamowienia/${orderId}/przyjmij`),

    rejectOrder: (orderId: number | string) =>
        apiClient.put(`/zamowienia/${orderId}/odrzuc`),

    setInDelivery: (orderId: number | string) =>
        apiClient.put(`/zamowienia/${orderId}/w_dostawie`),

    setDelivered: (orderId: number | string) =>
        apiClient.put(`/zamowienia/${orderId}/dostarczono`),

    acceptPayment: (orderId: number | string) =>
        apiClient.put(`/zamowienia/${orderId}/zaakceptuj-platnosc`),

    getOrderSettlement: (orderId: number | string) =>
        apiClient.get(`/zamowienia/${orderId}/rozliczenie`),

    toggleSettlementPaid: (orderId: number | string, targetUserId: number | string) =>
        apiClient.put(`/zamowienia/${orderId}/rozliczenie/${targetUserId}/status-oplacenia`),
};

export const couponsApi = {
    getAll: () =>
        apiClient.get('/kupony/'),

    buyCoupon: (userId: number | string, couponId: number) =>
        apiClient.post('/kupony/kup', {
            id_uzytkownik: Number(userId),
            id_kupon: couponId,
        }),

    getUserCoupons: (userId: number | string) =>
        apiClient.get(`/uzytkownik/${userId}/kupony`),
};

export const achievementsApi = {
    getUserAchievements: (userId: number | string) =>
        apiClient.get(`/uzytkownik/${userId}/osiagniecia`),

    claimAchievement: (userId: number | string, achievementId: number | string) =>
        apiClient.post(`/uzytkownik/${userId}/osiagniecia/${achievementId}/odbierz`),
};

export const paymentsApi = {
    createPaymentIntent: (amount: number) =>
        apiClient.post('/create-payment-intent', { amount }),

    verifyPayment: (paymentIntentId: string) =>
        apiClient.get(`/payments/verify/${paymentIntentId}`),
};

export const adminApi = {
    getAllUsers: (search?: string, role?: number) => {
        const params: any = {};
        if (search) params.search = search;
        if (role) params.role = role;
        return apiClient.get('/admin/uzytkownicy', { params });
    },

    updateUserRole: (userId: number | string, roleId: number) =>
        apiClient.put(`/admin/uzytkownicy/${userId}/rola`, { id_typ_konta: roleId }),

    deleteUser: (userId: number | string) =>
        apiClient.delete(`/admin/uzytkownicy/${userId}`),

    getAllRestaurants: (search?: string) => {
        const params: any = {};
        if (search) params.search = search;
        return apiClient.get('/admin/restauracje', { params });
    },

    getPlatformStats: () =>
        apiClient.get('/admin/statystyki'),

    createCoupon: (data: { nazwa: string; opis?: string; koszt_punktowy: number; wartosc_znizki?: string; ikona?: string }) =>
        apiClient.post('/admin/kupony', data),

    updateCoupon: (couponId: number | string, data: { nazwa: string; opis?: string; koszt_punktowy: number; wartosc_znizki?: string; ikona?: string }) =>
        apiClient.put(`/admin/kupony/${couponId}`, data),

    deleteCoupon: (couponId: number | string) =>
        apiClient.delete(`/admin/kupony/${couponId}`),
};

export const reviewsApi = {
    getRestaurantReviews: (restId: number | string) =>
        apiClient.get(`/restauracja/${restId}/opinie`),

    addReview: (restId: number | string, data: { id_uzytkownik: number; ocena: number; komentarz?: string }) =>
        apiClient.post(`/restauracja/${restId}/opinie`, data),

    deleteReview: (reviewId: number | string) =>
        apiClient.delete(`/opinie/${reviewId}`),
};

export const api = {
    auth: authApi,
    user: userApi,
    restaurants: restaurantsApi,
    products: productsApi,
    cart: cartApi,
    orders: ordersApi,
    coupons: couponsApi,
    achievements: achievementsApi,
    payments: paymentsApi,
    admin: adminApi,
    reviews: reviewsApi,
};

export default api;