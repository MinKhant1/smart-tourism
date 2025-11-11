import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getItinerary = async (itineraryId) => {
  const { data } = await axios.get(`${API_BASE}/itineraries/${itineraryId}`, { headers: authHeaders() });
  return data.itinerary;
};

export const setActivityCompleted = async (itineraryId, dayIndex, activityIndex, completed) => {
  const payload = { dayIndex, activityIndex, completed };
  const { data } = await axios.patch(`${API_BASE}/itineraries/${itineraryId}/activities`, payload, { headers: authHeaders() });
  return data.ok === true;
};

export default { getItinerary, setActivityCompleted };