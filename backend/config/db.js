'use strict';

const path = require('path');
const { createClient } = require('@libsql/client');
const env = require('./env');

const DB_PATH = env.DB_PATH || path.join(__dirname, '../data/database.sqlite');
const db = createClient({ url: `file:${DB_PATH}` });

async function initPragmas() {
  await db.execute('PRAGMA journal_mode=WAL;');
  await db.execute('PRAGMA foreign_keys=ON;');
  await db.execute('PRAGMA busy_timeout=5000;');
}

async function getDb() {
  await initPragmas();
  return db;
}

async function closeDb() {
  db.close();
}

module.exports = { db, getDb, closeDb };
