'use strict';

const schoolModel = require('../models/schoolModel');
const userModel = require('../models/userModel');
const { ROLES } = require('../config/constants');

function normalizeWalletAddress(value) {
  const wallet = String(value || '').trim();
  if (!wallet) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    const error = new Error('wallet_address must be a valid EVM wallet address.');
    error.statusCode = 400;
    throw error;
  }
  return wallet;
}

async function createSchool({ school_name, wallet_address, admin_user_id }, requester) {
  if (requester.role !== ROLES.ADMIN) {
    const error = new Error('Only admin accounts can create schools.');
    error.statusCode = 403;
    throw error;
  }
  if (!school_name || school_name.trim().length < 3) {
    const error = new Error('school_name must be at least 3 characters.');
    error.statusCode = 400;
    throw error;
  }

  const walletAddress = normalizeWalletAddress(wallet_address);
  if (await schoolModel.nameExists(school_name)) {
    const error = new Error(`A school named "${school_name}" already exists.`);
    error.statusCode = 409;
    throw error;
  }

  const schoolId = await schoolModel.create({ school_name: school_name.trim() });
  if (walletAddress) await schoolModel.setWalletAddress(schoolId, walletAddress);

  const adminId = admin_user_id || requester.id;
  if (adminId) {
    const adminUser = await userModel.findById(adminId);
    if (adminUser && adminUser.role === ROLES.ADMIN) await userModel.setSchoolId(adminId, schoolId);
  }

  return {
    school: await schoolModel.findById(schoolId),
    wallet: {
      walletAddress,
      provisioned: Boolean(walletAddress),
      note: walletAddress ? 'School wallet address saved for Arc USDC payments.' : 'No school wallet address configured yet.'
    }
  };
}

async function getSchool(schoolId) {
  const school = await schoolModel.findById(schoolId);
  if (!school) {
    const error = new Error('School not found.');
    error.statusCode = 404;
    throw error;
  }
  return school;
}

async function listSchools() {
  return schoolModel.findAll();
}

module.exports = { createSchool, getSchool, listSchools };
