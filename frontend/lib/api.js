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
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store'
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : null;

    if (!res.ok) {
      const message = data && typeof data.message === 'string'
        ? data.message
        : `Request failed (HTTP ${res.status}).`;
      throw new Error(message);
    }

    if (!data && res.status !== 204) {
      throw new Error('Server returned an unexpected response format.');
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
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
  schoolStats: (schoolId) => request('GET', `/api/v1/schools/${schoolId}/dashboard-stats`),
  aiQuery: (body) => request('POST', '/api/v1/ai/query', body),
  runScholarshipRule: (ruleId) => request('POST', `/api/v1/scholarships/rules/${ruleId}/run`),
  runAllRules: (schoolId) => request('POST', `/api/v1/scholarships/schools/${schoolId}/run-all`),
  scholarshipRules: (schoolId) => request('GET', `/api/v1/scholarships/rules/school/${schoolId}`),
  scholarshipAwards: (schoolId) => request('GET', `/api/v1/scholarships/awards/school/${schoolId}`),
  studentAwards: (studentId) => request('GET', `/api/v1/scholarships/awards/student/${studentId}`),
  fees: (studentId) => request('GET', `/api/v1/fees/${studentId}`),
  payFee: (feeId) => request('POST', `/api/v1/fees/${feeId}/pay`),
  receipt: (feeId) => request('GET', `/api/v1/fees/${feeId}/receipt`),
  transactions: (studentId) => request('GET', `/api/v1/transactions/${studentId}`),
  transactionsForSchool: (schoolId) => request('GET', `/api/v1/transactions/school/${schoolId}`),
  guide: () => request('GET', '/api/v1/help/guide'),
  submitFeedback: (body) => request('POST', '/api/v1/help/feedback', body)
};
