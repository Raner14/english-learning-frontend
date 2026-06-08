import api from './api';

async function getSettings() {
  const response = await api.get('/api/settings');
  return response.data.data;
}

async function updateSettings(settings) {
  const response = await api.put('/api/settings', settings);
  return response.data.data;
}

export { getSettings, updateSettings };
