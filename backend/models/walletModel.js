'use strict';
const { db } = require('../config/db');
async function createChallenge({walletAddress,nonce,message,expiresAt}){const r=await db.execute({sql:'INSERT INTO wallet_challenges (wallet_address,nonce,message,expires_at) VALUES (?,?,?,?)',args:[walletAddress,nonce,message,expiresAt]});return r.lastInsertRowid;}
async function findChallenge(nonce){const r=await db.execute({sql:'SELECT * FROM wallet_challenges WHERE nonce=? LIMIT 1',args:[nonce]});return r.rows[0]||null;}
async function consumeChallenge(id){const r=await db.execute({sql:"UPDATE wallet_challenges SET used_at=datetime('now') WHERE id=? AND used_at IS NULL",args:[id]});return Number(r.rowsAffected||0)===1;}
async function deleteExpired(){await db.execute("DELETE FROM wallet_challenges WHERE expires_at < datetime('now') OR used_at IS NOT NULL");}
module.exports={createChallenge,findChallenge,consumeChallenge,deleteExpired};