import api from './api';

async function requestTeacher(teacherId) {
  const response = await api.post('/api/relations/request', { teacherId });
  return response.data.data;
}

async function getMyStudents() {
  const response = await api.get('/api/relations/my-students');
  return response.data.data;
}

async function getPendingRequests() {
  const response = await api.get('/api/relations/pending');
  return response.data.data;
}

async function updateRelationStatus(relationId, status) {
  const response = await api.patch(`/api/relations/${relationId}/status`, { status });
  return response.data.data;
}

async function reviewTeacher(rating, feedback) {
  const response = await api.post('/api/relations/my-teacher/review', { rating, feedback });
  return response.data.data;
}

export { requestTeacher, getMyStudents, getPendingRequests, updateRelationStatus, reviewTeacher };
