'use client';

const ARC_CHAIN_ID_HEX = '0x4cf4b2';
const ARC_CHAIN_ID = 5042002;
const ARC_NETWORK = {
  chainId: ARC_CHAIN_ID_HEX,
  chainName: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app'],
};

function getInjectedProvider() {
  if (typeof window === 'undefined') return null;
  if (window.ethereum?.request) return window.ethereum;
  return null;
}

export async function connectWallet() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error('No compatible browser wallet was detected. Open CampusArc AI in your wallet browser or install a browser wallet extension.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  const address = accounts?.[0];
  if (!address) throw new Error('Wallet did not return an account.');
  await ensureArcNetwork(provider);
  return { provider, address };
}

async function ensureArcNetwork(provider) {
  const current = await provider.request({ method: 'eth_chainId' });
  if (String(current).toLowerCase() === ARC_CHAIN_ID_HEX) return;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_ID_HEX }] });
  } catch (error) {
    if (error?.code !== 4902) throw new Error('Please switch your wallet to Arc Testnet to continue.');
    await provider.request({ method: 'wallet_addEthereumChain', params: [ARC_NETWORK] });
  }
  const confirmed = await provider.request({ method: 'eth_chainId' });
  if (String(confirmed).toLowerCase() !== ARC_CHAIN_ID_HEX) throw new Error('Wallet network could not be switched to Arc Testnet.');
}

function encodeTransfer(to, amountBaseUnits) {
  const address = String(to || '').replace(/^0x/, '').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(address)) throw new Error('Invalid recipient wallet address.');
  const amount = BigInt(String(amountBaseUnits));
  if (amount <= 0n) throw new Error('Invalid payment amount.');
  return `0xa9059cbb${address.padStart(64, '0')}${amount.toString(16).padStart(64, '0')}`;
}

export async function sendUsdcTransfer({ provider, from, tokenAddress, destinationAddress, amountBaseUnits }) {
  if (!provider?.request) throw new Error('Wallet connection is unavailable.');
  if (!/^0x[0-9a-fA-F]{40}$/.test(from || '')) throw new Error('Invalid wallet address.');
  if (!/^0x[0-9a-fA-F]{40}$/.test(tokenAddress || '')) throw new Error('Invalid USDC contract address.');
  if (!/^0x[0-9a-fA-F]{40}$/.test(destinationAddress || '')) throw new Error('Invalid school wallet address.');
  await ensureArcNetwork(provider);
  return provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: tokenAddress, value: '0x0', data: encodeTransfer(destinationAddress, amountBaseUnits) }],
  });
}

export { ARC_CHAIN_ID };
