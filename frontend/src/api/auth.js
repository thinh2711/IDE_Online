import { requestJson } from './http';

// Các hàm API auth giúp component/hook không phải biết chi tiết endpoint.
export function loginUser({ username, password }) {
  return requestJson('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function registerUser({ fullName, username, password }) {
  return requestJson('/api/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, username, password }),
  });
}

export function getCurrentUser(token) {
  return requestJson('/api/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
