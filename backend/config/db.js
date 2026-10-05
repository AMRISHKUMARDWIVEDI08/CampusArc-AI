'use strict';

const path = require('path');
const { createClient } = require('@libsql/client');
const env = require('./env');

const DB_PATH = env.DB_PATH || path.join(__dirname, '../data/database.sqlite');
const isRemoteDatabase = /^(libsql|https?):\/\//i.test(env.DATABASE_URL);
const clientOptions = isRemoteDatabase
  ? { url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN || undefined }
  : { url: env.DATABASE_URL || `file:${DB_PATH}` };

const db = createClient(clientOptions);

async function initPragmas() {
  // These pragmas are local SQLite connection settings; do not issue them to a hosted database.
  if (!isRemoteDatabase) {
    await db.execute('PRAGMA journal_mode=WAL;');
    await db.execute('PRAGMA foreign_keys=ON;');
    await db.execute('PRAGMA busy_timeout=5000;');
  }
}

async function getDb() {
  await initPragmas();
  return db;
}

async function closeDb() {
  db.close();
}

module.exports = { db, getDb, closeDb, isRemoteDatabase };
