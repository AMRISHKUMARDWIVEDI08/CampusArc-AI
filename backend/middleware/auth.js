'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { MESSAGES } = require('../config/constants');
const userModel = require('../models/userModel');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }
    const token = header.slice(7).trim();
    if (!token) return res.status(401).json({ success: false, message: MESSAGES.UNAUTHORIZED });

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : MESSAGES.UNAUTHORIZED });
    }

    if (!payload || !Number.isInteger(Number(payload.id))) {
      return res.status(401).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }

    const user = await userModel.findById(Number(payload.id));
    if (!user) return res.status(401).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    if (!user.is_active) return res.status(403).json({ success: false, message: MESSAGES.ACCOUNT_INACTIVE });

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      school_id: user.school_id || null,
      student_id: user.student_id || null
    };
    return next();
  } catch (err) {
    console.error('[auth] Middleware error:', err.message);
    return res.status(500).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
}

module.exports = { authenticate };
