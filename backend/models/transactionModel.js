'use strict';

const { db } = require('../config/db');

async function create({ student_id, amount, currency = 'USDC', payment_provider, memo_ref, tx_hash = null, receipt_id }) {
  const result = await db.execute({
    sql: `INSERT INTO transactions(student_id,amount,currency,payment_provider,memo_ref,tx_hash,receipt_id,status)
          VALUES(?,?,?,?,?,?,?,'pending')`,
    args: [student_id, amount, currency, payment_provider || null, memo_ref || null, tx_hash, receipt_id],
  });
  return result.lastInsertRowid;
}

async function findById(id) {
  const result = await db.execute({ sql: 'SELECT * FROM transactions WHERE id=? LIMIT 1', args: [id] });
  return result.rows[0] || null;
}

async function findByMemoRef(memoRef) {
  const result = await db.execute({ sql: 'SELECT * FROM transactions WHERE memo_ref=? LIMIT 1', args: [memoRef] });
  return result.rows[0] || null;
}

async function findByStudent(studentId) {
  const result = await db.execute({ sql: 'SELECT * FROM transactions WHERE student_id=? ORDER BY created_at DESC', args: [studentId] });
  return result.rows;
}

async function updateStatus(id, fields) {
  const allowed = ['status', 'tx_hash', 'block_ref', 'failure_reason'];
  const keys = Object.keys(fields).filter((key) => allowed.includes(key));
  if (!keys.length) return;
  const sets = keys.map((key) => `${key}=?`).join(', ');
  await db.execute({
    sql: `UPDATE transactions SET ${sets},updated_at=datetime('now') WHERE id=?`,
    args: [...keys.map((key) => fields[key]), id],
  });
}

module.exports = { create, findById, findByMemoRef, findByStudent, updateStatus };
