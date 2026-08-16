'use strict';
const { db } = require('../config/db');
async function attendancePercentage(studentId,fromDate,toDate){const r=await db.execute({sql:`SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(status)='present' THEN 1 ELSE 0 END) AS present FROM attendance WHERE student_id=? AND date BETWEEN ? AND ?`,args:[studentId,fromDate,toDate]});const row=r.rows[0]||{};const total=Number(row.total||0);const present=Number(row.present||0);return {total,present,percentage:total?Number(((present/total)*100).toFixed(2)):0};}
module.exports={attendancePercentage};
