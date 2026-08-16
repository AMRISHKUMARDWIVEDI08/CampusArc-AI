'use strict';
const { db } = require('../config/db');
async function findById(id){const r=await db.execute({sql:'SELECT * FROM fees WHERE id=? LIMIT 1',args:[id]});return r.rows[0]||null;}
async function findByIdWithStudent(id){const r=await db.execute({sql:`SELECT f.*,s.user_id,s.school_id,s.name AS student_name,sc.school_name,sc.wallet_address AS school_wallet,sc.circle_wallet_id AS school_circle_wallet_id FROM fees f JOIN students s ON s.id=f.student_id JOIN schools sc ON sc.id=s.school_id WHERE f.id=? LIMIT 1`,args:[id]});return r.rows[0]||null;}
async function update(id,fields){const allowed=['status','due_amount'];const keys=Object.keys(fields).filter(k=>allowed.includes(k));if(!keys.length)return;const sets=keys.map(k=>`${k}=?`).join(', ');await db.execute({sql:`UPDATE fees SET ${sets},updated_at=datetime('now') WHERE id=?`,args:[...keys.map(k=>fields[k]),id]});}
module.exports={findById,findByIdWithStudent,update};
