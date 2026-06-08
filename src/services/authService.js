import api from './api';

async function login(email, password) {
  const response = await api.post('/api/auth/login', { email, password });

  if (!response?.data?.success) {
    throw new Error(response?.data?.error?.message || 'Login failed.');
  }

  return response.data.data;
}

async function logout() {
  await api.post('/api/auth/logout');
}

export { login, logout };