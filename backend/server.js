'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { db, getDb } = require('./config/db');
const { migrate } = require('./config/initDb');
const authRoutes = require('./routes/api/v1/auth');
const schoolRoutes = require('./routes/api/v1/schools');
const feeRoutes = require('./routes/api/v1/fees');
const scholarshipRoutes = require('./routes/api/v1/scholarships');
const aiRoutes = require('./routes/api/v1/ai');
const transactionRoutes = require('./routes/api/v1/transactions');
const academicRoutes = require('./routes/api/v1/academics');
const campusRoutes = require('./routes/api/v1/campus');
const campusAccountRoutes = require('./routes/api/v1/campusAccounts');

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
app.get('/health', async (_req, res) => {
  try {
    await getDb();
    await db.execute('SELECT 1');
    return res.status(200).json({
      success: true,
      product: 'CampusArc AI',
      network: env.ARC_NETWORK,
      payments: 'USDC on Arc',
      database: 'connected',
      message: 'CampusArc AI API running.'
    });
  } catch (error) {
    console.error('[health] Database unavailable:', error.message);
    return res.status(200).json({
      success: true,
      product: 'CampusArc AI',
      network: env.ARC_NETWORK,
      payments: 'USDC on Arc',
      database: 'unavailable',
      message: 'CampusArc AI API running; database connection pending.'
    });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/scholarships', scholarshipRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/academics', academicRoutes);
app.use('/api/v1/campus', campusRoutes);
app.use('/api/v1/campus-accounts', campusAccountRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err.message);
  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({ success: false, message: status < 500 ? err.message : 'Internal server error.' });
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[server] CampusArc AI listening on port ${env.PORT}`);
  });

  let lastError;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      console.log(`[server] Database startup attempt ${attempt}/5`);
      await migrate();
      await getDb();
      await db.execute('SELECT 1');
      console.log('[server] Database connected and ready.');
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      console.error(`[server] Database startup attempt ${attempt} failed:`, err);
      if (attempt < 5) await sleep(attempt * 3000);
    }
  }

  if (lastError) {
    console.error('[server] Database did not become ready after 5 attempts. API remains online; /health will report database unavailable.');
  }
}


if (require.main === 'module') {
  start().catch(err => {
    console.error('[server] Startup failed:', err);
    process.exit(1);
  });
}

module.exports = { app, start };
