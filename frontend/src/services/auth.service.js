import axios from 'axios';

// Use environment variable and default to backend on port 4000
const API_URL = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:4000/api/auth/');

// Backend expects: { name, email, password, preferences? } at POST /register
const register = (name, email, password, preferences) => {
  const payload = { name, email, password };
  if (preferences !== undefined) payload.preferences = preferences;
  return axios.post(API_URL + 'register', payload);
};

// Backend responds: { token, user: { id, name, email, preferences } }
const login = (email, password) => {
  return axios
    .post(API_URL + 'login', { email, password })
    .then((response) => {
      const { token, user } = response.data || {};
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      if (token) {
        localStorage.setItem('token', token);
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default AuthService;