'use strict';

const env = require('../../config/env');
const { ARC } = require('../../config/constants');

let rpcId = 1;

async function rpcCall(method, params = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ARC.RPC_TIMEOUT_MS);
  try {
    const response = await fetch(env.ARC_RPC || ARC.RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: rpcId++, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Arc RPC HTTP ${response.status}.`);
    const payload = await response.json();
    if (payload.error) throw new Error(`Arc RPC ${payload.error.code}: ${payload.error.message}`);
    return payload.result;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`Arc RPC timeout after ${ARC.RPC_TIMEOUT_MS}ms.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function assertAddress(address) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) throw new Error('Invalid wallet address.');
}

function assertTxHash(hash) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash || '')) throw new Error('Invalid transaction hash.');
}

async function getTransaction(hash) {
  assertTxHash(hash);
  return (await rpcCall('eth_getTransactionByHash', [hash])) || null;
}

async function getTransactionReceipt(hash) {
  assertTxHash(hash);
  return (await rpcCall('eth_getTransactionReceipt', [hash])) || null;
}

async function verifyTransaction(hash) {
  const receipt = await getTransactionReceipt(hash);
  if (!receipt) return { confirmed: false, status: 'pending', receipt: null };
  return { confirmed: true, status: receipt.status === '0x1' ? 'success' : 'failed', receipt };
}

async function getBlockNumber() {
  return parseInt(await rpcCall('eth_blockNumber'), 16);
}

function normalizeAddress(address) {
  assertAddress(address);
  return address.toLowerCase();
}

function parseErc20TransferInput(input) {
  if (typeof input !== 'string' || !input.startsWith('0x') || input.length !== 2 + 8 + 64 + 64) return null;
  if (input.slice(2, 10).toLowerCase() !== ARC.ERC20_TRANSFER_SELECTOR) return null;
  const recipient = `0x${input.slice(34, 74)}`;
  const amount = BigInt(`0x${input.slice(74, 138)}`);
  return { recipient: normalizeAddress(recipient), amount };
}

function parseTransferLog(log) {
  if (!log || typeof log.data !== 'string' || !Array.isArray(log.topics) || log.topics.length < 3) return null;
  if (String(log.topics[0]).toLowerCase() !== ARC.TRANSFER_EVENT_TOPIC) return null;
  const from = normalizeAddress(`0x${String(log.topics[1]).slice(-40)}`);
  const to = normalizeAddress(`0x${String(log.topics[2]).slice(-40)}`);
  const amount = BigInt(log.data);
  return { token: normalizeAddress(log.address), from, to, amount };
}

async function verifyUsdcTransfer({ txHash, sender, destination, amountBaseUnits }) {
  const tx = await getTransaction(txHash);
  if (!tx) return { confirmed: false, status: 'pending', reason: 'Transaction not indexed yet.' };
  const receipt = await getTransactionReceipt(txHash);
  if (!receipt) return { confirmed: false, status: 'pending', reason: 'Receipt not indexed yet.' };
  if (receipt.status !== '0x1') return { confirmed: true, status: 'failed', receipt };

  const expectedSender = normalizeAddress(sender);
  const expectedDestination = normalizeAddress(destination);
  const txFrom = normalizeAddress(tx.from);
  const txTo = normalizeAddress(tx.to);
  const chainId = tx.chainId ? parseInt(tx.chainId, 16) : ARC.CHAIN_ID;
  const parsedInput = parseErc20TransferInput(tx.input);
  const expectedAmount = BigInt(String(amountBaseUnits));

  if (chainId !== ARC.CHAIN_ID) throw new Error('Transaction was sent on the wrong network.');
  if (txFrom !== expectedSender) throw new Error('Transaction sender does not match connected wallet.');
  if (txTo !== ARC.USDC_TOKEN) throw new Error('Transaction token contract is not the Arc USDC contract.');
  if (!parsedInput || parsedInput.recipient !== expectedDestination || parsedInput.amount !== expectedAmount) {
    throw new Error('Transaction amount or destination does not match this fee.');
  }

  const matchingLog = (receipt.logs || []).map(parseTransferLog).find((log) => log && log.token === ARC.USDC_TOKEN && log.from === expectedSender && log.to === expectedDestination && log.amount === expectedAmount);
  if (!matchingLog) throw new Error('No matching USDC transfer event was found in the confirmed transaction.');

  return { confirmed: true, status: 'success', receipt, blockNumber: parseInt(receipt.blockNumber, 16) };
}

module.exports = { rpcCall, getTransaction, getTransactionReceipt, verifyTransaction, verifyUsdcTransfer, getBlockNumber };
