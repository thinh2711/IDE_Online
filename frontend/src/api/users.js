// frontend/src/api/users.js
import { requestJson } from './http';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export function listUsers(token) {
  return requestJson('/api/users', {
    headers: authHeaders(token),
  });
}

export function listCoders(token) {
  return requestJson('/api/users/coders', {
    headers: authHeaders(token),
  });
}

export function changeUserRole(token, id, role) {
  return requestJson(`/api/users/${id}/role`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
}
