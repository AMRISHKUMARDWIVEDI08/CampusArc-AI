'use strict';
const circleService=require('../services/blockchain/circleService');
const schoolModel=require('../models/schoolModel');
const circleWalletSetModel=require('../models/circleWalletSetModel');
const {ROLES,MESSAGES}=require('../config/constants');
async function getCircleStatus(req,res){try{const schoolId=parseInt(req.params.id,10);if(req.user.role!==ROLES.ADMIN||req.user.school_id!==schoolId)return res.status(403).json({success:false,message:MESSAGES.FORBIDDEN});const school=await schoolModel.findById(schoolId);if(!school)return res.status(404).json({success:false,message:'School not found.'});const configSummary=circleService.getConfigSummary();let walletSet=null;if(school.wallet_set_id)walletSet=await circleWalletSetModel.findBySetId(school.wallet_set_id);return res.status(200).json({success:true,config:configSummary,walletSet:walletSet?{walletSetId:walletSet.wallet_set_id,setName:walletSet.set_name,custodyType:walletSet.custody_type,createdAt:walletSet.created_at}:null,schoolWallet:{provisioned:!!school.wallet_address,walletId:school.circle_wallet_id||null,walletAddress:school.wallet_address||null}});}catch(err){console.error('[circleConfigController.getCircleStatus]',err.message);return res.status(500).json({success:false,message:MESSAGES.SERVER_ERROR});}}
module.exports={getCircleStatus};
