import { create } from 'zustand';
import { apiRequest } from '../utils/api';

export interface CmsState {
  contents: Record<string, any>;
  loading: boolean;
  error: string | null;
  fetchCms: () => Promise<void>;
  updateCms: (key: string, value: any) => Promise<void>;
  uploadImage: (name: string, type: string, base64: string) => Promise<string>;
}

export const useCmsStore = create<CmsState>((set) => ({
  contents: {},
  loading: false,
  error: null,

  fetchCms: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest('/cms');
      set({ contents: data || {}, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch CMS content', loading: false });
    }
  },

  updateCms: async (key, value) => {
    set({ loading: true, error: null });
    try {
      const result = await apiRequest(`/cms/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      
      set((state) => ({
        contents: {
          ...state.contents,
          [key]: result.value,
        },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to update CMS content', loading: false });
      throw err;
    }
  },

  uploadImage: async (name, type, base64) => {
    try {
      const result = await apiRequest('/cms/upload', {
        method: 'POST',
        body: JSON.stringify({ name, type, base64 }),
      });
      return result.url;
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload image' });
      throw err;
    }
  },
}));
