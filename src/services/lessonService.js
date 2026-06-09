import api from './api';

async function getLessonCatalog() {
  const response = await api.get('/api/lessons/catalog');
  return response.data.data;
}

async function getAllLessons() {
  const response = await api.get('/api/lessons');
  return response.data.data;
}

async function getLesson(lessonId) {
  const response = await api.get(`/api/lessons/${lessonId}`);
  return response.data.data;
}

async function getLessonVocab(lessonId) {
  const response = await api.get(`/api/lessons/${lessonId}/vocab`);
  return response.data.data;
}

async function getLessonGrammar(lessonId) {
  const response = await api.get(`/api/lessons/${lessonId}/grammar`);
  return response.data.data;
}

async function getLessonVocabWarmup(lessonId) {
  const response = await api.get(`/api/lessons/${lessonId}/vocab-warmup`);
  return response.data.data;
}

async function getLessonGrammarWarmup(lessonId) {
  const response = await api.get(`/api/lessons/${lessonId}/grammar-warmup`);
  return response.data.data;
}

async function createLessonVocabItem(lessonId, data) {
  const response = await api.post(`/api/lessons/${lessonId}/vocab`, data);
  return response.data.data;
}

async function updateLessonVocabItem(lessonId, vocabId, data) {
  const response = await api.put(`/api/lessons/${lessonId}/vocab/${vocabId}`, data);
  return response.data.data;
}

async function deleteLessonVocabItem(lessonId, vocabId) {
  const response = await api.delete(`/api/lessons/${lessonId}/vocab/${vocabId}`);
  return response.data.data;
}

async function createLesson(lessonData) {
  const response = await api.post('/api/lessons', lessonData);
  return response.data.data;
}

async function updateLesson(lessonId, lessonData) {
  const response = await api.put(`/api/lessons/${lessonId}`, lessonData);
  return response.data.data;
}

async function deleteLesson(lessonId) {
  const response = await api.delete(`/api/lessons/${lessonId}`);
  return response.data.data;
}

export {
  getLessonCatalog,
  getAllLessons,
  getLesson,
  getLessonVocab,
  getLessonGrammar,
  getLessonVocabWarmup,
  getLessonGrammarWarmup,
  createLessonVocabItem,
  updateLessonVocabItem,
  deleteLessonVocabItem,
  createLesson,
  updateLesson,
  deleteLesson,
};
