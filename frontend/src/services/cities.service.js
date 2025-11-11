// City search via backend proxy to avoid DNS/CORS issues. No key required.
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:4000/api';

export const searchCities = async (query, limit = 7) => {
  const q = (query || '').trim();
  if (!q) return [];
  try {
    const res = await fetch(`${API_BASE}/cities/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
};

export default { searchCities };