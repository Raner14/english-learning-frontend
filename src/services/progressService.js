import api from './api';

async function getProgressStats() {
  const response = await api.get('/api/progress/stats');
  return response.data.data;
}

async function getProgressSkills() {
  const response = await api.get('/api/progress/skills');
  return response.data.data;
}

async function getNextLesson() {
  const response = await api.get('/api/progress/next-lesson');
  return response.data.data;
}

async function getStudentProgress(studentId) {
  const response = await api.get(`/api/progress/${studentId}`);
  return response.data.data;
}

export { getProgressStats, getProgressSkills, getNextLesson, getStudentProgress };
