'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { getDb } = require('./config/db');
const authRoutes = require('./routes/api/v1/auth');
const schoolRoutes = require('./routes/api/v1/schools');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'CampusArc AI API running.' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

async function start() {
  await getDb();
  app.listen(env.PORT, () => {
    console.log(`[server] CampusArc AI running on port ${env.PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[server] Startup failed:', err.message);
    process.exit(1);
  });
}

module.exports = { app, start };
