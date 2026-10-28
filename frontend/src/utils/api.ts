export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function parseProductImages(images?: string | null): string[] {
  if (!images || typeof images !== 'string') return [];
  const trimmed = images.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean);
      }
    } catch {
    }
  }

  return trimmed
    .split(/,(?=\s*(?:https?:\/\/|data:image\/|\/))/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function resolveSingleImageUrl(imgUrl: string): string {
  if (!imgUrl) return '';
  if (imgUrl.startsWith('http') && imgUrl.includes('gpcamerarental.com')) {
    return `${API_BASE}/products/proxy-image?url=${encodeURIComponent(imgUrl)}`;
  }
  if (imgUrl.startsWith('/uploads/')) {
    const serverOrigin = API_BASE.replace(/\/api\/?$/, '');
    return `${serverOrigin}${imgUrl}`;
  }
  return imgUrl;
}

export function getProductImageUrl(images?: string | null): string {
  const list = parseProductImages(images);
  if (list.length === 0) return '';
  return resolveSingleImageUrl(list[0]);
}

export function getAllProductImageUrls(images?: string | null): string[] {
  return parseProductImages(images).map(resolveSingleImageUrl).filter(Boolean);
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('cinerent_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }

  return data;
}
