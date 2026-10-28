import { create } from 'zustand';
import { apiRequest } from '../utils/api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const data = await apiRequest('/notifications');
      set({ notifications: data });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      set({
        notifications: get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllRead: async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      set({
        notifications: get().notifications.map((n) => ({ ...n, read: true }))
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}));
