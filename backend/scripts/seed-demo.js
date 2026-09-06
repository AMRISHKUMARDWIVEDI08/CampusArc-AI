'use strict';

const bcrypt = require('bcryptjs');
const { db, getDb } = require('../config/db');
const { init } = require('../config/initDb');

const ADMIN_USERNAME = process.env.DEMO_ADMIN_USERNAME || 'campus-admin';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || '';
const STUDENT_USERNAME = process.env.DEMO_STUDENT_USERNAME || 'campus-student';
const STUDENT_PASSWORD = process.env.DEMO_STUDENT_PASSWORD || '';
const SCHOOL_NAME = process.env.DEMO_SCHOOL_NAME || 'CampusArc Demo School';
const SCHOOL_WALLET = String(process.env.DEMO_SCHOOL_WALLET_ADDRESS || '').trim();

function requiredPassword(name, value) {
  if (!value || value.length < 8 || value.length > 72) throw new Error(`${name} must be 8-72 characters long.`);
}

function validWallet(value) {
  if (!value) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) throw new Error('DEMO_SCHOOL_WALLET_ADDRESS must be a valid EVM wallet address.');
  return value;
}

async function findUser(username) {
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE LOWER(username)=LOWER(?) LIMIT 1', args: [username] });
  return result.rows[0] || null;
}

async function ensureUser(username, password, role) {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await findUser(username);
  if (existing) {
    await db.execute({ sql: 'UPDATE users SET password_hash=?,role=?,is_active=1,updated_at=datetime(\'now\') WHERE id=?', args: [passwordHash, role, existing.id] });
    return Number(existing.id);
  }
  const result = await db.execute({ sql: 'INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)', args: [username, `${username}@demo.campusarc.local`, passwordHash, role] });
  return Number(result.lastInsertRowid);
}

async function ensureSchool(walletAddress) {
  const found = await db.execute({ sql: 'SELECT * FROM schools WHERE LOWER(school_name)=LOWER(?) LIMIT 1', args: [SCHOOL_NAME] });
  if (found.rows.length) {
    const school = found.rows[0];
    if (walletAddress) await db.execute({ sql: 'UPDATE schools SET wallet_address=?,updated_at=datetime(\'now\') WHERE id=?', args: [walletAddress, school.id] });
    return Number(school.id);
  }
  const created = await db.execute({ sql: 'INSERT INTO schools (school_name,wallet_address) VALUES (?,?)', args: [SCHOOL_NAME, walletAddress] });
  return Number(created.lastInsertRowid);
}

async function ensureStudent(userId, schoolId) {
  const found = await db.execute({ sql: 'SELECT id FROM students WHERE user_id=? LIMIT 1', args: [userId] });
  if (found.rows.length) return Number(found.rows[0].id);
  const created = await db.execute({ sql: 'INSERT INTO students (user_id,school_id,name,roll_no,balance_due) VALUES (?,?,?,?,?)', args: [userId, schoolId, 'Alex Morgan', 'CA-2026-001', 445] });
  return Number(created.lastInsertRowid);
}

async function seedFees(studentId) {
  const count = await db.execute({ sql: 'SELECT COUNT(*) AS count FROM fees WHERE student_id=?', args: [studentId] });
  if (Number(count.rows[0].count) > 0) return;
  for (const amount of [120, 75, 250]) {
    await db.execute({ sql: 'INSERT INTO fees (student_id,total_amount,due_amount,status) VALUES (?,?,?,?)', args: [studentId, amount, amount, 'pending'] });
  }
}

async function seedAcademic(studentId, schoolId, userId) {
  const a = await db.execute({ sql: 'SELECT COUNT(*) AS count FROM attendance WHERE student_id=?', args: [studentId] });
  if (Number(a.rows[0].count) === 0) {
    for (const [date, status] of [['2026-09-01','present'],['2026-09-02','present'],['2026-09-03','late'],['2026-09-04','present'],['2026-09-05','absent']]) {
      await db.execute({ sql: 'INSERT INTO attendance (student_id,date,status) VALUES (?,?,?)', args: [studentId, date, status] });
    }
  }

  const h = await db.execute({ sql: 'SELECT COUNT(*) AS count FROM homework WHERE school_id=?', args: [schoolId] });
  if (Number(h.rows[0].count) === 0) {
    await db.execute({ sql: 'INSERT INTO homework (school_id,title,content,date) VALUES (?,?,?,?)', args: [schoolId, 'Research brief: sustainable campuses', 'Prepare a 1-page evidence-based summary on how campuses can reduce energy and water use.', '2026-09-08'] });
    await db.execute({ sql: 'INSERT INTO homework (school_id,title,content,date) VALUES (?,?,?,?)', args: [schoolId, 'Math revision set', 'Complete the algebra revision problems before the next class.', '2026-09-10'] });
  }

  const e = await db.execute({ sql: 'SELECT COUNT(*) AS count FROM exams WHERE student_id=?', args: [studentId] });
  if (Number(e.rows[0].count) === 0) {
    for (const [subject, marks, date] of [['Mathematics',84,'2026-09-12'],['Science',91,'2026-09-15'],['English',88,'2026-09-18']]) {
      await db.execute({ sql: 'INSERT INTO exams (student_id,subject,marks,schedule_date) VALUES (?,?,?,?)', args: [studentId, subject, marks, date] });
    }
  }

  const n = await db.execute({ sql: 'SELECT COUNT(*) AS count FROM notifications WHERE user_id=?', args: [userId] });
  if (Number(n.rows[0].count) === 0) {
    await db.execute({ sql: 'INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)', args: [userId, 'academic', 'New homework has been added to your campus dashboard.'] });
    await db.execute({ sql: 'INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)', args: [userId, 'payments', 'Your next USDC fee is ready to review.'] });
  }
}

async function main() {
  requiredPassword('DEMO_ADMIN_PASSWORD', ADMIN_PASSWORD);
  requiredPassword('DEMO_STUDENT_PASSWORD', STUDENT_PASSWORD);
  const wallet = validWallet(SCHOOL_WALLET);

  await init();
  await getDb();

  const schoolId = await ensureSchool(wallet);
  const adminId = await ensureUser(ADMIN_USERNAME, ADMIN_PASSWORD, 'admin');
  const studentUserId = await ensureUser(STUDENT_USERNAME, STUDENT_PASSWORD, 'student');
  await db.execute({ sql: 'UPDATE users SET school_id=?,updated_at=datetime(\'now\') WHERE id IN (?,?)', args: [schoolId, adminId, studentUserId] });

  const studentId = await ensureStudent(studentUserId, schoolId);
  await seedFees(studentId);
  await seedAcademic(studentId, schoolId, studentUserId);

  console.log(JSON.stringify({
    success: true,
    school: { id: schoolId, name: SCHOOL_NAME, walletConfigured: Boolean(wallet) },
    admin: { username: ADMIN_USERNAME },
    student: { username: STUDENT_USERNAME, studentId },
    note: wallet ? 'Arc Testnet payment demo is configured.' : 'Academic demo is ready. Add DEMO_SCHOOL_WALLET_ADDRESS for live Arc USDC payment testing.'
  }, null, 2));
}

main().catch((error) => {
  console.error('[seed-demo] FAILED:', error.message);
  process.exitCode = 1;
});
