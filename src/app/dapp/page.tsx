"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSihuStore } from "@/store/useSihuStore";
import WalletConnectModal from "@/components/dapp/WalletConnectModal";
import {
  Wallet, Copy, Check, LogOut, Cpu, Pickaxe, Droplets, ArrowLeftRight, Landmark, ArrowRight, Sprout, Store,
  Info, TrendingUp, Users, RefreshCw,
} from "lucide-react";
import { useSihuStats } from "@/components/stats/SihuStatsPanel";
import { network } from "@/services/avalancheService";
import { KAI_URL } from "@/services/kaiHubService";
import "./dapp.css";

/*
 * SIHU DApp overview. The AVAX balance is read from the Avalanche network;
 * SIHU and USDT are not on-chain yet, so they show 0. Invented prices and
 * network figures were removed; community numbers come from /api/stats.
 */

const ACTIONS = [
  { name: "Mine", href: "/dapp/mine", Icon: Pickaxe, text: "Earn SIHU for verified stewardship work.", tint: "from-sky-500/20 text-sky-300" },
  { name: "Pools", href: "/dapp/pools", Icon: Droplets, text: "Add liquidity to community pools.", tint: "from-cyan-500/20 text-cyan-300" },
  { name: "Swap", href: "/dapp/swap", Icon: ArrowLeftRight, text: "Exchange AVAX, SIHU and USDT.", tint: "from-emerald-500/20 text-emerald-300" },
  { name: "Vaults", href: "/dapp/vaults", Icon: Landmark, text: "Save and grow tokens over time.", tint: "from-violet-500/20 text-violet-300" },
];

const WALLET_NAMES: Record<string, string> = { native: "SIHU wallet", core: "Core Wallet", metamask: "MetaMask" };

export default function SihuDApp() {
  const { connected, accountId, walletType, balances, balanceStatus, refreshBalances, autoMineActive, toggleAutoMine, incrementSihu, disconnectWallet } = useSihuStore();
  const { load: stats } = useSihuStats();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // The drop agent adds a little SIHU every second while it is on (demo).
  useEffect(() => {
    if (!autoMineActive) return;
    const id = setInterval(() => incrementSihu(0.003), 1000);
    return () => clearInterval(id);
  }, [autoMineActive, incrementSihu]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(accountId); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* no clipboard */ }
  };

  return (
    <main className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute -top-40 right-[-10%] w-[600px] h-[600px] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] left-[-15%] w-[500px] h-[500px] rounded-full bg-blue-700/10 blur-[120px]" />

      <div className="relative container mx-auto max-w-6xl px-4 lg:px-8 pt-10 md:pt-14">
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-300 text-[12.5px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse" /> SIHU Network · Avalanche C-Chain
            </span>
            <h1 className="font-heading text-[34px] md:text-5xl font-bold mt-4 leading-tight">Rewards for caring for the lake</h1>
            <p className="text-slate-300 text-[16px] md:text-lg mt-3 max-w-2xl leading-relaxed">
              Earn, save and exchange SIHU tokens for verified environmental work around Lake Victoria, on the Avalanche network.
            </p>
          </div>
          {!connected && (
            <button onClick={() => setShowModal(true)} className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-lg shadow-sky-500/25 transition-colors">
              <Wallet size={18} /> Connect wallet
            </button>
          )}
        </div>

        <p className="mt-6 flex items-start gap-2 text-[13.5px] text-amber-200/90 bg-amber-400/10 border border-amber-400/20 rounded-2xl px-4 py-3 max-w-3xl">
          <Info size={16} className="shrink-0 mt-0.5" /> Phase 1: your AVAX balance is read live from {network.name}. SIHU and USDT tokens are not on-chain yet, so they show 0, and the drop agent collects demo rewards only. No real money is used.
        </p>

        <div className="grid lg:grid-cols-3 gap-5 mt-8">
          {/* Wallet */}
          <section className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-white/10 p-6 md:p-8">
            {connected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-slate-400">{WALLET_NAMES[walletType ?? ""] ?? "Wallet"} · connected</p>
                    <button onClick={copy} className="mt-1 inline-flex items-center gap-2 font-mono text-[17px] text-white hover:text-sky-300 transition-colors" title="Copy account id">
                      {accountId} {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} className="text-slate-500" />}
                    </button>
                  </div>
                  <button onClick={disconnectWallet} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[13.5px] font-semibold text-slate-300 transition-colors">
                    <LogOut size={15} /> Disconnect
                  </button>
                </div>
                <p className="text-[13px] text-slate-400 mt-8 flex items-center gap-2">
                  AVAX balance · {network.name}
                  <button onClick={() => void refreshBalances()} aria-label="Refresh balance" title="Refresh balance" className="text-slate-500 hover:text-sky-300"><RefreshCw size={13} className={balanceStatus === "loading" ? "animate-spin" : ""} /></button>
                </p>
                <p className="font-heading text-4xl md:text-5xl font-bold mt-1 tabular-nums">
                  {balanceStatus === "loading" ? <span className="inline-block w-40 h-11 rounded-xl bg-white/10 animate-pulse align-middle" aria-label="Loading balance" /> : `${balances.avax.toLocaleString(undefined, { maximumFractionDigits: 4 })} AVAX`}
                </p>
                {balanceStatus === "unavailable" && <p className="text-[13px] text-amber-200/90 mt-2">The balance could not be read from the network for this address.</p>}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { l: "AVAX", v: balances.avax.toFixed(4) },
                    { l: "SIHU", v: balances.sihu.toFixed(1) },
                    { l: "USDT", v: balances.usdt.toFixed(2) },
                  ].map((b) => (
                    <div key={b.l} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                      <p className="text-[12.5px] text-slate-400 font-semibold">{b.l}</p>
                      <p className="text-[19px] md:text-[22px] font-bold mt-1 tabular-nums">{b.v}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start">
                <span className="w-14 h-14 rounded-2xl bg-sky-400/10 text-sky-300 flex items-center justify-center"><Wallet size={26} /></span>
                <h2 className="font-heading text-2xl font-bold mt-5">Connect a wallet to start</h2>
                <p className="text-slate-400 text-[15px] mt-2 max-w-md leading-relaxed">Use the SIHU wallet, Core or MetaMask. You will see your AVAX, SIHU and USDT balances here.</p>
                <button onClick={() => setShowModal(true)} className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-sky-100 transition-colors">
                  <Wallet size={17} /> Connect wallet
                </button>
              </div>
            )}
          </section>

          {/* Drop agent */}
          <section className={`rounded-3xl border p-6 md:p-8 flex flex-col transition-colors ${autoMineActive ? "bg-gradient-to-br from-sky-600/25 to-blue-900/30 border-sky-400/30" : "bg-slate-900 border-white/10"}`}>
            <div className="flex items-start justify-between gap-4">
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${autoMineActive ? "bg-sky-500 text-white" : "bg-white/5 text-slate-400"}`}><Cpu size={22} /></span>
              <button
                role="switch"
                aria-checked={autoMineActive}
                aria-label="Drop agent"
                onClick={connected ? toggleAutoMine : () => setShowModal(true)}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${autoMineActive ? "bg-sky-500" : "bg-white/10"}`}
              >
                <span className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${autoMineActive ? "translate-x-6" : ""}`} />
              </button>
            </div>
            <h2 className="font-heading text-xl font-bold mt-5">Drop agent</h2>
            <p className="text-slate-400 text-[14.5px] mt-1.5 leading-relaxed">
              {autoMineActive ? "Collecting demo rewards (not on-chain yet)." : connected ? "Turn on to try collecting demo rewards." : "Connect a wallet to turn it on."}
            </p>
            {autoMineActive && (
              <p className="mt-auto pt-5 flex items-center justify-between text-[14px]">
                <span className="flex items-center gap-2 text-sky-200"><span className="w-2 h-2 rounded-full bg-sky-300 animate-ping" /> Running</span>
                <span className="font-mono text-white">{balances.sihu.toFixed(3)} SIHU</span>
              </p>
            )}
          </section>
        </div>

        {/* Actions */}
        <h2 className="font-heading text-2xl font-bold mt-14">What you can do</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {ACTIONS.map((a) => (
            <Link key={a.name} href={a.href} className="group rounded-3xl bg-slate-900 border border-white/10 hover:border-sky-400/40 p-6 transition-colors">
              <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.tint} to-transparent flex items-center justify-center`}><a.Icon size={22} /></span>
              <h3 className="font-bold text-[18px] mt-5 flex items-center justify-between">
                {a.name} <ArrowRight size={17} className="text-slate-500 group-hover:text-sky-300 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-slate-400 text-[14px] mt-1.5 leading-relaxed">{a.text}</p>
            </Link>
          ))}
        </div>

        {/* Partners */}
        <h2 className="font-heading text-2xl font-bold mt-14">Partner dashboards</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <a href={`${KAI_URL}/nursery`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-5 rounded-3xl bg-slate-900 border border-white/10 hover:border-emerald-400/40 p-6 transition-colors">
            <span className="w-14 h-14 rounded-2xl bg-emerald-400/10 text-emerald-300 flex items-center justify-center shrink-0"><Sprout size={26} /></span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[18px]">CFA portal</span>
              <span className="block text-slate-400 text-[14px] mt-0.5">Community Forest Associations record nurseries and planting on KAI.</span>
            </span>
            <ArrowRight size={18} className="text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
          </a>
          <div className="flex items-center gap-5 rounded-3xl bg-slate-900/60 border border-white/5 p-6">
            <span className="w-14 h-14 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center shrink-0"><Store size={26} /></span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-[18px] text-slate-300">Business (SME) dashboard</span>
              <span className="block text-slate-500 text-[14px] mt-0.5">Finance and growth tools for local businesses.</span>
            </span>
            <span className="text-[12px] font-semibold text-slate-400 bg-white/5 px-3 py-1 rounded-full shrink-0">Coming soon</span>
          </div>
        </div>

        {/* Token status and real community numbers (invented prices / network figures removed) */}
        <div className="grid lg:grid-cols-3 gap-5 mt-14">
          <section className="lg:col-span-2 rounded-3xl bg-slate-900 border border-white/10 p-6">
            <h2 className="font-bold text-[18px] flex items-center gap-2"><TrendingUp size={18} className="text-sky-300" /> Token prices</h2>
            <p className="text-slate-400 text-[14.5px] leading-relaxed mt-3 max-w-xl">
              SIHU and SANGO tokens are not trading yet, so there is no market price to show. Prices will appear here from a live market once trading opens.
            </p>
            <a href={network.explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-sky-300 hover:text-sky-200">
              View the {network.name} explorer <ArrowRight size={15} />
            </a>
          </section>
          <section className="rounded-3xl bg-slate-900 border border-white/10 p-6">
            <h2 className="font-bold text-[18px] flex items-center gap-2"><Users size={18} className="text-sky-300" /> SIHU community</h2>
            {stats.status === "loading" && <div className="mt-4 space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-xl bg-white/5" />)}</div>}
            {stats.status === "error" && <p className="mt-4 text-[14px] text-slate-400">Community numbers are unavailable right now.</p>}
            {stats.status === "ready" && (
              <div className="mt-4 space-y-4">
                {[
                  { l: "Registered members", v: stats.data.community?.members },
                  { l: "Community reports", v: stats.data.community?.posts },
                  { l: "Stories published", v: stats.data.stories },
                ].filter((x) => typeof x.v === "number").map((x) => (
                  <div key={x.l} className="flex items-center justify-between gap-3">
                    <span className="text-slate-400 text-[14px]">{x.l}</span>
                    <span className="font-bold text-[17px] tabular-nums">{(x.v as number).toLocaleString("en-KE")}</span>
                  </div>
                ))}
                <p className="text-[12px] text-slate-500">Live from the SIHU database.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
