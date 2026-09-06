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
      throw new Error(data && typeof data.message === 'string' ? data.message : `Request failed (HTTP ${response.status}).`);
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
  register: (profile) => request('POST', '/api/v1/auth/register', profile),
  me: () => request('GET', '/api/v1/auth/me'),
  school: (id) => request('GET', `/api/v1/schools/${id}`),
  createSchool: (body) => request('POST', '/api/v1/schools', body),
  scholarshipRules: () => request('GET', '/api/v1/scholarships/rules'),
  studentScholarships: (studentId) => request('GET', `/api/v1/scholarships/students/${studentId}`),
  runScholarship: () => request('POST', '/api/v1/scholarships/batch'),
  fees: (studentId) => request('GET', `/api/v1/fees/${studentId}`),
  payFee: (feeId, walletAddress) => request('POST', `/api/v1/fees/${feeId}/pay`, { walletAddress }),
  confirmFeePayment: (feeId, txHash, walletAddress) => request('POST', `/api/v1/fees/${feeId}/confirm`, { txHash, walletAddress }),
  receipt: (feeId) => request('GET', `/api/v1/fees/${feeId}/receipt`),
  aiAssistant: (body) => request('POST', '/api/v1/ai/assistant', body),
};
