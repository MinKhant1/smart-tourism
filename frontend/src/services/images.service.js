// Backend-served images to avoid CORS/DNS issues and provide placeholders.
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:4000/api';

export function cityImageEndpointUrl(city, width = 900, height = 600) {
  const name = encodeURIComponent((city || 'city').trim());
  return `${API_BASE}/images/city?name=${name}&w=${width}&h=${height}`;
}

export default { cityImageEndpointUrl };