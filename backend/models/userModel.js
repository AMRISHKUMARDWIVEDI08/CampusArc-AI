'use strict';
const {db}=require('../config/db');
const selectBase="SELECT users.id,users.username,users.email,users.role,users.is_active,users.wallet_address,COALESCE(users.school_id,students.school_id) AS school_id,users.last_login,users.created_at,users.updated_at,students.id AS student_id FROM users LEFT JOIN students ON students.user_id=users.id ";
async function findById(id){const r=await db.execute({sql:selectBase+'WHERE users.id=? LIMIT 1',args:[id]});return r.rows[0]||null;}
async function findByUsername(username){const r=await db.execute({sql:selectBase+'WHERE LOWER(users.username)=LOWER(?) LIMIT 1',args:[username]});return r.rows[0]||null;}
async function findByEmail(email){const r=await db.execute({sql:selectBase+'WHERE LOWER(users.email)=LOWER(?) LIMIT 1',args:[email]});return r.rows[0]||null;}
async function findByWalletAddress(walletAddress){const r=await db.execute({sql:selectBase+'WHERE LOWER(users.wallet_address)=LOWER(?) LIMIT 1',args:[walletAddress]});return r.rows[0]||null;}
async function usernameExists(username){const r=await db.execute({sql:'SELECT 1 FROM users WHERE LOWER(username)=LOWER(?)',args:[username]});return r.rows.length>0;}
async function emailExists(email){const r=await db.execute({sql:'SELECT 1 FROM users WHERE LOWER(email)=LOWER(?)',args:[email]});return r.rows.length>0;}
async function createUser({username,email,passwordHash,role}){const r=await db.execute({sql:'INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)',args:[username,email||null,passwordHash,role]});return r.lastInsertRowid;}
async function touchLastLogin(id){await db.execute({sql:"UPDATE users SET last_login=datetime('now'),updated_at=datetime('now') WHERE id=?",args:[id]});}
async function deactivateUser(id){await db.execute({sql:"UPDATE users SET is_active=0,updated_at=datetime('now') WHERE id=?",args:[id]});}
async function setSchoolId(id,schoolId){await db.execute({sql:"UPDATE users SET school_id=?,updated_at=datetime('now') WHERE id=?",args:[schoolId,id]});}
async function setWalletAddress(id,walletAddress){await db.execute({sql:"UPDATE users SET wallet_address=?,updated_at=datetime('now') WHERE id=?",args:[walletAddress,id]});}
module.exports={findById,findByUsername,findByEmail,findByWalletAddress,usernameExists,emailExists,createUser,touchLastLogin,deactivateUser,setSchoolId,setWalletAddress};