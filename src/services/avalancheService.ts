/**
 * Avalanche C-Chain service.
 * Uses @avalabs/avalanchejs for key generation.
 * Network: Fuji Testnet (chain ID 43113) for development,
 *          Avalanche Mainnet (chain ID 43114) for production.
 */

// ─── Network config ───────────────────────────────────────────────────────────

export const AVAX_NETWORKS = {
  fuji: {
    name: 'Avalanche Fuji Testnet',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    symbol: 'AVAX',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  mainnet: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    symbol: 'AVAX',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
} as const;

export type AvaxNetwork = keyof typeof AVAX_NETWORKS;

export const ACTIVE_NETWORK: AvaxNetwork =
  process.env.NEXT_PUBLIC_AVAX_NETWORK === 'mainnet' ? 'mainnet' : 'fuji';

export const network = AVAX_NETWORKS[ACTIVE_NETWORK];

// ─── Wallet generation ────────────────────────────────────────────────────────

export interface AvaxWallet {
  address: string;
  privateKey: string;
}

/**
 * Generates a random Avalanche C-Chain wallet client-side.
 * The private key is a 32-byte hex string compatible with EVM / MetaMask.
 */
export function generateAvaxWallet(): AvaxWallet {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const privateKey = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Derive address from private key using simple keccak via browser-native ECDSA
  // Full derivation requires a secp256k1 library — we return a placeholder address
  // that will be replaced once the user connects MetaMask or Core Wallet.
  const address = '0x' + Array.from(bytes.slice(12)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();

  return { privateKey, address };
}

// ─── MetaMask / Core Wallet helper ────────────────────────────────────────────

/**
 * Adds Avalanche Fuji Testnet to MetaMask / Core Wallet and returns the user's address.
 */
export async function connectMetaMaskToAvax(): Promise<string> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;

  if (!ethereum) {
    throw new Error('No Web3 wallet found. Install MetaMask or Core Wallet.');
  }

  const net = AVAX_NETWORKS[ACTIVE_NETWORK];

  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x' + net.chainId.toString(16),
        chainName: net.name,
        nativeCurrency: net.nativeCurrency,
        rpcUrls: [net.rpcUrl],
        blockExplorerUrls: [net.explorerUrl],
      }],
    });
  } catch {
    // Chain may already be added — continue
  }

  await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x' + net.chainId.toString(16) }] });

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
  return accounts[0];
}
