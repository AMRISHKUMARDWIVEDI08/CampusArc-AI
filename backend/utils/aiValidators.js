'use strict';

const { AI, VALIDATION } = require('../config/constants');

function clean(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
}

function detectInjection(text) {
  const normalized = text.toLowerCase();
  return AI.INJECTION_PATTERNS.some(pattern => normalized.includes(pattern));
}

function validateAssistant(body) {
  const prompt = clean(body.prompt, AI.MAX_PROMPT_CHARS);
  const context = clean(body.context, AI.MAX_INPUT_CHARS);
  const provider = body.provider === 'claude' ? 'claude' : 'gemini';
  const errors = [];
  if (!prompt) errors.push('prompt is required');
  if (prompt.length > AI.MAX_PROMPT_CHARS) errors.push('prompt is too long');
  if (detectInjection(prompt)) errors.push('prompt contains unsupported instruction content');
  return { valid: errors.length === 0, errors, data: { prompt, context, provider } };
}

function sanitizeResponse(text) {
  return clean(text, AI.MAX_INPUT_CHARS);
}

module.exports = { validateAssistant, sanitizeResponse, detectInjection };
