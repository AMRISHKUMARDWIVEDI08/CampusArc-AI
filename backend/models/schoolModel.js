'use strict';
const crypto=require('crypto');
const {db}=require('../config/db');
async function findById(id){const r=await db.execute({sql:'SELECT * FROM schools WHERE id=? LIMIT 1',args:[id]});return r.rows[0]||null;}
async function findByJoinCode(code){const r=await db.execute({sql:'SELECT * FROM schools WHERE UPPER(join_code)=UPPER(?) LIMIT 1',args:[code]});return r.rows[0]||null;}
async function findAll(){const r=await db.execute('SELECT * FROM schools ORDER BY school_name ASC');return r.rows;}
async function create({school_name}){for(let i=0;i<5;i+=1){const joinCode='CAMPUS-'+crypto.randomBytes(4).toString('hex').toUpperCase();try{const r=await db.execute({sql:'INSERT INTO schools (school_name,join_code) VALUES (?,?)',args:[school_name,joinCode]});return r.lastInsertRowid;}catch(err){if(!String(err.message||'').toLowerCase().includes('unique'))throw err;}}throw new Error('Could not generate a unique school join code.');}
async function setWalletAddress(id,walletAddress){await db.execute({sql:"UPDATE schools SET wallet_address=?,updated_at=datetime('now') WHERE id=?",args:[walletAddress,id]});}
async function nameExists(schoolName){const r=await db.execute({sql:'SELECT 1 FROM schools WHERE LOWER(school_name)=LOWER(?)',args:[schoolName]});return r.rows.length>0;}
module.exports={findById,findByJoinCode,findAll,create,setWalletAddress,nameExists};