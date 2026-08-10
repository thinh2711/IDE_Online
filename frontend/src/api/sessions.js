import { requestJson } from './http';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export function createSession(token, payload) {
  return requestJson('/api/sessions', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function endSession(token, id) {
  return requestJson(`/api/sessions/${id}/end`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
}

export function getSession(token, id) {
  return requestJson(`/api/sessions/${id}`, {
    headers: authHeaders(token),
  });
}

export function joinSession(token, joinCode) {
  return requestJson('/api/sessions/join', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ joinCode }),
  });
}

export function listSessions(token) {
  return requestJson('/api/sessions', {
    headers: authHeaders(token),
  });
}
