'use strict';

const env = require('./env');

const circleConfig = {
  apiKey: env.CIRCLE_API_KEY,
  entitySecret: env.CIRCLE_ENTITY_SECRET,
  apiBaseUrl: 'https://api.circle.com',
  blockchain: 'ARC-TESTNET'
};

function validateCircleConfig() {
  if (!circleConfig.apiKey) {
    const error = new Error('Circle API is not configured. Add CIRCLE_API_KEY only when managed-wallet features are enabled.');
    error.statusCode = 503;
    throw error;
  }
  if (!circleConfig.entitySecret) {
    const error = new Error('Circle entity secret is not configured.');
    error.statusCode = 503;
    throw error;
  }
}

module.exports = { circleConfig, validateCircleConfig };
