'use strict';

const schoolService = require('../services/schoolService');
const { MESSAGES } = require('../config/constants');

async function list(req, res) {
  try {
    const schools = await schoolService.listSchools();
    return res.json({ success: true, schools });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || MESSAGES.SERVER_ERROR });
  }
}

async function get(req, res) {
  try {
    const schoolId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(schoolId)) return res.status(400).json({ success: false, message: 'Invalid school id.' });
    const school = await schoolService.getSchool(schoolId);
    return res.json({ success: true, school });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || MESSAGES.SERVER_ERROR });
  }
}

async function create(req, res) {
  try {
    const { school_name, wallet_address, admin_user_id } = req.body || {};
    if (!school_name) return res.status(400).json({ success: false, message: 'school_name is required.' });

    const result = await schoolService.createSchool(
      { school_name, wallet_address, admin_user_id: admin_user_id || req.user.id },
      req.user
    );

    return res.status(201).json({
      success: true,
      message: result.wallet.provisioned
        ? 'School created with an Arc payment wallet address.'
        : 'School created. Add the school Arc wallet address before accepting USDC payments.',
      ...result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message || MESSAGES.SERVER_ERROR });
  }
}

module.exports = { list, get, create };
