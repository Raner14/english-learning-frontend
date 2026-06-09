import api from './api';

async function savePreferences(preferences) {
  const response = await api.post('/api/matching/preferences', preferences);
  return response.data.data;
}

async function getRecommendations() {
  const response = await api.get('/api/matching/recommendations');
  return response.data.data;
}

export { savePreferences, getRecommendations };
