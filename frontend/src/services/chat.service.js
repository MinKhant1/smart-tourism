import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const sendTripChat = async (tripId, message, history = []) => {
  if (!tripId) throw new Error('Trip ID is required for chat');
  const payload = { message, history };
  const { data } = await axios.post(`${API_BASE}/trips/${tripId}/chat`, payload, { headers: authHeaders() });
  return data; // { reply }
};

export const getTripChatHistory = async (tripId) => {
  if (!tripId) throw new Error('Trip ID is required for chat history');
  const { data } = await axios.get(`${API_BASE}/trips/${tripId}/chat`, { headers: authHeaders() });
  return data.items || [];
};

export default { sendTripChat, getTripChatHistory };