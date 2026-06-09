import api from './api';

async function getAllWarmUpExercises() {
  const response = await api.get('/api/warm-up-grammar');
  return response.data.data;
}

async function createWarmUpExercise(data) {
  const response = await api.post('/api/warm-up-grammar', data);
  return response.data.data;
}

async function updateWarmUpExercise(id, data) {
  const response = await api.put(`/api/warm-up-grammar/${id}`, data);
  return response.data.data;
}

async function deleteWarmUpExercise(id) {
  const response = await api.delete(`/api/warm-up-grammar/${id}`);
  return response.data.data;
}

export { getAllWarmUpExercises, createWarmUpExercise, updateWarmUpExercise, deleteWarmUpExercise };
