'use strict';

const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const { requireRole } = require('../../../middleware/roleGuard');
const schoolController = require('../../../controllers/schoolController');

const router = Router();

router.get('/', authenticate, schoolController.list);
router.get('/:id', authenticate, schoolController.get);
router.post('/', authenticate, requireRole('admin'), schoolController.create);

module.exports = router;
