'use strict';
const schoolService=require('../services/schoolService');
const {MESSAGES}=require('../config/constants');
async function list(req,res){try{const schools=await schoolService.listSchools();res.json({success:true,schools});}catch(err){res.status(err.statusCode||500).json({success:false,message:err.message||MESSAGES.SERVER_ERROR});}}
async function get(req,res){try{const school=await schoolService.getSchool(parseInt(req.params.id,10));res.json({success:true,school});}catch(err){res.status(err.statusCode||500).json({success:false,message:err.message||MESSAGES.SERVER_ERROR});}}
async function create(req,res){try{const {school_name,admin_user_id}=req.body;if(!school_name)return res.status(400).json({success:false,message:'school_name is required.'});const result=await schoolService.createSchool({school_name,admin_user_id:admin_user_id||req.user.id},req.user);res.status(201).json({success:true,message:result.wallet.provisioned?'School created and Circle wallet provisioned.':'School created. Wallet provisioning failed — use /provision-wallet to retry.',...result});}catch(err){res.status(err.statusCode||500).json({success:false,message:err.message||MESSAGES.SERVER_ERROR});}}
async function provisionWallet(req,res){try{const result=await schoolService.provisionWallet(parseInt(req.params.id,10),req.user);res.json({success:true,message:result.wallet.note||'Wallet provisioned successfully.',...result});}catch(err){res.status(err.statusCode||500).json({success:false,message:err.message||MESSAGES.SERVER_ERROR});}}
module.exports={list,get,create,provisionWallet};
