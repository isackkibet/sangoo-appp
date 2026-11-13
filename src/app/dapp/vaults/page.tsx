"use client";
import { useState } from "react";
import { TrendingUp, Shield, Zap, ChevronRight, ArrowUpRight, Banknote } from "lucide-react";
import "../dapp.css";

const BUBBLES = [
  { sym:"SIHU",   size:90,  apy:"28.4%", tvl:"$480K",  col:"#3B82F6", x:50,  y:35 },
  { sym:"USDT",   size:78,  apy:"12.1%", tvl:"$320K",  col:"#06B6D4", x:20,  y:55 },
  { sym:"HBAR",   size:72,  apy:"18.9%", tvl:"$280K",  col:"#22D3EE", x:75,  y:62 },
  { sym:"SANGO",  size:55,  apy:"12.0%", tvl:"$140K",  col:"#6366F1", x:35,  y:78 },
];

const SIHU_VAULTS = [
  { name:"SIHU/HBAR Yield",     protocol:"Bonzo · SaucerSwap", apy:"28.4%", tvl:"$480K",  risk:"Low",    badge:"AI managed" },
  { name:"HBAR Native Vault",   protocol:"Bonzo · Hedera",     apy:"22.1%", tvl:"$320K",  risk:"Low",    badge:"Protected"  },
  { name:"SIHU Stable Bond",    protocol:"SIHU Network",       apy:"18.9%", tvl:"$280K",  risk:"Medium", badge:"Verified"   },
  { name:"USDT Liquid Reserve", protocol:"Bonzo · RWA",        apy:"12.0%", tvl:"$140K",  risk:"Low",    badge:"Protected"  },
];

export default function VaultsPage() {
  const [view, setView] = useState<"bubbles" | "list">("bubbles");
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="text-white p-4 pt-8 pb-24 flex flex-col gap-6 w-full max-w-6xl mx-auto lg:px-8">

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
           <Banknote className="text-blue-500" /> SIHU Vaults
        </h1>
        <p className="text-[10px] text-blue-400/50 font-bold uppercase tracking-[0.2em]">
          AI-Optimized Yield • Powered by Bonzo Finance SDK
        </p>
      </div>

      {/* ── FEATURED VAULT ── */}
      <div className="relative overflow-hidden p-6 rounded-[2.5rem] border border-blue-500/20 shadow-2xl"
           style={{ background: "linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))" }}>
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full" />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-blue-400 tracking-[0.1em] uppercase">Liquidity Integration</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-1 uppercase">Bonzo HBAR Vault</h2>
            <p className="text-xs text-white/40 leading-relaxed max-w-[280px]">
              Deposit native <strong className="text-white">HBAR</strong>. We auto-supply it to Bonzo Finance for instant block-by-block yield.
            </p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
             <Zap className="text-white" size={28} fill="currentColor" />
          </div>
        </div>

        <div className="flex gap-4 mb-6 relative z-10">
          <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Effective APY</p>
            <p className="text-2xl font-black text-emerald-400 tracking-tighter">18.4%</p>
          </div>
          <div className="flex-1 bg-black/20 border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total TVL</p>
            <p className="text-2xl font-black text-blue-400 tracking-tighter">$1.2M</p>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <div className="flex-1 relative">
            <input 
              type="number" 
              placeholder="0.0" 
              className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-500/40 transition-all"
            />
            <span className="absolute right-4 top-4.5 text-xs font-black text-white/30 uppercase">HBAR</span>
          </div>
          <button className="btn-blue px-8 py-4 text-xs font-black uppercase tracking-widest shadow-blue-500/20">
            Deposit
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex bg-white/[0.03] border border-white/5 rounded-2xl p-1.5">
        {(["bubbles","list"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className={`
            flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
            ${view === v ? "bg-blue-600 text-white shadow-lg" : "text-white/20 hover:text-white/40"}
          `}>
            {v === "bubbles" ? "Network graph" : "List view"}
          </button>
        ))}
      </div>

      {/* ── BUBBLES VIEW ── */}
      {view === "bubbles" && (
        <div className="relative h-[320px] overflow-hidden rounded-[2.5rem] glass border-white/5">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em]">Explorer Active</p>
          </div>
          {BUBBLES.map((b, i) => (
            <button key={i} onClick={() => setSelected(i === selected ? null : i)}
              className={`
                absolute rounded-full flex flex-col items-center justify-center transition-all duration-500
                ${selected === i ? "z-20 scale-125 shadow-[0_0_50px_rgba(59,130,246,0.4)]" : "z-10 shadow-lg"}
              `}
              style={{
                width: b.size, height: b.size,
                left: `${b.x}%`, top: `${b.y}%`,
                background: `radial-gradient(circle at 35% 35%, ${b.col}cc, ${b.col}55)`,
                border: `2px solid ${b.col}90`,
                transform: "translate(-50%, -50%)",
                animation: `float ${3 + i * 0.4}s ease-in-out infinite`,
              }}>
              <span className="text-[10px] font-black text-white uppercase">{b.sym}</span>
              <span className="text-[8px] font-black text-white/60">{b.apy}</span>
            </button>
          ))}
          
          {selected !== null && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass border-blue-500/30 p-4 flex items-center gap-6 animate-in slide-in-from-bottom-4">
              <div>
                <p className="text-xs font-black text-blue-400 uppercase mb-0.5">{BUBBLES[selected].sym} Vault</p>
                <div className="flex gap-3">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">APY: {BUBBLES[selected].apy}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">TVL: {BUBBLES[selected].tvl}</span>
                </div>
              </div>
              <button className="btn-blue px-5 py-2 text-[10px] font-black uppercase tracking-widest">
                Action →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div className="flex flex-col gap-4">
          {SIHU_VAULTS.map((v, i) => (
            <div key={i} className="glass p-5 border-white/5 hover:border-blue-500/20 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">{v.name}</h4>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">{v.protocol}</p>
                </div>
                <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/5 ${
                  v.badge.includes("AI") ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  {v.badge}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-black/20 rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">APY</p>
                  <p className="text-sm font-black text-emerald-400 tracking-tighter">{v.apy}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">TVL</p>
                  <p className="text-sm font-black text-blue-400 tracking-tighter">{v.tvl}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Risk</p>
                  <p className={`text-sm font-black tracking-tighter ${v.risk === 'Low' ? 'text-emerald-400' : 'text-amber-500'}`}>{v.risk}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 btn-blue py-3.5 text-[10px] font-black uppercase tracking-widest group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  Supply Liquidity
                </button>
                <button className="flex-1 bg-white/[0.03] border border-white/5 text-white/40 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}
