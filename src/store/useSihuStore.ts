import { create } from "zustand";
import { getAvaxBalance } from "@/services/avalancheService";

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
  /** Whether the AVAX balance was read from the network. */
  balanceStatus: "idle" | "loading" | "live" | "unavailable";
  refreshBalances: () => Promise<void>;
  connectWallet: (type: "native" | "core" | "metamask", accountId?: string, priv?: string, pub?: string) => void;
  disconnectWallet: () => void;
  toggleAutoMine: () => void;
  incrementSihu: (amount: number) => void;
}

export const useSihuStore = create<SihuState>((set, get) => ({
  connected: false,
  walletType: null,
  accountId: "",
  privateKey: null,
  publicKey: null,
  autoMineActive: false,
  balances: { avax: 0, sihu: 0, usdt: 0 },
  balanceStatus: "idle",

  // Balances start at zero and the real AVAX balance is read from the network.
  // (They used to be invented: 12.45 AVAX, 1,250 SIHU, 580 USDT.)
  connectWallet: (type, customAccountId, priv, pub) => {
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
      balances: { avax: 0, sihu: 0, usdt: 0 },
      balanceStatus: "loading",
    });
    void get().refreshBalances();
  },

  refreshBalances: async () => {
    const { accountId, connected } = get();
    if (!connected) return;
    set({ balanceStatus: "loading" });
    const avax = await getAvaxBalance(accountId);
    if (get().accountId !== accountId) return;
    set((s) => ({ balances: { ...s.balances, avax: avax ?? 0 }, balanceStatus: avax === null ? "unavailable" : "live" }));
  },

  disconnectWallet: () =>
    set({
      connected: false,
      walletType: null,
      accountId: "",
      privateKey: null,
      publicKey: null,
      autoMineActive: false,
      balances: { avax: 0, sihu: 0, usdt: 0 },
      balanceStatus: "idle",
    }),

  toggleAutoMine: () => set(s => ({ autoMineActive: !s.autoMineActive })),

  incrementSihu: amount =>
    set(s => ({ balances: { ...s.balances, sihu: s.balances.sihu + amount } })),
}));
