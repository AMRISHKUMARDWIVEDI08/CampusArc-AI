'use strict';

const feeModel = require('../models/feeModel');
const studentModel = require('../models/studentModel');
const transactionModel = require('../models/transactionModel');
const { ARC, ROLES } = require('../config/constants');
const arcService = require('./blockchain/arcService');
const crypto = require('crypto');

function badRequest(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toUsdc6(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw badRequest('Payment amount must be greater than zero.');
  const scaled = Math.round(value * 1_000_000);
  if (scaled <= 0) throw badRequest('Payment amount is below the supported USDC precision.');
  return String(scaled);
}

async function assertFeeAccess(feeId, requester) {
  const fee = await feeModel.findByIdWithStudent(feeId);
  if (!fee) throw badRequest('Fee record not found.', 404);
  if (requester.role === ROLES.ADMIN) {
    if (!requester.school_id || Number(requester.school_id) !== Number(fee.school_id)) throw badRequest('Access denied.', 403);
  } else if (requester.role === ROLES.STUDENT) {
    const student = await studentModel.findByUserId(requester.id);
    if (!student || Number(student.id) !== Number(fee.student_id)) throw badRequest('Access denied.', 403);
  } else {
    throw badRequest('Access denied.', 403);
  }
  return fee;
}

async function payFee(feeId, requester, walletAddress) {
  const fee = await assertFeeAccess(feeId, requester);
  if (fee.status === 'paid' || Number(fee.due_amount) <= 0) throw badRequest('This fee is not payable.', 409);
  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) throw badRequest('A valid payer wallet address is required.');
  if (!fee.school_wallet || !/^0x[0-9a-fA-F]{40}$/.test(fee.school_wallet)) throw badRequest('School destination wallet is not configured.', 503);

  const memoRef = `CAMPUSARC-FEE-${feeId}-STU-${fee.student_id}`;
  const existing = await transactionModel.findByMemoRef(memoRef);
  if (existing && (existing.status === 'paid' || existing.status === 'processing')) {
    return { transaction: existing, status: existing.status, paymentRequired: false };
  }

  let txId = existing?.id;
  if (!txId) {
    txId = await transactionModel.create({
      student_id: fee.student_id,
      amount: fee.due_amount,
      currency: 'USDC',
      payment_provider: 'arc_wallet',
      memo_ref: memoRef,
      tx_hash: null,
      receipt_id: `RCP-${crypto.randomUUID()}`,
    });
  }

  return {
    transactionId: txId,
    status: 'payment_required',
    paymentRequired: true,
    network: 'Arc Testnet',
    chainId: ARC.CHAIN_ID,
    tokenAddress: ARC.USDC_TOKEN,
    tokenDecimals: ARC.USDC_DECIMALS,
    destinationAddress: fee.school_wallet.toLowerCase(),
    amount: Number(fee.due_amount),
    amountBaseUnits: toUsdc6(fee.due_amount),
    memoRef,
  };
}

async function confirmFeePayment(feeId, requester, txHash, walletAddress) {
  const fee = await assertFeeAccess(feeId, requester);
  if (fee.status === 'paid') return { status: 'paid', alreadyPaid: true };
  if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw badRequest('Invalid transaction hash.');
  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) throw badRequest('Valid payer wallet address is required.');
  if (!fee.school_wallet) throw badRequest('School destination wallet is not configured.', 503);

  const result = await arcService.verifyUsdcTransfer({
    txHash,
    sender: walletAddress,
    destination: fee.school_wallet,
    amountBaseUnits: toUsdc6(fee.due_amount),
  });

  if (result.status === 'pending') return { status: 'pending', transactionHash: txHash };
  if (result.status !== 'success') throw badRequest('The blockchain transaction failed or was reverted.', 409);

  const memoRef = `CAMPUSARC-FEE-${feeId}-STU-${fee.student_id}`;
  let tx = await transactionModel.findByMemoRef(memoRef);
  if (!tx) {
    const txId = await transactionModel.create({
      student_id: fee.student_id,
      amount: fee.due_amount,
      currency: 'USDC',
      payment_provider: 'arc_wallet',
      memo_ref: memoRef,
      tx_hash: txHash,
      receipt_id: `RCP-${crypto.randomUUID()}`,
    });
    tx = await transactionModel.findById(txId);
  }

  await transactionModel.updateStatus(tx.id, {
    status: 'paid',
    tx_hash: txHash,
    block_ref: result.blockNumber != null ? String(result.blockNumber) : null,
    failure_reason: null,
  });
  await feeModel.update(feeId, { status: 'paid', due_amount: 0 });

  return { status: 'paid', transactionId: tx.id, transactionHash: txHash, blockNumber: result.blockNumber };
}

module.exports = { payFee, confirmFeePayment };
