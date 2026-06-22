export type Screen =
  | 'login'
  | 'register'
  | 'home'
  | 'restaurant'
  | 'cart'
  | 'profile'
  | 'profileEdit'
  | 'settings'
  | 'help'
  | 'achievements'
  | 'pointsShop'
  | 'payment';

export interface Dish {
  id: number;
  name: string;
  price: string;
  description?: string;
}

export interface Restaurant {
  id: number;
  name: string;
  tagline: string;
  category: string;
  rating: string;
  deliveryTime: string;
  minimumOrder: string;
  dishes: Dish[];
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  earnedAt: string;
  points: number;
  icon: string;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  priceInPoints: number;
  discount: string;
  icon: string;
}
