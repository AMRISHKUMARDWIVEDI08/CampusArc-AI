'use strict';

const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const { requireRole } = require('../../../middleware/roleGuard');
const schoolController = require('../../../controllers/schoolController');
const circleConfigController = require('../../../controllers/circleConfigController');

const router = Router();
router.get('/', authenticate, schoolController.list);
router.get('/:id', authenticate, schoolController.get);
router.get('/:id/circle-status', authenticate, requireRole('admin'), circleConfigController.getCircleStatus);
router.post('/', authenticate, requireRole('admin'), schoolController.create);
router.post('/:id/provision-wallet', authenticate, requireRole('admin'), schoolController.provisionWallet);

module.exports = router;
