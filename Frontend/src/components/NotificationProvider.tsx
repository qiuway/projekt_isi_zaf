import { createContext, useContext, useState } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

type Notification = {
    id: number;
    message: string;
    type: NotificationType;
};

type NotifyFunction = (message: string, type?: NotificationType) => void;

const NotificationContext = createContext<NotifyFunction | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify: NotifyFunction = (message, type = 'info') => {
        const id = Date.now();

        setNotifications((prev) => [
            ...prev,
            { id, message, type },
        ]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3500);
    };

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