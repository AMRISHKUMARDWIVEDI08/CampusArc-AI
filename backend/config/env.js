'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const defaultNetwork = process.env.ARC_NETWORK || (isProduction ? 'arc-mainnet' : 'arc-testnet');
const arcMainnet = defaultNetwork === 'arc-mainnet';

const env = {
  PORT: parseInt(process.env.PORT, 10) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ARC_NETWORK: defaultNetwork,
  ARC_RPC: process.env.ARC_RPC || (arcMainnet ? 'https://rpc.mainnet.arc.io' : 'https://rpc.testnet.arc.io'),
  ARC_CHAIN_ID: parseInt(process.env.ARC_CHAIN_ID, 10) || (arcMainnet ? 5042 : 5042002),
  ARC_EXPLORER_URL: process.env.ARC_EXPLORER_URL || (arcMainnet ? 'https://explorer.arc.io' : 'https://testnet.arcscan.app'),
  ARC_GAS_PRICE_GWEI: parseInt(process.env.ARC_GAS_PRICE_GWEI, 10) || 20,
  ARC_USDC_TOKEN: process.env.ARC_USDC_TOKEN || '0x3600000000000000000000000000000000000000',
  AI_API_KEY: process.env.AI_API_KEY || '',
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean),
  DATABASE_URL: process.env.DATABASE_URL || '',
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN || '',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../data/database.sqlite')
};

if (!env.JWT_SECRET) throw new Error('JWT_SECRET is required. Configure it in backend/.env.');
if (env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters long.');
const isRemoteDatabase = /^(libsql|https?):\/\//i.test(env.DATABASE_URL);
if (isRemoteDatabase && !env.DATABASE_AUTH_TOKEN) {
  throw new Error('DATABASE_AUTH_TOKEN is required when using a hosted libSQL database.');
}
if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production to prevent data loss on ephemeral filesystems.');
}
if (env.NODE_ENV === 'production' && env.CORS_ORIGINS.length === 0) {
  throw new Error('CORS_ORIGINS must contain the exact production frontend origin.');
}

module.exports = env;
