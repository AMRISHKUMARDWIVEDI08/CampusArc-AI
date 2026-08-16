'use strict';
const {circleConfig,validateCircleConfig}=require('../../config/circle');
function notImplemented(methodName){return Promise.reject(new Error(`[circleService.${methodName}] Not implemented. Circle integration is not configured for live execution.`));}
async function createWallet(){validateCircleConfig();return notImplemented('createWallet');}
async function getWalletBalance(){validateCircleConfig();return notImplemented('getWalletBalance');}
async function listWallets(){validateCircleConfig();return notImplemented('listWallets');}
async function initiateTransfer(){validateCircleConfig();return notImplemented('initiateTransfer');}
async function getTransferStatus(){validateCircleConfig();return notImplemented('getTransferStatus');}
async function getEntityConfig(){validateCircleConfig();return notImplemented('getEntityConfig');}
function getConfigSummary(){return {blockchainTag:circleConfig.blockchainTag,walletCustodyType:circleConfig.walletCustodyType,accountType:circleConfig.accountType,contractTemplateId:circleConfig.contractTemplateId,apiBaseUrl:circleConfig.apiBaseUrl,apiKeySet:!!circleConfig.apiKey,entitySecretSet:!!circleConfig.entitySecret};}
module.exports={createWallet,getWalletBalance,listWallets,initiateTransfer,getTransferStatus,getEntityConfig,getConfigSummary};
