'use client';

const NETWORK=process.env.NEXT_PUBLIC_ARC_NETWORK||'arc-testnet';
const IS_MAINNET=NETWORK==='arc-mainnet';
const ARC_CHAIN_ID=Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID||(IS_MAINNET?5042:5042002));
const ARC_CHAIN_ID_HEX='0x'+ARC_CHAIN_ID.toString(16);
const ARC_RPC=process.env.NEXT_PUBLIC_ARC_RPC||(IS_MAINNET?'https://rpc.mainnet.arc.io':'https://rpc.testnet.arc.io');
const ARC_EXPLORER=process.env.NEXT_PUBLIC_ARC_EXPLORER_URL||(IS_MAINNET?'https://explorer.arc.io':'https://testnet.arcscan.app');
const ARC_NETWORK={chainId:ARC_CHAIN_ID_HEX,chainName:IS_MAINNET?'Arc':'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:[ARC_RPC],blockExplorerUrls:[ARC_EXPLORER]};
const EIP6963_ANNOUNCE='eip6963:announceProvider';
const EIP6963_REQUEST='eip6963:requestProvider';
const SELECTED_WALLET_KEY='campusarc-selected-wallet-rdns';

function isProvider(provider){return Boolean(provider?.request);}
function getInjectedProvider(){if(typeof window==='undefined')return null;if(isProvider(window.ethereum))return window.ethereum;return null;}
export function getWalletLabel(detail){return detail?.info?.name||'Browser Wallet';}

export async function discoverWallets(timeout=300){
  if(typeof window==='undefined')return [];
  const providers=new Map();
  const onAnnouncement=(event)=>{
    const detail=event?.detail;
    if(!isProvider(detail?.provider)||!detail?.info?.uuid)return;
    providers.set(detail.info.uuid,detail);
  };
  window.addEventListener(EIP6963_ANNOUNCE,onAnnouncement);
  window.dispatchEvent(new Event(EIP6963_REQUEST));
  await new Promise(resolve=>setTimeout(resolve,timeout));
  window.removeEventListener(EIP6963_ANNOUNCE,onAnnouncement);
  if(!providers.size){
    const provider=getInjectedProvider();
    if(provider)providers.set('legacy-window-ethereum',{info:{uuid:'legacy-window-ethereum',name:'Browser Wallet',icon:'',rdns:'legacy.window.ethereum'},provider});
  }
  const wallets=Array.from(providers.values());
  const preferred=window.localStorage.getItem(SELECTED_WALLET_KEY);
  wallets.sort((a,b)=>{
    if(preferred&&a.info?.rdns===preferred)return-1;
    if(preferred&&b.info?.rdns===preferred)return 1;
    return getWalletLabel(a).localeCompare(getWalletLabel(b));
  });
  return wallets;
}

export async function connectWallet(providerOverride){
  let provider=providerOverride;
  if(!isProvider(provider)){
    const wallets=await discoverWallets();
    provider=wallets[0]?.provider;
  }
  if(!isProvider(provider))throw new Error('No compatible wallet was detected. On phone, open CampusArc AI inside your wallet app browser, or install a compatible browser wallet extension.');
  const accounts=await provider.request({method:'eth_requestAccounts'});
  const address=accounts?.[0];
  if(!address)throw new Error('Wallet did not return an account.');
  await ensureArcNetwork(provider);
  return{provider,address};
}

export function rememberWallet(detail){
  if(typeof window!=='undefined'&&detail?.info?.rdns)window.localStorage.setItem(SELECTED_WALLET_KEY,detail.info.rdns);
}
async function ensureArcNetwork(provider){const current=await provider.request({method:'eth_chainId'});if(String(current).toLowerCase()===ARC_CHAIN_ID_HEX)return;try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_ID_HEX}]});}catch(error){if(error?.code!==4902)throw new Error('Please switch your wallet to '+(IS_MAINNET?'Arc Mainnet':'Arc Testnet')+' to continue.');await provider.request({method:'wallet_addEthereumChain',params:[ARC_NETWORK]});}const confirmed=await provider.request({method:'eth_chainId'});if(String(confirmed).toLowerCase()!==ARC_CHAIN_ID_HEX)throw new Error('Wallet network could not be switched to '+(IS_MAINNET?'Arc Mainnet':'Arc Testnet')+'.');}
export async function signWalletChallenge(provider,message){if(!provider?.request)throw new Error('Wallet connection is unavailable.');return provider.request({method:'personal_sign',params:[message]});}
function encodeTransfer(to,amountBaseUnits){const address=String(to||'').replace(/^0x/,'').toLowerCase();if(!/^[0-9a-f]{40}$/.test(address))throw new Error('Invalid recipient wallet address.');const amount=BigInt(String(amountBaseUnits));if(amount<=0n)throw new Error('Invalid payment amount.');return '0xa9059cbb'+address.padStart(64,'0')+amount.toString(16).padStart(64,'0');}
export async function sendUsdcTransfer({provider,from,tokenAddress,destinationAddress,amountBaseUnits}){if(!provider?.request)throw new Error('Wallet connection is unavailable.');if(!/^0x[0-9a-fA-F]{40}$/.test(from||''))throw new Error('Invalid wallet address.');if(!/^0x[0-9a-fA-F]{40}$/.test(tokenAddress||''))throw new Error('Invalid USDC contract address.');if(!/^0x[0-9a-fA-F]{40}$/.test(destinationAddress||''))throw new Error('Invalid school wallet address.');await ensureArcNetwork(provider);return provider.request({method:'eth_sendTransaction',params:[{from,to:tokenAddress,value:'0x0',data:encodeTransfer(destinationAddress,amountBaseUnits)}]});}
export {ARC_CHAIN_ID,ARC_RPC,ARC_EXPLORER,NETWORK};