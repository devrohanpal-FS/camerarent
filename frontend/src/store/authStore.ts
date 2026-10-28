import { create } from 'zustand';
import { apiRequest } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  kycStatus: string;
  kycDocUrl: string | null;
  vendorProfile: {
    id: string;
    name: string;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  submitKyc: (kycDocUrl: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const storedToken = localStorage.getItem('cinerent_token');
  const storedUser = localStorage.getItem('cinerent_user');

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    loading: false,
    error: null,

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        
        localStorage.setItem('cinerent_token', data.token);
        localStorage.setItem('cinerent_user', JSON.stringify(data.user));
        
        set({ user: data.user, token: data.token, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },

    signup: async (name, email, password) => {
      set({ loading: true, error: null });
      try {
        const data = await apiRequest('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });

        localStorage.setItem('cinerent_token', data.token);
        localStorage.setItem('cinerent_user', JSON.stringify(data.user));

        set({ user: data.user, token: data.token, loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },

    logout: () => {
      localStorage.removeItem('cinerent_token');
      localStorage.removeItem('cinerent_user');
      set({ user: null, token: null, error: null });
    },

    submitKyc: async (kycDocUrl) => {
      set({ loading: true, error: null });
      try {
        const data = await apiRequest('/auth/kyc', {
          method: 'PUT',
          body: JSON.stringify({ kycDocUrl }),
        });

        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            kycStatus: data.kycStatus,
            kycDocUrl: data.kycDocUrl,
          };
          localStorage.setItem('cinerent_user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
        set({ loading: false });
      } catch (err: any) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },

    refreshProfile: async () => {
      if (!get().token) return;
      try {
        const data = await apiRequest('/auth/me');
        localStorage.setItem('cinerent_user', JSON.stringify(data.user));
        set({ user: data.user });
      } catch (err) {
        console.error('Failed to refresh user profile:', err);
        get().logout();
      }
    },

    clearError: () => set({ error: null }),
  };
});
