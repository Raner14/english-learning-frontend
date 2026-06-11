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

async function getMyRelations() {
  const response = await api.get('/api/relations/my-relations');
  return response.data.data;
}

async function removeRelation(relationId) {
  const response = await api.delete(`/api/relations/${relationId}`);
  return response.data.data;
}

async function getMyTeachers() {
  const response = await api.get('/api/relations/my-teachers');
  return response.data.data;
}

async function reviewTeacher(relationId, rating, feedback) {
  const response = await api.post('/api/relations/my-teacher/review', { relationId, rating, student_feedback: feedback });
  return response.data.data;
}

async function getAllRelations(status) {
  const params = status ? { status } : {};
  const response = await api.get('/api/relations', { params });
  return response.data.data;
}

export {
  requestTeacher,
  removeRelation,
  getMyRelations,
  getMyStudents,
  getMyTeachers,
  getPendingRequests,
  updateRelationStatus,
  reviewTeacher,
  getAllRelations,
};
