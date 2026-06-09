import api from './api';

async function startAssessment() {
  const response = await api.post('/api/assessment/start');
  return response.data.data;
}

async function sendAssessmentMessage(assessmentId, content) {
  const response = await api.post(`/api/assessment/${assessmentId}/message`, { content });
  return response.data.data;
}

async function endAssessment(assessmentId) {
  const response = await api.post(`/api/assessment/${assessmentId}/end`);
  return response.data.data;
}

export { startAssessment, sendAssessmentMessage, endAssessment };
