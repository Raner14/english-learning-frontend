import api from './api';

async function getAllTeachers(params = {}) {
  const response = await api.get('/api/teachers', { params });
  return response.data.data;
}

async function getTeacher(teacherId) {
  const response = await api.get(`/api/teachers/${teacherId}`);
  return response.data.data;
}

async function getMyReviews() {
  const response = await api.get('/api/teachers/my-reviews');
  return response.data.data;
}

async function getMyTeacherProfile() {
  const response = await api.get('/api/teachers/me');
  return response.data.data;
}

async function updateTeacher(teacherId, data) {
  const response = await api.put(`/api/teachers/${teacherId}`, data);
  return response.data.data;
}

export { getAllTeachers, getTeacher, getMyReviews, getMyTeacherProfile, updateTeacher };
