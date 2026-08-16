'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CIRCLE_API_KEY: process.env.CIRCLE_API_KEY || '',
  CIRCLE_ENTITY_SECRET: process.env.CIRCLE_ENTITY_SECRET || '',
  ARC_NETWORK: process.env.ARC_NETWORK || '',
  ARC_RPC: process.env.ARC_RPC || '',
  ARC_CHAIN_ID: parseInt(process.env.ARC_CHAIN_ID, 10) || 5042002,
  ARC_GAS_PRICE_GWEI: parseInt(process.env.ARC_GAS_PRICE_GWEI, 10) || 20,
  AI_API_KEY: process.env.AI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean),
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../data/database.sqlite')
};

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Configure it in backend/.env.');
}
if (env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

module.exports = env;
