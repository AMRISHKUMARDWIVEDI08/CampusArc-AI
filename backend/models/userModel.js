'use strict';
const { db } = require('../config/db');
async function findById(id){const r=await db.execute({sql:`SELECT id,username,email,role,is_active,school_id,last_login,created_at,updated_at FROM users LEFT JOIN students ON students.user_id=users.id WHERE users.id=? LIMIT 1`,args:[id]});return r.rows[0]||null;}
async function findByUsername(username){const r=await db.execute({sql:`SELECT users.id,users.username,users.email,users.password_hash,users.role,users.is_active,users.last_login,users.created_at,users.updated_at,students.school_id,students.id AS student_id FROM users LEFT JOIN students ON students.user_id=users.id WHERE LOWER(users.username)=LOWER(?) LIMIT 1`,args:[username]});return r.rows[0]||null;}
async function findByEmail(email){const r=await db.execute({sql:`SELECT users.id,users.username,users.email,users.password_hash,users.role,users.is_active,users.last_login,users.created_at,users.updated_at,students.school_id,students.id AS student_id FROM users LEFT JOIN students ON students.user_id=users.id WHERE LOWER(users.email)=LOWER(?) LIMIT 1`,args:[email]});return r.rows[0]||null;}
async function usernameExists(username){const r=await db.execute({sql:'SELECT 1 FROM users WHERE LOWER(username)=LOWER(?)',args:[username]});return r.rows.length>0;}
async function emailExists(email){const r=await db.execute({sql:'SELECT 1 FROM users WHERE LOWER(email)=LOWER(?)',args:[email]});return r.rows.length>0;}
async function createUser({username,email,passwordHash,role}){const r=await db.execute({sql:'INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)',args:[username,email||null,passwordHash,role]});return r.lastInsertRowid;}
async function touchLastLogin(id){await db.execute({sql:`UPDATE users SET last_login=datetime('now'),updated_at=datetime('now') WHERE id=?`,args:[id]});}
async function deactivateUser(id){await db.execute({sql:`UPDATE users SET is_active=0,updated_at=datetime('now') WHERE id=?`,args:[id]});}
module.exports={findById,findByUsername,findByEmail,usernameExists,emailExists,createUser,touchLastLogin,deactivateUser};
