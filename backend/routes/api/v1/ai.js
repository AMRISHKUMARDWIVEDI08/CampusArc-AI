'use strict';

const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const controller = require('../../../controllers/aiController');

const router = Router();
router.post('/assistant', authenticate, controller.assistant);

module.exports = router;
