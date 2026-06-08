import api from './api';

async function getMe() {
  const response = await api.get('/api/users/me');
  return response.data.data;
}

async function getAllUsers() {
  const response = await api.get('/api/users');
  return response.data.data;
}

async function getUser(userId) {
  const response = await api.get(`/api/users/${userId}`);
  return response.data.data;
}

async function registerUser(userData) {
  const response = await api.post('/api/users/register', userData);
  return response.data.data;
}

async function updateUser(userId, data) {
  const response = await api.put(`/api/users/${userId}`, data);
  return response.data.data;
}

async function deleteUser(userId) {
  const response = await api.delete(`/api/users/${userId}`);
  return response.data.data;
}

export { getMe, getAllUsers, getUser, registerUser, updateUser, deleteUser };
