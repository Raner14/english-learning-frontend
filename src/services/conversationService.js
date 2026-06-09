import api from './api';

async function startConversation(lessonId) {
  const response = await api.post('/api/conversations/start', { lessonId });
  return response.data.data;
}

async function getConversation(conversationId) {
  const response = await api.get(`/api/conversations/${conversationId}`);
  return response.data.data;
}

async function sendMessage(conversationId, content) {
  const response = await api.post(`/api/conversations/${conversationId}/message`, { content });
  return response.data.data;
}

async function endConversation(conversationId) {
  const response = await api.post(`/api/conversations/${conversationId}/end`);
  return response.data.data;
}

async function addTeacherComment(conversationId, teacherScore, teacherComment) {
  const response = await api.post(`/api/conversations/${conversationId}/teacher-comment`, {
    teacherScore,
    teacherComment,
  });
  return response.data.data;
}

async function replyToConversation(conversationId, role, content) {
  const response = await api.post(`/api/conversations/${conversationId}/reply`, { role, content });
  return response.data.data;
}

async function listConversations(params = {}) {
  const response = await api.get('/api/conversations', { params });
  return response.data.data;
}

async function getStudentConversations(studentId) {
  const response = await api.get(`/api/students/${studentId}/conversations`);
  return response.data.data;
}

export {
  startConversation,
  getConversation,
  sendMessage,
  endConversation,
  addTeacherComment,
  replyToConversation,
  listConversations,
  getStudentConversations,
};
