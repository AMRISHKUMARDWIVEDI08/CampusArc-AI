'use strict';

const { AI } = require('../config/constants');

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
  const modes = new Set(['tutor','study_plan','campus_help','research']);
  const mode = modes.has(String(body.mode || '').toLowerCase()) ? String(body.mode).toLowerCase() : 'tutor';
  const supportedLocales = [
    'en',
    'as','bn','brx','doi','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur',
    'es','fr','de','pt','ar','ja','ko',
  ];
  const locale = supportedLocales.includes(String(body.locale || '').toLowerCase()) ? String(body.locale).toLowerCase() : 'en';
  const errors = [];
  if (!prompt) errors.push('prompt is required');
  if (prompt.length > AI.MAX_PROMPT_CHARS) errors.push('prompt is too long');
  if (detectInjection(prompt)) errors.push('prompt contains unsupported instruction content');
  return { valid: errors.length === 0, errors, data: { prompt, context, provider, locale, mode } };
}

function sanitizeResponse(text) {
  return clean(text, AI.MAX_INPUT_CHARS);
}

module.exports = { validateAssistant, sanitizeResponse, detectInjection };