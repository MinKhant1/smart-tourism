import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const listMyTrips = async () => {
  const { data } = await axios.get(`${API_BASE}/trips/mine`, { headers: authHeaders() });
  return data.items;
};

export const createTrip = async (payload) => {
  const { data } = await axios.post(`${API_BASE}/trips`, payload, { headers: authHeaders() });
  return data.trip;
};

export const getTripItineraries = async (tripId) => {
  const { data } = await axios.get(`${API_BASE}/trips/${tripId}/itineraries`, { headers: authHeaders() });
  return data.items;
};

export const planTripFromTextForTrip = async (tripId, query, options = {}) => {
  const payload = { query, ...options };
  const { data } = await axios.post(`${API_BASE}/trips/${tripId}/plan-text`, payload, { headers: authHeaders() });
  return data.itinerary;
};

export default {
  listMyTrips,
  createTrip,
  getTripItineraries,
  planTripFromTextForTrip,
};