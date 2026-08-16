'use strict';

const fs = require('fs');
const path = require('path');
const { db, getDb, closeDb } = require('./db');

const MIGRATION_DIR = path.join(__dirname, '../migrations');

async function getCurrentVersion() {
  try {
    const result = await db.execute('SELECT version FROM schema_version ORDER BY id DESC LIMIT 1');
    return result.rows.length ? Number(result.rows[0].version) : 0;
  } catch {
    return 0;
  }
}

async function applyMigration(file, version) {
  const sql = fs.readFileSync(file, 'utf8');
  const statements = sql.split(';').map(chunk => chunk.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim()).filter(Boolean);
  for (const statement of statements) await db.execute(statement + ';');
  await db.execute({ sql: 'INSERT INTO schema_version (version) VALUES (?)', args: [version] });
}

async function init() {
  try {
    await getDb();
    const current = await getCurrentVersion();
    const files = fs.readdirSync(MIGRATION_DIR).filter(f => /^\d+_.*\.sql$/.test(f)).sort();
    for (const file of files) {
      const version = Number(file.match(/^(\d+)_/)[1]);
      if (version <= current) continue;
      await applyMigration(path.join(MIGRATION_DIR, file), version);
      console.log(`[initDb] Applied migration ${file}`);
    }
    console.log('[initDb] Database initialization complete.');
  } catch (err) {
    console.error('[initDb] FATAL:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

if (require.main === module) init();
module.exports = { init };
