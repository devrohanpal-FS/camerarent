import { create } from 'zustand';
import { apiRequest } from '../utils/api';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  rentalDays: number;
  rentalCost: number;
  depositCost: number;
  totalItemCost: number;
  isAvailable: boolean;
  availabilityReason?: string;
  product: {
    id: string;
    name: string;
    images: string;
    dailyRate: number;
    weeklyRate: number;
    depositAmount: number;
    vendor: {
      name: string;
    };
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  rentalTotal: number;
  depositTotal: number;
  taxTotal: number;
  grandTotal: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, startDate: Date, endDate: Date, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, startDate?: Date, endDate?: Date, quantity?: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  rentalTotal: 0,
  depositTotal: 0,
  taxTotal: 0,
  grandTotal: 0,

  fetchCart: async () => {
    const token = localStorage.getItem('cinerent_token');
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const items: CartItem[] = await apiRequest('/cart');
      
      const rentalTotal = items.reduce((sum, item) => sum + item.rentalCost, 0);
      const depositTotal = items.reduce((sum, item) => sum + item.depositCost, 0);
      const taxTotal = rentalTotal * 0.18;
      const grandTotal = rentalTotal + depositTotal + taxTotal;

      set({
        items,
        rentalTotal,
        depositTotal,
        taxTotal,
        grandTotal,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addToCart: async (productId, startDate, endDate, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      await apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          quantity,
        }),
      });
      set({ loading: false });
      await get().fetchCart();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateCartItem: async (itemId, startDate, endDate, quantity) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...(startDate ? { startDate: startDate.toISOString() } : {}),
          ...(endDate ? { endDate: endDate.toISOString() } : {}),
          ...(quantity !== undefined ? { quantity } : {}),
        }),
      });
      set({ loading: false });
      await get().fetchCart();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  removeCartItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(`/cart/${itemId}`, {
        method: 'DELETE',
      });
      set({ loading: false });
      await get().fetchCart();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  clearCart: async () => {
    set({ loading: true, error: null });
    try {
      await apiRequest('/cart', {
        method: 'DELETE',
      });
      set({
        items: [],
        rentalTotal: 0,
        depositTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
