// Wrapper fetch JSON nhỏ dùng chung cho mọi API call ở frontend.
export async function requestJson(path, options = {}) {
  const { headers = {}, ...requestOptions } = options;

  const response = await fetch(path, {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Backend trả lỗi dạng { error: { message } }, nhưng vẫn có fallback cho response thường.
    throw new Error(data.error?.message || data.message || 'Request failed');
  }

  return data;
}
