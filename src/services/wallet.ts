import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { config } from '../config';

const resolveRpcUrl = () => {
  const network = config.sui.network || 'mainnet';
  if (network.startsWith('http')) {
    return network;
  }

  const supportedNetworks = ['mainnet', 'testnet', 'devnet'];
  if (supportedNetworks.includes(network)) {
    return getFullnodeUrl(network as 'mainnet' | 'testnet' | 'devnet');
  }

  console.warn(`Unknown network "${network}", defaulting to mainnet RPC`);
  return getFullnodeUrl('mainnet');
};

export const suiClient = new SuiClient({
  url: resolveRpcUrl(),
});

export const walletChainId = config.sui.chainId;

export interface WalletAdapter {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAddress: () => string | null;
  signAndExecuteTransactionBlock: (tx: TransactionBlock) => Promise<any>;
}

// This will be integrated with @mysten/wallet-kit in App.tsx
export const getWalletAddress = async (): Promise<string | null> => {
  // Wallet address will be provided by wallet-kit
  return null;
};


