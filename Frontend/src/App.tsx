import { useEffect, useMemo, useState } from 'react';
import { AchievementsScreen } from './components/AchievementsScreen';
import { AuthScreen } from './components/AuthScreen';
import { CartScreen } from './components/CartScreen';
import { HelpScreen } from './components/HelpScreen';
import { HomeScreen } from './components/HomeScreen';
import { PaymentScreen } from './components/PaymentScreen';
import { PointsShopScreen } from './components/PointsShopScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { RestaurantScreen } from './components/RestaurantScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ProfileEditScreen } from './components/ProfileEditScreen';
import { OrderHistoryScreen } from './components/OrderHistoryScreen';
import { RestaurantOrdersScreen } from './components/RestaurantOrdersScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { NotificationProvider } from './components/NotificationProvider';
import { isTokenExpired, clearAuthSession, logoutUser } from './api/apiClient';
import type { Screen } from './types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleLogin') === 'success') {
      return 'home';
    }

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (userId && token && token !== 'undefined' && token !== 'null') {
      if (isTokenExpired(token)) {
        clearAuthSession();
        return 'login';
      }
      const savedScreen = localStorage.getItem('currentScreen') as Screen | null;
      if (savedScreen && savedScreen !== 'login' && savedScreen !== 'register') {
        return savedScreen;
      }
      return 'home';
    }

    const savedScreen = localStorage.getItem('currentScreen') as Screen | null;
    return savedScreen === 'register' ? 'register' : 'login';
  });

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    localStorage.setItem('currentScreen', screen);
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentScreen('login');
      localStorage.setItem('currentScreen', 'login');
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && token !== 'undefined' && token !== 'null') {
        if (isTokenExpired(token)) {
          logoutUser();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('googleLogin') === 'success') {
      const token = params.get('token');
      const userId = params.get('userId');
      const punkty = params.get('punkty');

      if (token) {
        localStorage.setItem('token', token);
      }

      if (userId) {
        localStorage.setItem('userId', userId);
      }

      if (punkty) {
        localStorage.setItem('punkty', punkty);
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      handleNavigate('home');
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const screen = useMemo(() => {
    switch (currentScreen) {
      case 'login':
        return <AuthScreen mode="login" onNavigate={handleNavigate} />;
      case 'register':
        return <AuthScreen mode="register" onNavigate={handleNavigate} />;
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'restaurant':
        return <RestaurantScreen onNavigate={handleNavigate} />;
      case 'cart':
        return <CartScreen onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'profileEdit':
        // @ts-ignore
        return <ProfileEditScreen onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      case 'help':
        return <HelpScreen onNavigate={handleNavigate} />;
      case 'achievements':
        return <AchievementsScreen onNavigate={handleNavigate} />;
      case 'pointsShop':
        return <PointsShopScreen onNavigate={handleNavigate} />;
      case 'payment':
        return <PaymentScreen onNavigate={handleNavigate} />;
      case 'orderHistory':
        return <OrderHistoryScreen onNavigate={handleNavigate} />;
      case 'restaurantOrders': {
        const restId = localStorage.getItem('restaurantOrdersRestId');
        const restName = localStorage.getItem('restaurantOrdersRestName');
        if (!restId) {
          handleNavigate('profile');
          return null;
        }
        return (
          <RestaurantOrdersScreen
            onNavigate={handleNavigate}
            restId={Number(restId)}
            restName={restName || 'Restauracja'}
          />
        );
      }
      case 'adminPanel':
        return <AdminPanelScreen onNavigate={handleNavigate} />;
      default:
        return <AuthScreen mode="login" onNavigate={handleNavigate} />;
    }
  }, [currentScreen]);

    return (
        <NotificationProvider>
            <div>{screen}</div>
        </NotificationProvider>
    );
}

export default App;