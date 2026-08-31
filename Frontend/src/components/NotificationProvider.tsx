import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

type Notification = {
    id: number;
    message: string;
    type: NotificationType;
};

type NotifyFunction = (message: string, type?: NotificationType) => void;

const NotificationContext = createContext<NotifyFunction | null>(null);

let notificationCounter = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify: NotifyFunction = (message, type = 'info') => {
        notificationCounter += 1;
        const id = Number(`${Date.now()}${notificationCounter}`);

        setNotifications((prev) => [
            ...prev,
            { id, message, type },
        ]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3500);
    };

    useEffect(() => {
        const handleSessionExpired = (e: Event) => {
            const customEvent = e as CustomEvent<{ message?: string }>;
            notify(customEvent.detail?.message || t('auth.errors.session_expired'), 'warning');
        };

        window.addEventListener('sessionExpired', handleSessionExpired);
        return () => window.removeEventListener('sessionExpired', handleSessionExpired);
    }, [t]);

    return (
        <NotificationContext.Provider value={notify}>
            {children}

            <div className="notification-container">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`notification-box notification-${notification.type}`}
                    >
                        <span>{notification.message}</span>

                        <button
                            className="notification-close"
                            onClick={() =>
                                setNotifications((prev) =>
                                    prev.filter((n) => n.id !== notification.id)
                                )
                            }
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotify() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotify musi być użyty wewnątrz NotificationProvider');
    }

    return context;
}