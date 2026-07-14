import { requestJson } from './http';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export function listQuestions(token) {
  return requestJson('/api/questions', {
    headers: authHeaders(token),
  });
}

export function getQuestion(token, id) {
  return requestJson(`/api/questions/${id}`, {
    headers: authHeaders(token),
  });
}

export function createQuestion(token, payload) {
  return requestJson('/api/questions', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateQuestion(token, id, payload) {
  return requestJson(`/api/questions/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteQuestion(token, id) {
  return requestJson(`/api/questions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export function listTestCases(token, questionId) {
  return requestJson(`/api/questions/${questionId}/test-cases`, {
    headers: authHeaders(token),
  });
}

export function createTestCase(token, questionId, payload) {
  return requestJson(`/api/questions/${questionId}/test-cases`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateTestCase(token, id, payload) {
  return requestJson(`/api/test-cases/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteTestCase(token, id) {
  return requestJson(`/api/test-cases/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
