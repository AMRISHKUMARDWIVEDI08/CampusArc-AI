'use strict';

const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const controller = require('../../../controllers/academicController');

const router = Router();
router.get('/student/:studentId', authenticate, controller.studentOverview);

module.exports = router;
