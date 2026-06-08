import api from './api';

async function getAllGrammarRules() {
  const response = await api.get('/api/grammar-rules');
  return response.data.data;
}

async function getGrammarRule(id) {
  const response = await api.get(`/api/grammar-rules/${id}`);
  return response.data.data;
}

async function createGrammarRule(data) {
  const response = await api.post('/api/grammar-rules', data);
  return response.data.data;
}

async function updateGrammarRule(id, data) {
  const response = await api.put(`/api/grammar-rules/${id}`, data);
  return response.data.data;
}

async function deleteGrammarRule(id) {
  const response = await api.delete(`/api/grammar-rules/${id}`);
  return response.data.data;
}

export { getAllGrammarRules, getGrammarRule, createGrammarRule, updateGrammarRule, deleteGrammarRule };
