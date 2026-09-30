'use strict';

const { db } = require('../config/db');
const { ROLES, MESSAGES } = require('../config/constants');

function parseId(value) { const id = Number.parseInt(value, 10); return Number.isInteger(id) && id > 0 ? id : null; }
function schoolAccess(req, schoolId) { return req.user?.role === ROLES.ADMIN && Number(req.user.school_id) === Number(schoolId); }
function teachingAccess(req, schoolId) { return [ROLES.ADMIN, ROLES.TEACHER, ROLES.STAFF].includes(req.user?.role) && Number(req.user.school_id) === Number(schoolId); }
function cleanText(value, max = 300) { return String(value ?? '').trim().slice(0, max); }

async function assertTeachingStudent(req, schoolId, studentId) {
  const student = await db.execute({ sql: 'SELECT id,class_name,section FROM students WHERE id=? AND school_id=? LIMIT 1', args: [studentId, schoolId] });
  if (!student.rows.length) return null;
  if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.STAFF) return student.rows[0];
  const assigned = await db.execute({ sql: 'SELECT 1 FROM teacher_assignments WHERE teacher_user_id=? AND school_id=? AND (class_name IS NULL OR class_name=\'\' OR class_name=?) AND (section IS NULL OR section=\'\' OR section=?) LIMIT 1', args: [req.user.id, schoolId, student.rows[0].class_name || '', student.rows[0].section || ''] });
  return assigned.rows.length ? student.rows[0] : null;
}

async function schoolStudents(req, res) {
  const schoolId = parseId(req.params.schoolId);
  if (!schoolId || !schoolAccess(req, schoolId)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
  const result = await db.execute({ sql: 'SELECT s.id,s.name,s.roll_no,s.class_name,s.section,s.guardian_name,s.guardian_email,s.phone,u.username,u.email,u.is_active FROM students s JOIN users u ON u.id=s.user_id WHERE s.school_id=? ORDER BY s.class_name ASC,s.section ASC,s.name ASC', args: [schoolId] });
  return res.json({ success: true, students: result.rows });
}

async function createHomework(req, res) {
  const schoolId = parseId(req.params.schoolId);
  if (!schoolId || !schoolAccess(req, schoolId)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
  const title = cleanText(req.body?.title, 180); const content = cleanText(req.body?.content, 2000); const date = cleanText(req.body?.date, 40);
  if (!title || !date) return res.status(400).json({ success: false, message: 'title and date are required.' });
  const r = await db.execute({ sql: 'INSERT INTO homework(school_id,title,content,date) VALUES(?,?,?,?)', args: [schoolId,title,content||null,date] });
  return res.status(201).json({ success: true, id: r.lastInsertRowid, message: 'Homework published.' });
}

async function createCircular(req, res) {
  const schoolId = parseId(req.params.schoolId);
  if (!schoolId || !schoolAccess(req, schoolId)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
  const title = cleanText(req.body?.title, 180); const content = cleanText(req.body?.content, 4000);
  if (!title || !content) return res.status(400).json({ success: false, message: 'title and content are required.' });
  const r = await db.execute({ sql: 'INSERT INTO circulars(school_id,title,content_hash) VALUES(?,?,?)', args: [schoolId,title,content] });
  const users = await db.execute({ sql: 'SELECT id FROM users WHERE school_id=? AND is_active=1', args: [schoolId] });
  for (const user of users.rows) await db.execute({ sql: 'INSERT INTO notifications(user_id,type,message) VALUES(?,?,?)', args: [user.id,'circular',title] });
  return res.status(201).json({ success: true, id: r.lastInsertRowid, message: 'Circular published and notifications created.' });
}

async function createFee(req, res) {
  const schoolId = parseId(req.params.schoolId);
  if (!schoolId || !schoolAccess(req, schoolId)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
  const studentId = parseId(req.body?.student_id); const amount = Number(req.body?.amount);
  if (!studentId || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'student_id and a positive amount are required.' });
  const student = await db.execute({ sql: 'SELECT id FROM students WHERE id=? AND school_id=? LIMIT 1', args: [studentId,schoolId] });
  if (!student.rows.length) return res.status(404).json({ success: false, message: 'Student not found in this school.' });
  const r = await db.execute({ sql: 'INSERT INTO fees(student_id,total_amount,due_amount,status) VALUES(?,?,?,"pending")', args: [studentId,amount,amount] });
  await db.execute({ sql: 'UPDATE students SET balance_due=COALESCE(balance_due,0)+?,updated_at=datetime("now") WHERE id=?', args: [amount,studentId] });
  const user = await db.execute({ sql: 'SELECT user_id FROM students WHERE id=?', args: [studentId] });
  if (user.rows[0]?.user_id) await db.execute({ sql: 'INSERT INTO notifications(user_id,type,message) VALUES(?,?,?)', args: [user.rows[0].user_id,'fees','A new fee has been added to your account.'] });
  return res.status(201).json({ success: true, id: r.lastInsertRowid, message: 'Fee added.' });
}

async function recordAttendance(req, res) {
  const schoolId = parseId(req.params.schoolId);
  if (!schoolId || !teachingAccess(req, schoolId)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
  const studentId = parseId(req.body?.student_id); const date = cleanText(req.body?.date, 40); const status = cleanText(req.body?.status || 'present', 30).toLowerCase();
  if (!studentId || !date || !['present','absent','late','leave'].includes(status)) return res.status(400).json({ success: false, message: 'student_id, date and a valid status are required.' });
  const student = await assertTeachingStudent(req, schoolId, studentId);
  if (!student) return res.status(403).json({ success: false, message: 'You are not assigned to this student.' });
  await db.execute({ sql: 'DELETE FROM attendance WHERE student_id=? AND date=?', args: [studentId,date] });
  const r = await db.execute({ sql: 'INSERT INTO attendance(student_id,date,status) VALUES(?,?,?)', args: [studentId,date,status] });
  return res.status(201).json({ success: true, id: r.lastInsertRowid, message: 'Attendance saved.' });
}

async function recordExam(req, res) {
  const schoolId = parseId(req.params.schoolId);
  if (!schoolId || !teachingAccess(req, schoolId)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
  const studentId = parseId(req.body?.student_id); const subject = cleanText(req.body?.subject, 120);
  const marks = req.body?.marks === '' || req.body?.marks == null ? null : Number(req.body.marks); const scheduleDate = cleanText(req.body?.schedule_date, 40);
  if (!studentId || !subject || (marks != null && (!Number.isFinite(marks) || marks < 0 || marks > 100))) return res.status(400).json({ success: false, message: 'student_id, subject and valid marks are required.' });
  const student = await assertTeachingStudent(req, schoolId, studentId);
  if (!student) return res.status(403).json({ success: false, message: 'You are not assigned to this student.' });
  const r = await db.execute({ sql: 'INSERT INTO exams(student_id,subject,marks,schedule_date) VALUES(?,?,?,?)', args: [studentId,subject,marks,scheduleDate||null] });
  return res.status(201).json({ success: true, id: r.lastInsertRowid, message: 'Exam record saved.' });
}

async function schoolOverview(req, res) {
  const schoolId = parseId(req.params.schoolId);
  if (!schoolId || !schoolAccess(req, schoolId)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
  const [studentCount,feeTotals,attendanceCount,homework,circulars] = await Promise.all([
    db.execute({sql:'SELECT COUNT(*) AS count FROM students WHERE school_id=?',args:[schoolId]}),
    db.execute({sql:'SELECT COUNT(*) AS count,SUM(CASE WHEN status="pending" THEN 1 ELSE 0 END) AS pending,SUM(CASE WHEN status="paid" THEN 1 ELSE 0 END) AS paid,SUM(due_amount) AS due FROM fees f JOIN students s ON s.id=f.student_id WHERE s.school_id=?',args:[schoolId]}),
    db.execute({sql:'SELECT COUNT(*) AS count FROM attendance a JOIN students s ON s.id=a.student_id WHERE s.school_id=?',args:[schoolId]}),
    db.execute({sql:'SELECT id,title,content,date FROM homework WHERE school_id=? ORDER BY date DESC,id DESC LIMIT 20',args:[schoolId]}),
    db.execute({sql:'SELECT id,title,content_hash,timestamp FROM circulars WHERE school_id=? ORDER BY timestamp DESC,id DESC LIMIT 20',args:[schoolId]})
  ]);
  return res.json({ success:true, summary:{ students:Number(studentCount.rows[0]?.count||0), feeRecords:Number(feeTotals.rows[0]?.count||0), pendingFees:Number(feeTotals.rows[0]?.pending||0), paidFees:Number(feeTotals.rows[0]?.paid||0), amountDue:Number(feeTotals.rows[0]?.due||0), attendanceRecords:Number(attendanceCount.rows[0]?.count||0) }, homework:homework.rows, circulars:circulars.rows });
}

module.exports={schoolStudents,createHomework,createCircular,createFee,recordAttendance,recordExam,schoolOverview};