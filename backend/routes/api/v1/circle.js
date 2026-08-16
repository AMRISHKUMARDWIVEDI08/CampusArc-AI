'use strict';
const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const { requireRole } = require('../../../middleware/roleGuard');
const controller = require('../../../controllers/circleConfigController');
const { ROLES } = require('../../../config/constants');
const router = Router();
router.get('/status', authenticate, requireRole(ROLES.ADMIN), controller.getCircleStatus);
module.exports = router;
