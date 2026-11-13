import { create } from "zustand";

interface SihuState {
  connected: boolean;
  walletType: "native" | "core" | "metamask" | null;
  accountId: string;
  privateKey: string | null;
  publicKey: string | null;
  autoMineActive: boolean;
  balances: {
    avax: number;
    sihu: number;
    usdt: number;
  };
  connectWallet: (type: "native" | "core" | "metamask", accountId?: string, priv?: string, pub?: string) => void;
  disconnectWallet: () => void;
  toggleAutoMine: () => void;
  incrementSihu: (amount: number) => void;
}

export const useSihuStore = create<SihuState>(set => ({
  connected: false,
  walletType: null,
  accountId: "",
  privateKey: null,
  publicKey: null,
  autoMineActive: false,
  balances: { avax: 0, sihu: 0, usdt: 0 },

  connectWallet: (type, customAccountId, priv, pub) =>
    set({
      connected: true,
      walletType: type,
      accountId: customAccountId
        ? customAccountId
        : type === "native"
          ? "0x0000...UNREGISTERED"
          : type === "core"
            ? "0x3a9f...C7d2"
            : "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      privateKey: priv ?? null,
      publicKey: pub ?? null,
      balances: { avax: 12.45, sihu: 1250, usdt: 580 },
    }),

  disconnectWallet: () =>
    set({
      connected: false,
      walletType: null,
      accountId: "",
      privateKey: null,
      publicKey: null,
      autoMineActive: false,
      balances: { avax: 0, sihu: 0, usdt: 0 },
    }),

  toggleAutoMine: () => set(s => ({ autoMineActive: !s.autoMineActive })),

  incrementSihu: amount =>
    set(s => ({ balances: { ...s.balances, sihu: s.balances.sihu + amount } })),
}));
