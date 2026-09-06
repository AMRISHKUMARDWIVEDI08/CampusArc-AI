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

const ARC = {
  CHAIN_ID: 5042002,
  RPC_URL: 'https://rpc.testnet.arc.network',
  EXPLORER_URL: 'https://testnet.arcscan.app',
  USDC_TOKEN: '0x3600000000000000000000000000000000000000'.toLowerCase(),
  USDC_DECIMALS: 6,
  MIN_GAS_PRICE_GWEI: 20,
  RPC_TIMEOUT_MS: 8_000,
  ERC20_TRANSFER_SELECTOR: 'a9059cbb',
  TRANSFER_EVENT_TOPIC: 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a3d2c27b6b'
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

module.exports = { ROLES, BCRYPT_ROUNDS, TOKEN_COOKIE, VALIDATION, ARC, AI, MESSAGES };
