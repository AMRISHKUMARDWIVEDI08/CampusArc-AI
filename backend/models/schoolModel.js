'use strict';
const { db } = require('../config/db');
async function findById(id){const r=await db.execute({sql:'SELECT * FROM schools WHERE id=? LIMIT 1',args:[id]});return r.rows[0]||null;}
async function findAll(){const r=await db.execute('SELECT * FROM schools ORDER BY school_name ASC');return r.rows;}
async function create({school_name}){const r=await db.execute({sql:'INSERT INTO schools (school_name) VALUES (?)',args:[school_name]});return r.lastInsertRowid;}
async function setWalletAddress(id,walletAddress){await db.execute({sql:`UPDATE schools SET wallet_address=?,updated_at=datetime('now') WHERE id=?`,args:[walletAddress,id]});}
async function nameExists(schoolName){const r=await db.execute({sql:'SELECT 1 FROM schools WHERE LOWER(school_name)=LOWER(?)',args:[schoolName]});return r.rows.length>0;}
module.exports={findById,findAll,create,setWalletAddress,nameExists};
