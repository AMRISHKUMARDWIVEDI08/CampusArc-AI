'use strict';
const { db } = require('../config/db');
async function findBySetId(walletSetId){const r=await db.execute({sql:'SELECT * FROM circle_wallet_sets WHERE wallet_set_id=? LIMIT 1',args:[walletSetId]});return r.rows[0]||null;}
async function findDefault(){const r=await db.execute("SELECT * FROM circle_wallet_sets ORDER BY created_at ASC LIMIT 1");return r.rows[0]||null;}
async function create({wallet_set_id,set_name,custody_type}){const r=await db.execute({sql:'INSERT INTO circle_wallet_sets (wallet_set_id,set_name,custody_type) VALUES (?,?,?)',args:[wallet_set_id,set_name,custody_type||'DEVELOPER']});return r.lastInsertRowid;}
module.exports={findBySetId,findDefault,create};
