import { requestJson } from './http';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export function runSubmission(token, payload) {
  return requestJson('/api/submissions/run', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function listSubmissions(token) {
  return requestJson('/api/submissions', {
    headers: authHeaders(token),
  });
}

export function getSubmission(token, id) {
  return requestJson(`/api/submissions/${id}`, {
    headers: authHeaders(token),
  });
}
