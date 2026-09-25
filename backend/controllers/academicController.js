'use strict';

const { db } = require('../config/db');
const studentModel = require('../models/studentModel');
const { ROLES, MESSAGES } = require('../config/constants');

async function studentOverview(req, res) {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId) || studentId < 1) return res.status(400).json({ success: false, message: 'Invalid student ID.' });

    const student = await studentModel.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    if (req.user.role === ROLES.STUDENT && Number(req.user.student_id) !== studentId) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    if (req.user.role === ROLES.ADMIN && Number(req.user.school_id) !== Number(student.school_id)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    if (![ROLES.STUDENT, ROLES.ADMIN].includes(req.user.role)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });

    const [attendanceResult, homeworkResult, examsResult] = await Promise.all([
      db.execute({ sql: 'SELECT id, date, status FROM attendance WHERE student_id=? ORDER BY date DESC, id DESC LIMIT 30', args: [studentId] }),
      db.execute({ sql: 'SELECT id, title, content, date FROM homework WHERE school_id=? ORDER BY date DESC, id DESC LIMIT 20', args: [student.school_id] }),
      db.execute({ sql: 'SELECT id, subject, marks, schedule_date FROM exams WHERE student_id=? ORDER BY schedule_date ASC, id ASC LIMIT 20', args: [studentId] })
    ]);

    const attendance = attendanceResult.rows;
    const present = attendance.filter(item => String(item.status).toLowerCase() === 'present').length;
    const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : null;

    return res.json({
      success: true,
      student: { id: student.id, name: student.name, roll_no: student.roll_no, school_id: student.school_id },
      summary: { attendanceRate, attendanceRecords: attendance.length, upcomingExams: examsResult.rows.filter(item => item.schedule_date).length },
      attendance,
      homework: homeworkResult.rows,
      exams: examsResult.rows
    });
  } catch (err) {
    console.error('[academics.studentOverview]', err.message);
    return res.status(500).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
}

module.exports = { studentOverview };
