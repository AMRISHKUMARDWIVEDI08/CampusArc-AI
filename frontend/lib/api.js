'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 15_000;

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('arc_token');
}

async function request(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const token = getToken();
  const headers = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      const message = data && typeof data.message === 'string'
        ? data.message
        : `Request failed (HTTP ${response.status}).`;
      throw new Error(message);
    }

    if (!data && response.status !== 204) throw new Error('Server returned an unexpected response format.');
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Request timed out. Please check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  login: (credentials) => request('POST', '/api/v1/auth/login', credentials),
  me: () => request('GET', '/api/v1/auth/me'),
  school: (id) => request('GET', `/api/v1/schools/${id}`),
  wallet: (id) => request('POST', `/api/v1/schools/${id}/provision-wallet`),
  circleStatus: (schoolId) => request('GET', `/api/v1/schools/${schoolId}/circle-status`),
  scholarshipRules: () => request('GET', '/api/v1/scholarships/rules'),
  studentScholarships: (studentId) => request('GET', `/api/v1/scholarships/students/${studentId}`),
  runScholarship: (schoolId) => request('POST', '/api/v1/scholarships/batch', { school_id: schoolId }),
  fees: (studentId) => request('GET', `/api/v1/fees/${studentId}`),
  payFee: (feeId) => request('POST', `/api/v1/fees/${feeId}/pay`),
  receipt: (feeId) => request('GET', `/api/v1/fees/${feeId}/receipt`),
  aiAssistant: (body) => request('POST', '/api/v1/ai/assistant', body),
};
