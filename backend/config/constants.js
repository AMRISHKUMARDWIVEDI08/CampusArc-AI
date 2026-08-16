'use strict';

const ROLES = { STUDENT: 'student', ADMIN: 'admin' };
const BCRYPT_ROUNDS = 12;
const TOKEN_COOKIE = 'arc_token';

const VALIDATION = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 32,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72,
  EMAIL_MAX: 254
};

const AI = {
  TIMEOUT_MS: 30_000,
  MAX_RETRIES: 1,
  RETRY_DELAY_MS: 1_000,
  MAX_INPUT_CHARS: 20_000,
  MAX_PROMPT_CHARS: 8_000,
  INJECTION_PATTERNS: [
    'ignore previous instructions',
    'ignore all previous instructions',
    'reveal system prompt',
    'show system prompt',
    'developer message',
    'jailbreak'
  ]
};

const MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password.',
  ACCOUNT_INACTIVE: 'Account is deactivated. Contact your school administrator.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  USER_NOT_FOUND: 'User not found.',
  USERNAME_TAKEN: 'Username is already taken.',
  EMAIL_TAKEN: 'Email address is already registered.',
  VALIDATION_ERROR: 'Validation failed.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.'
};

module.exports = { ROLES, BCRYPT_ROUNDS, TOKEN_COOKIE, VALIDATION, AI, MESSAGES };
