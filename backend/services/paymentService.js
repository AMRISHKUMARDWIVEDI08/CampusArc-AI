'use strict';
const crypto=require('crypto');
const feeModel=require('../models/feeModel');
const studentModel=require('../models/studentModel');
const transactionModel=require('../models/transactionModel');
const circleService=require('./blockchain/circleService');
const {ROLES}=require('../config/constants');
async function payFee(feeId,requester){const fee=await feeModel.findByIdWithStudent(feeId);if(!fee){const e=new Error('Fee record not found.');e.statusCode=404;throw e;}if(fee.status!=='pending'||Number(fee.due_amount)<=0){const e=new Error('This fee is not payable.');e.statusCode=409;throw e;}if(requester.role===ROLES.ADMIN){if(fee.school_id!==requester.school_id){const e=new Error('Access denied.');e.statusCode=403;throw e;}}else{const student=await studentModel.findByUserId(requester.id);if(!student||student.id!==fee.student_id){const e=new Error('Access denied.');e.statusCode=403;throw e;}}
const amount=Number(fee.due_amount);const memoRef=`FEE-${feeId}-${crypto.randomUUID()}`;const txId=await transactionModel.create({student_id:fee.student_id,amount,currency:'USDC',payment_provider:'circle',memo_ref:memoRef,status:'pending'});
try{if(!fee.school_circle_wallet_id){const e=new Error('School Circle wallet is not configured.');e.statusCode=503;throw e;}if(!fee.school_wallet){const e=new Error('School destination wallet is not configured.');e.statusCode=503;throw e;}const transfer=await circleService.initiateTransfer({walletId:fee.school_circle_wallet_id,destinationAddr:requester.wallet_address||null,amountUsdc6:String(Math.round(amount*1e6)),idempotencyKey:crypto.randomUUID(),memoRef});await transactionModel.updateStatus(txId,{status:'processing',tx_hash:transfer.txHash||null});return {transactionId:txId,transferId:transfer.transferId||null,status:'processing',txHash:transfer.txHash||null,memoRef};}catch(err){await transactionModel.updateStatus(txId,{status:'failed',failure_reason:err.message});const e=new Error(err.statusCode?err.message:'Payment provider unavailable. No payment was confirmed.');e.statusCode=err.statusCode||503;throw e;}}
module.exports={payFee};
