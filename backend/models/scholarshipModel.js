'use strict';
const { db } = require('../config/db');
async function findRuleById(id){const r=await db.execute({sql:'SELECT * FROM scholarship_rules WHERE id=? LIMIT 1',args:[id]});return r.rows[0]||null;}
async function findRulesBySchool(schoolId,activeOnly=true){const r=await db.execute({sql:activeOnly?'SELECT * FROM scholarship_rules WHERE school_id=? AND is_active=1 ORDER BY created_at ASC':'SELECT * FROM scholarship_rules WHERE school_id=? ORDER BY created_at ASC',args:[schoolId]});return r.rows;}
async function findActiveRulesBySchool(id){return findRulesBySchool(id,true);}
async function createRule({school_id,rule_name,rule_type,threshold_value,window_days,award_type,award_value}){const r=await db.execute({sql:`INSERT INTO scholarship_rules(school_id,rule_name,rule_type,threshold_value,window_days,award_type,award_value) VALUES(?,?,?,?,?,?,?)`,args:[school_id,rule_name,rule_type,threshold_value,window_days,award_type,award_value]});return r.lastInsertRowid;}
async function deactivateRule(id){await db.execute({sql:`UPDATE scholarship_rules SET is_active=0,updated_at=datetime('now') WHERE id=?`,args:[id]});}
async function findAwardById(id){const r=await db.execute({sql:'SELECT * FROM scholarship_awards WHERE id=? LIMIT 1',args:[id]});return r.rows[0]||null;}
async function findAwardsByStudent(studentId){const r=await db.execute({sql:`SELECT sa.*,sr.rule_name,sr.rule_type FROM scholarship_awards sa JOIN scholarship_rules sr ON sr.id=sa.rule_id WHERE sa.student_id=? ORDER BY sa.created_at DESC`,args:[studentId]});return r.rows;}
async function findAwardsBySchool(schoolId){const r=await db.execute({sql:`SELECT sa.*,sr.rule_name,st.name AS student_name,st.roll_no FROM scholarship_awards sa JOIN scholarship_rules sr ON sr.id=sa.rule_id JOIN students st ON st.id=sa.student_id WHERE sr.school_id=? ORDER BY sa.created_at DESC`,args:[schoolId]});return r.rows;}
async function awardAlreadyExists(ruleId,studentId,from,to){const r=await db.execute({sql:`SELECT 1 FROM scholarship_awards WHERE rule_id=? AND student_id=? AND evaluated_from=? AND evaluated_to=? AND status='applied' LIMIT 1`,args:[ruleId,studentId,from,to]});return r.rows.length>0;}
async function findApplicationByStudentAndRule(studentId,ruleId,feeId){const r=await db.execute({sql:`SELECT * FROM scholarship_awards WHERE student_id=? AND rule_id=? AND fee_id=? AND status='applied' LIMIT 1`,args:[studentId,ruleId,feeId]});return r.rows[0]||null;}
async function createApplication({student_id,rule_id,fee_id,discount_amount,rule_snapshot}){
  const s=rule_snapshot||{};
  const awardType=s.discount_type==='percent'?'fee_discount_percent':'fee_discount_fixed';
  const awardValue=Number(s.discount_value||0);
  const attendancePct=Number(s.eval_stats?.percentage||0);
  const evaluatedFrom=s.window?.fromDate||new Date().toISOString().slice(0,10);
  const evaluatedTo=s.window?.toDate||new Date().toISOString().slice(0,10);
  return createAward({rule_id,student_id,fee_id,award_type:awardType,award_value:awardValue,discount_applied:Number(discount_amount||0),attendance_pct:attendancePct,evaluated_from:evaluatedFrom,evaluated_to:evaluatedTo,status:'applied'});
}
async function createAward({rule_id,student_id,fee_id,award_type,award_value,discount_applied,attendance_pct,evaluated_from,evaluated_to,status='applied',skip_reason}){const r=await db.execute({sql:`INSERT INTO scholarship_awards(rule_id,student_id,fee_id,award_type,award_value,discount_applied,attendance_pct,evaluated_from,evaluated_to,status,skip_reason) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,args:[rule_id,student_id,fee_id||null,award_type,award_value,discount_applied,attendance_pct,evaluated_from,evaluated_to,status,skip_reason||null]});return r.lastInsertRowid;}
async function findApplicationsByStudent(studentId){return findAwardsByStudent(studentId);}
async function updateApplicationStatus(id,{status,transfer_id,tx_hash}){const allowed=['applied','skipped','failed'];if(!allowed.includes(status))return;const reason=tx_hash?`transfer:${transfer_id||''} tx:${tx_hash}`:null;await db.execute({sql:`UPDATE scholarship_awards SET status=?,skip_reason=COALESCE(?,skip_reason) WHERE id=?`,args:[status,reason,id]});}
module.exports={findRuleById,findRulesBySchool,findActiveRulesBySchool,createRule,deactivateRule,findAwardById,findAwardsByStudent,findAwardsBySchool,awardAlreadyExists,createAward,findApplicationByStudentAndRule,createApplication,findApplicationsByStudent,updateApplicationStatus};
