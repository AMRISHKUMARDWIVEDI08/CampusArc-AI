'use strict';

const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const controller = require('../../../controllers/transactionController');

const router = Router();
router.get('/student/:studentId', authenticate, controller.studentTransactions);
router.get('/school/:schoolId', authenticate, controller.schoolTransactions);

module.exports = router;
