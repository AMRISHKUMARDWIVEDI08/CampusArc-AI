'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { getDb } = require('./config/db');
const authRoutes = require('./routes/api/v1/auth');
const schoolRoutes = require('./routes/api/v1/schools');
const feeRoutes = require('./routes/api/v1/fees');
const scholarshipRoutes = require('./routes/api/v1/scholarships');
const circleRoutes = require('./routes/api/v1/circle');
const aiRoutes = require('./routes/api/v1/ai');

const app = express();
app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = env.CORS_ORIGINS;
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS.'));
  },
  credentials: true
}));

app.use(express.json({ limit: '256kb' }));
app.get('/health', (_req, res) => res.status(200).json({ success: true, message: 'CampusArc AI API running.' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/scholarships', scholarshipRoutes);
app.use('/api/v1/circle', circleRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({ success: false, message: status < 500 ? err.message : 'Internal server error.' });
});

async function start() {
  await getDb();
  app.listen(env.PORT, () => console.log(`[server] CampusArc AI running on port ${env.PORT}`));
}

if (require.main === module) {
  start().catch(err => {
    console.error('[server] Startup failed:', err.message);
    process.exit(1);
  });
}

module.exports = { app, start };
