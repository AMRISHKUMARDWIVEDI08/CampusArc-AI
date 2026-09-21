'use strict';

const transactionModel = require('../models/transactionModel');
const studentModel = require('../models/studentModel');
const { db } = require('../config/db');
const { ROLES, MESSAGES } = require('../config/constants');

async function studentTransactions(req, res) {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId) || studentId < 1) return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    const student = await studentModel.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (req.user.role === ROLES.STUDENT && Number(req.user.student_id) !== studentId) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    if (req.user.role === ROLES.ADMIN && Number(req.user.school_id) !== Number(student.school_id)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    return res.json({ success: true, transactions: await transactionModel.findByStudent(studentId) });
  } catch (err) {
    console.error('[transactions.student]', err.message);
    return res.status(500).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
}

async function schoolTransactions(req, res) {
  try {
    const schoolId = Number(req.params.schoolId);
    if (!Number.isInteger(schoolId) || schoolId < 1 || req.user.role !== ROLES.ADMIN || Number(req.user.school_id) !== schoolId) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    const result = await db.execute({
      sql: 'SELECT t.*, s.name AS student_name, s.roll_no FROM transactions t JOIN students s ON s.id=t.student_id WHERE s.school_id=? ORDER BY t.created_at DESC, t.id DESC',
      args: [schoolId]
    });
    return res.json({ success: true, transactions: result.rows });
  } catch (err) {
    console.error('[transactions.school]', err.message);
    return res.status(500).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
}

module.exports = { studentTransactions, schoolTransactions };
