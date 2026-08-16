'use strict';
const { db } = require('../config/db');
async function findById(id) { const r=await db.execute({sql:'SELECT * FROM students WHERE id=? LIMIT 1',args:[id]}); return r.rows[0]||null; }
async function findByUserId(userId) { const r=await db.execute({sql:'SELECT * FROM students WHERE user_id=? LIMIT 1',args:[userId]}); return r.rows[0]||null; }
async function findBySchool(schoolId) { const r=await db.execute({sql:'SELECT * FROM students WHERE school_id=? ORDER BY name ASC',args:[schoolId]}); return r.rows; }
module.exports={findById,findByUserId,findBySchool};
