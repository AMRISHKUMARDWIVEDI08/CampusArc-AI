'use strict';

const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const paymentController = require('../../../controllers/paymentController');

const router = Router();
router.get('/:id', authenticate, paymentController.listStudentFees);
router.post('/:id/pay', authenticate, paymentController.payFee);
router.post('/:id/confirm', authenticate, paymentController.confirmPayment);
router.get('/:id/receipt', authenticate, paymentController.getReceipt);

module.exports = router;
