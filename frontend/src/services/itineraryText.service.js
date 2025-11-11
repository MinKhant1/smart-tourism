import axios from 'axios';

// Base API without auth suffix; defaults to 4000
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:4000/api';

export const planTripFromText = async (query, options = {}) => {
  const payload = {
    query,
    ...options,
  };
  const { data } = await axios.post(`${API_BASE}/itinerary-text/plan-text`, payload);
  // Controller returns { itinerary, source }
  return data.itinerary;
};

export default { planTripFromText };