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
import type { Screen } from './types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('register');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.get('googleLogin') === 'success') {
            const userId = params.get('userId');
            const punkty = params.get('punkty');

            if (userId) {
                localStorage.setItem('userId', userId);
            }

            if (punkty) {
                localStorage.setItem('punkty', punkty);
            }

            window.history.replaceState({}, document.title, window.location.pathname);
            setCurrentScreen('home');
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
        return <AuthScreen mode="login" onNavigate={setCurrentScreen} />;
      case 'register':
        return <AuthScreen mode="register" onNavigate={setCurrentScreen} />;
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'restaurant':
        return <RestaurantScreen onNavigate={setCurrentScreen} />;
      case 'cart':
        return <CartScreen onNavigate={setCurrentScreen} />;
      case 'profile':
        return <ProfileScreen onNavigate={setCurrentScreen} />;
      case 'profileEdit':
          // @ts-ignore
          return <ProfileEditScreen onNavigate={setCurrentScreen} />;
      case 'settings':
        return <SettingsScreen onNavigate={setCurrentScreen} />;
      case 'help':
        return <HelpScreen onNavigate={setCurrentScreen} />;
      case 'achievements':
        return <AchievementsScreen onNavigate={setCurrentScreen} />;
      case 'pointsShop':
        return <PointsShopScreen onNavigate={setCurrentScreen} />;
      case 'payment':
        return <PaymentScreen onNavigate={setCurrentScreen} />;
      default:
        return <AuthScreen mode="register" onNavigate={setCurrentScreen} />;
    }
  }, [currentScreen]);

  return <div>{screen}</div>;
}

export default App;
