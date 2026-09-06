'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const env = require('../config/env');
const { validateRegister, validateLogin } = require('../utils/validators');
const { BCRYPT_ROUNDS, MESSAGES, ROLES } = require('../config/constants');

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email || null,
    role: user.role,
    school_id: user.school_id || null,
    student_id: user.student_id || null
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: Number(user.id), id: Number(user.id), role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res, next) {
  try {
    const input = validateRegister(req.body);
    if (!input.valid) return res.status(400).json({ success: false, message: MESSAGES.VALIDATION_ERROR, errors: input.errors });

    const { username, email, password } = input.data;
    if (await userModel.usernameExists(username)) return res.status(409).json({ success: false, message: MESSAGES.USERNAME_TAKEN });
    if (email && await userModel.emailExists(email)) return res.status(409).json({ success: false, message: MESSAGES.EMAIL_TAKEN });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const id = await userModel.createUser({ username, email, passwordHash, role: ROLES.STUDENT });
    const user = await userModel.findById(Number(id));

    return res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const input = validateLogin(req.body);
    if (!input.valid) return res.status(400).json({ success: false, message: MESSAGES.VALIDATION_ERROR, errors: input.errors });

    const { login, password } = input.data;
    const user = login.includes('@')
      ? await userModel.findByEmail(login)
      : await userModel.findByUsername(login);

    if (!user || !user.password_hash) return res.status(401).json({ success: false, message: MESSAGES.INVALID_CREDENTIALS });
    if (!user.is_active) return res.status(403).json({ success: false, message: MESSAGES.ACCOUNT_INACTIVE });
    if (!(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ success: false, message: MESSAGES.INVALID_CREDENTIALS });

    await userModel.touchLastLogin(user.id);
    const freshUser = await userModel.findById(user.id);
    return res.json({ success: true, token: signToken(freshUser), user: publicUser(freshUser) });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  return res.json({ success: true, user: req.user });
}

async function logout(req, res) {
  return res.json({ success: true, message: 'Signed out successfully.' });
}

module.exports = { register, login, me, logout };
