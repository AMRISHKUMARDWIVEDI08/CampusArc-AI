'use strict';

const { db } = require('../config/db');
const scholarshipModel = require('../models/scholarshipModel');

function dateOnly(value) {
  return String(value || '').slice(0, 10);
}

function windowForDays(days) {
  const n = Math.max(1, Number(days) || 30);
  const to = new Date();
  const from = new Date(to.getTime() - (n - 1) * 86400000);
  return { fromDate: dateOnly(from.toISOString()), toDate: dateOnly(to.toISOString()) };
}

async function getStudent(studentId) {
  const r = await db.execute({
    sql: 'SELECT id, school_id, name FROM students WHERE id = ? LIMIT 1',
    args: [studentId]
  });
  return r.rows[0] || null;
}

async function getFee(feeId, studentId) {
  const r = await db.execute({
    sql: 'SELECT * FROM fees WHERE id = ? AND student_id = ? LIMIT 1',
    args: [feeId, studentId]
  });
  return r.rows[0] || null;
}

async function attendanceStats(studentId, fromDate, toDate) {
  const r = await db.execute({
    sql: 'SELECT status FROM attendance WHERE student_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC, id ASC',
    args: [studentId, fromDate, toDate]
  });
  const rows = r.rows || [];
  const present = rows.filter(x => String(x.status).toLowerCase() === 'present').length;
  const total = rows.length;
  return {
    total,
    present,
    absent: Math.max(0, total - present),
    percentage: total ? Number(((present / total) * 100).toFixed(2)) : 0
  };
}

function discountForRule(rule, fee, percentage) {
  if (percentage < Number(rule.threshold_value)) return 0;
  const due = Math.max(0, Number(fee.due_amount || 0));
  if (rule.award_type === 'fee_discount_percent') {
    return Number(Math.min(due, due * Number(rule.award_value || 0) / 100).toFixed(6));
  }
  return Number(Math.min(due, Math.max(0, Number(rule.award_value || 0))).toFixed(6));
}

async function evaluateStudentScholarships(studentId, feeId) {
  const student = await getStudent(studentId);
  if (!student) {
    const e = new Error('Student not found.');
    e.statusCode = 404;
    throw e;
  }

  const fee = await getFee(feeId, studentId);
  if (!fee) {
    const e = new Error('Fee not found for this student.');
    e.statusCode = 404;
    throw e;
  }

  const rules = await scholarshipModel.findActiveRulesBySchool(student.school_id);
  const results = [];

  for (const rule of rules) {
    const window = windowForDays(rule.window_days);
    const stats = await attendanceStats(studentId, window.fromDate, window.toDate);
    const existing = await scholarshipModel.findApplicationByStudentAndRule(studentId, rule.id, feeId);

    if (existing) {
      results.push({ rule, eligible: true, alreadyApplied: true, discountApplied: Number(existing.discount_applied || 0), attendance: stats, window });
      continue;
    }

    if (!stats.total) {
      results.push({ rule, eligible: false, alreadyApplied: false, discountApplied: 0, reason: 'No attendance records in the evaluation window.', attendance: stats, window });
      continue;
    }

    const discount = discountForRule(rule, fee, stats.percentage);
    const eligible = discount > 0;

    if (eligible) {
      await scholarshipModel.createApplication({
        student_id: studentId,
        rule_id: rule.id,
        fee_id: feeId,
        discount_amount: discount,
        rule_snapshot: {
          discount_type: rule.discount_type,
          discount_value: rule.discount_value,
          eval_stats: stats,
          window
        }
      });
    }

    results.push({
      rule,
      eligible,
      alreadyApplied: false,
      discountApplied: discount,
      reason: eligible ? null : 'Attendance threshold not met.',
      attendance: stats,
      window
    });
  }

  const totalDiscount = Number(results.reduce((sum, item) => sum + Number(item.discountApplied || 0), 0).toFixed(6));
  return {
    studentId,
    feeId,
    feeDue: Number(fee.due_amount || 0),
    totalDiscount,
    adjustedDue: Number(Math.max(0, Number(fee.due_amount || 0) - totalDiscount).toFixed(6)),
    results
  };
}

async function runScholarshipBatch(schoolId) {
  const sid = Number(schoolId);
  if (!sid) {
    const e = new Error('School scope is required.');
    e.statusCode = 403;
    throw e;
  }

  const students = await db.execute({
    sql: 'SELECT id FROM students WHERE school_id = ? ORDER BY id ASC',
    args: [sid]
  });
  let evaluated = 0;
  let awards = 0;

  for (const student of students.rows || []) {
    const fees = await db.execute({
      sql: "SELECT id FROM fees WHERE student_id = ? AND status = 'pending' AND due_amount > 0 ORDER BY id ASC",
      args: [student.id]
    });
    for (const fee of fees.rows || []) {
      const result = await evaluateStudentScholarships(student.id, fee.id);
      evaluated += 1;
      awards += (result.results || []).filter(x => x.eligible && !x.alreadyApplied).length;
    }
  }

  return { schoolId: sid, studentsProcessed: (students.rows || []).length, feesEvaluated: evaluated, newAwards: awards };
}

async function getStudentScholarshipSummary(studentId) {
  const student = await getStudent(studentId);
  if (!student) {
    const e = new Error('Student not found.');
    e.statusCode = 404;
    throw e;
  }

  const awards = await scholarshipModel.findAwardsByStudent(studentId);
  const totalDiscount = Number(awards.reduce((sum, x) => sum + Number(x.discount_applied || 0), 0).toFixed(6));
  return { studentId, awards, totalDiscount };
}

module.exports = { evaluateStudentScholarships, runScholarshipBatch, getStudentScholarshipSummary };
