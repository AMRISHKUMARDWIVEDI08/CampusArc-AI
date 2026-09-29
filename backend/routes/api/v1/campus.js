'use strict';
const { Router } = require('express');
const { authenticate } = require('../../../middleware/auth');
const { requireRole } = require('../../../middleware/roleGuard');
const controller = require('../../../controllers/campusController');

const router = Router();
router.use(authenticate);
router.get('/school/:schoolId/overview', requireRole('admin'), controller.schoolOverview);
router.get('/school/:schoolId/students', requireRole('admin'), controller.schoolStudents);
router.post('/school/:schoolId/homework', requireRole('admin'), controller.createHomework);
router.post('/school/:schoolId/circulars', requireRole('admin'), controller.createCircular);
router.post('/school/:schoolId/fees', requireRole('admin'), controller.createFee);
router.post('/school/:schoolId/attendance', requireRole('admin'), controller.recordAttendance);
router.post('/school/:schoolId/exams', requireRole('admin'), controller.recordExam);
module.exports = router;
