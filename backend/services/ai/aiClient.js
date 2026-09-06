'use strict';

const { AI } = require('../../config/constants');

class AiApiError extends Error {
  constructor(provider, httpStatus, message) {
    super(message);
    this.name = 'AiApiError';
    this.provider = provider;
    this.httpStatus = httpStatus;
  }
}

async function post(provider, url, headers, body) {
  let lastError;
  for (let attempt = 0; attempt <= AI.MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI.TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : null;
      if (!response.ok) {
        const message = typeof payload?.error?.message === 'string' ? payload.error.message : `AI provider returned HTTP ${response.status}.`;
        const error = new AiApiError(provider, response.status, message);
        if (response.status >= 500 && attempt < AI.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, AI.RETRY_DELAY_MS));
          lastError = error;
          continue;
        }
        throw error;
      }
      if (!payload) throw new AiApiError(provider, 502, 'AI provider returned a non-JSON response.');
      return payload;
    } catch (error) {
      lastError = error;
      if (error?.name === 'AbortError' && attempt < AI.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, AI.RETRY_DELAY_MS));
        continue;
      }
      if (error instanceof AiApiError && !(error.httpStatus >= 500 && attempt < AI.MAX_RETRIES)) throw error;
      if (!(error?.name === 'AbortError') || attempt >= AI.MAX_RETRIES) throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new AiApiError(provider, 502, 'AI provider request failed.');
}

module.exports = { post, AiApiError };
