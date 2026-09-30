'use strict';

const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const { BCRYPT_ROUNDS, MESSAGES } = require('../config/constants');

const allowedRoles = new Set(['parent','teacher']);

function id(value){const n=Number.parseInt(value,10);return Number.isInteger(n)&&n>0?n:null;}
function text(value,max=200){return String(value??'').trim().slice(0,max);}

async function createAccount(req,res){
  const schoolId=id(req.params.schoolId);
  if(req.user?.role!=='admin'||!schoolId||Number(req.user.school_id)!==schoolId) return res.status(403).json({success:false,message:MESSAGES.FORBIDDEN});
  const role=text(req.body?.role,20).toLowerCase();
  const username=text(req.body?.username,32);
  const email=text(req.body?.email,254).toLowerCase()||null;
  const password=text(req.body?.password,72);
  if(!allowedRoles.has(role)||username.length<3||password.length<8) return res.status(400).json({success:false,message:'role, username and a password of at least 8 characters are required.'});
  const exists=await db.execute({sql:'SELECT id FROM users WHERE LOWER(username)=LOWER(?) OR (? IS NOT NULL AND LOWER(email)=LOWER(?)) LIMIT 1',args:[username,email,email]});
  if(exists.rows.length) return res.status(409).json({success:false,message:'Username or email is already registered.'});
  let studentId=null;
  if(role==='parent'){
    studentId=id(req.body?.student_id);
    if(!studentId) return res.status(400).json({success:false,message:'student_id is required for a parent account.'});
    const student=await db.execute({sql:'SELECT id FROM students WHERE id=? AND school_id=? LIMIT 1',args:[studentId,schoolId]});
    if(!student.rows.length) return res.status(404).json({success:false,message:'Student not found in this school.'});
  }
  const hash=await bcrypt.hash(password,BCRYPT_ROUNDS);
  const user=await db.execute({sql:'INSERT INTO users(username,email,password_hash,role,school_id) VALUES(?,?,?,?,?)',args:[username,email,hash,role,schoolId]});
  const userId=Number(user.lastInsertRowid);
  if(role==='parent'){
    await db.execute({sql:'INSERT INTO parent_student_links(parent_user_id,student_id,relationship) VALUES(?,?,?)',args:[userId,studentId,text(req.body?.relationship,40)||'guardian']});
  } else {
    await db.execute({sql:'INSERT INTO teacher_assignments(teacher_user_id,school_id,subject,class_name,section) VALUES(?,?,?,?,?)',args:[userId,schoolId,text(req.body?.subject,120)||null,text(req.body?.class_name,80)||null,text(req.body?.section,30)||null]});
  }
  return res.status(201).json({success:true,user:{id:userId,username,email,role,school_id:schoolId},message:role==='parent'?'Parent account created.':'Teacher account created.'});
}

async function family(req,res){
  const parentId=Number(req.user?.id);
  if(req.user?.role!=='parent') return res.status(403).json({success:false,message:MESSAGES.FORBIDDEN});
  const result=await db.execute({sql:`SELECT s.id,s.name,s.roll_no,s.class_name,s.section,psl.relationship
    FROM parent_student_links psl JOIN students s ON s.id=psl.student_id
    WHERE psl.parent_user_id=? ORDER BY s.name`,args:[parentId]});
  return res.json({success:true,students:result.rows});
}

async function teacher(req,res){
  const teacherId=Number(req.user?.id);
  if(!['teacher','staff'].includes(req.user?.role)) return res.status(403).json({success:false,message:MESSAGES.FORBIDDEN});
  const assignments=await db.execute({sql:'SELECT id,school_id,subject,class_name,section FROM teacher_assignments WHERE teacher_user_id=? ORDER BY class_name,section,subject',args:[teacherId]});
  const schoolId=req.user.school_id;
  const [students,homework,circulars]=await Promise.all([
    db.execute({sql:'SELECT id,name,roll_no,class_name,section FROM students WHERE school_id=? ORDER BY class_name,section,name',args:[schoolId]}),
    db.execute({sql:'SELECT id,title,content,date FROM homework WHERE school_id=? ORDER BY date DESC,id DESC LIMIT 30',args:[schoolId]}),
    db.execute({sql:'SELECT id,title,content_hash,timestamp FROM circulars WHERE school_id=? ORDER BY timestamp DESC,id DESC LIMIT 30',args:[schoolId]})
  ]);
  return res.json({success:true,assignments:assignments.rows,students:students.rows,homework:homework.rows,circulars:circulars.rows});
}
module.exports={createAccount,family,teacher};
