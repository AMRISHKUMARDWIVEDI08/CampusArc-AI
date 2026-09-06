const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { env } = require('../config/env');
const { validateRegister, validateLogin } = require('../utils/validators');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, school_id: user.school_id || null }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN || '7d' });
}

async function register(req, res, next) {
  try {
    const input = validateRegister(req.body);
    const existing = await userModel.findByEmail(input.email);
    if (existing) return res.status(409).json({ error: 'email_already_registered' });
    const password_hash = await bcrypt.hash(input.password, 12);
    const user = await userModel.create({ email: input.email, name: input.name, role: 'student', school_id: input.school_id || null, password_hash });
    return res.status(201).json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role, school_id: user.school_id } });
  } catch (err) { return next(err); }
}

async function login(req, res, next) {
  try {
    const input = validateLogin(req.body);
    const user = await userModel.findByEmail(input.email);
    if (!user || !user.password_hash) return res.status(401).json({ error: 'invalid_credentials' });
    if (!(await bcrypt.compare(input.password, user.password_hash))) return res.status(401).json({ error: 'invalid_credentials' });
    return res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name, role: user.role, school_id: user.school_id } });
  } catch (err) { return next(err); }
}

module.exports = { register, login };
