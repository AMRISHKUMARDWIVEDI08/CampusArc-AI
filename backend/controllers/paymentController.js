'use strict';

const paymentService = require('../services/paymentService');
const feeModel = require('../models/feeModel');
const studentModel = require('../models/studentModel');
const transactionModel = require('../models/transactionModel');
const { generateReceipt } = require('../services/receiptService');
const { MESSAGES, ROLES } = require('../config/constants');

async function listStudentFees(req, res) {
  try {
    const studentId = Number(req.params.id);
    if (!Number.isInteger(studentId) || studentId < 1) return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    const student = await studentModel.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (req.user.role === ROLES.ADMIN) {
      if (!req.user.school_id || Number(req.user.school_id) !== Number(student.school_id)) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    } else if (req.user.role === ROLES.STUDENT) {
      if (!req.user.student_id || Number(req.user.student_id) !== studentId) return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    } else return res.status(403).json({ success: false, message: MESSAGES.FORBIDDEN });
    return res.status(200).json({ success: true, fees: await feeModel.findByStudent(studentId) });
  } catch (err) {
    console.error('[paymentController.listStudentFees]', err.message);
    return res.status(500).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
}

async function payFee(req, res) {
  try {
    const feeId = parseInt(req.params.id, 10);
    if (!feeId || feeId < 1) return res.status(400).json({ success: false, message: 'Invalid fee ID.' });
    const walletAddress = req.body?.walletAddress;
    const result = await paymentService.payFee(feeId, req.user, walletAddress);
    return res.status(200).json({ success: true, message: 'Payment request prepared.', ...result });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 500) console.error('[paymentController.payFee]', err.message);
    return res.status(status).json({ success: false, message: status === 500 ? MESSAGES.SERVER_ERROR : err.message });
  }
}

async function confirmPayment(req, res) {
  try {
    const feeId = parseInt(req.params.id, 10);
    const txHash = req.body?.txHash;
    const walletAddress = req.body?.walletAddress;
    if (!feeId || feeId < 1) return res.status(400).json({ success: false, message: 'Invalid fee ID.' });
    const result = await paymentService.confirmFeePayment(feeId, req.user, txHash, walletAddress);
    return res.status(200).json({ success: true, message: result.status === 'paid' ? 'Payment verified on Arc.' : 'Payment is still pending blockchain confirmation.', ...result });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 500) console.error('[paymentController.confirmPayment]', err.message);
    return res.status(status).json({ success: false, message: status === 500 ? MESSAGES.SERVER_ERROR : err.message });
  }
}

async function getReceipt(req, res) {
  try {
    const feeId = parseInt(req.params.id, 10);
    const feeRecord = await feeModel.findByIdWithStudent(feeId);
    if (!feeRecord) return res.status(404).json({ success: false, message: 'Fee record not found.' });
    if (req.user.role === ROLES.ADMIN) {
      if (feeRecord.school_id !== req.user.school_id) return res.status(403).json({ success: false, message: 'Access denied.' });
    } else {
      const student = await studentModel.findByUserId(req.user.id);
      if (!student || student.id !== feeRecord.student_id) return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const allTx = await transactionModel.findByStudent(feeRecord.student_id);
    const paidTx = allTx.find(tx => tx.status === 'paid' && tx.memo_ref === `CAMPUSARC-FEE-${feeId}-STU-${feeRecord.student_id}`);
    if (!paidTx) return res.status(404).json({ success: false, message: 'No paid transaction found for this fee record.' });
    return res.status(200).json({ success: true, ...generateReceipt(paidTx, feeRecord) });
  } catch (err) {
    console.error('[paymentController.getReceipt]', err.message);
    return res.status(500).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
}

module.exports = { listStudentFees, payFee, confirmPayment, getReceipt };
