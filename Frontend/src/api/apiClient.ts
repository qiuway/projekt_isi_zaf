import axios from 'axios';

export const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
            localStorage.removeItem('punkty');

            alert('Sesja wygasła. Zaloguj się ponownie.');
        }

        return Promise.reject(error);
    }
);