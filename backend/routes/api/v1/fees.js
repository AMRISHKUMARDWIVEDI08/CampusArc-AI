'use strict';

const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const paymentController = require('../../../controllers/paymentController');

const router = Router();

// GET /api/v1/fees/:studentId — authorized fee ledger for one student.
router.get('/:id', authenticate, paymentController.listStudentFees);
router.post('/:id/pay', authenticate, paymentController.payFee);
router.get('/:id/receipt', authenticate, paymentController.getReceipt);

module.exports = router;
