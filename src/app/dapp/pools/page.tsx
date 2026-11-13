"use client";
import { Activity, Repeat, Plus, Droplet, Search } from "lucide-react";
import "../dapp.css";

export default function PoolsPage() {
  const pools = [
    { pair1: "SIHU", pair2: "HBAR", fullName1: "SIHU TOKEN", fullName2: "Hedera HBAR", rate1: 1, rate2: 0.29, trades: "124K", tvl1: "1.2M", tvl2: "4.8M", fee: "0.3%" },
    { pair1: "SIHU", pair2: "USDT", fullName1: "SIHU TOKEN", fullName2: "Tether USDT", rate1: 1, rate2: 0.10, trades: "89K", tvl1: "500K", tvl2: "5M", fee: "0.3%" },
    { pair1: "HBAR", pair2: "USDT", fullName1: "Hedera HBAR", fullName2: "Tether USDT", rate1: 1, rate2: 0.08, trades: "215K", tvl1: "10M", tvl2: "1.2M", fee: "0.05%" },
    { pair1: "SANGO", pair2: "SIHU", fullName1: "SANGO Treasury", fullName2: "SIHU TOKEN", rate1: 1, rate2: 2.5, trades: "12K", tvl1: "100K", tvl2: "250K", fee: "1%" },
  ];

  return (
    <main className="p-4 pt-6 pb-24 flex flex-col gap-6 text-white w-full max-w-6xl mx-auto lg:px-8">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase">Liquidity Pools</h1>
        <p className="text-[10px] text-blue-400/50 font-bold uppercase tracking-[0.2em]">Stake & Earn • SIHU Network</p>
      </div>

      {/* Search & Filter */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 glass px-4 py-3 flex items-center gap-3 border-white/5">
           <Search size={16} className="text-white/20" />
           <input type="text" placeholder="Search pairs..." className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-white/20" />
        </div>
        <div className="bg-blue-500/10 text-blue-400 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] flex items-center gap-2">
           <Activity size={14} /> Trending
        </div>
      </div>

      {/* ── FEATURED SIHU/HBAR POOL ── */}
      <div className="relative overflow-hidden p-6 rounded-[2.5rem] border border-blue-500/30 shadow-2xl"
           style={{ background: "linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))" }}>
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/20 blur-[60px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full" />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-blue-400 tracking-[0.1em] uppercase">High Yield Opportunity</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-1 uppercase">Stake SIHU / HBAR</h2>
            <p className="text-xs text-white/40 leading-relaxed max-w-[280px]">
              Provide liquidity to the Lake Victoria Basin conservation protocol and earn automated yield.
            </p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]">
             <Droplet className="text-white" size={30} fill="currentColor" />
          </div>
        </div>

        <div className="flex gap-4 mb-6 relative z-10">
          <div className="flex-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2 mb-2 block">Amount HBAR</label>
            <div className="relative">
              <input type="number" placeholder="0.0" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-500/40 transition-all" />
              <span className="absolute right-4 top-4 text-xs font-black text-blue-400">HBAR</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2 mb-2 block">Amount SIHU</label>
            <div className="relative">
              <input type="number" placeholder="0.0" className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-lg font-black outline-none focus:border-blue-500/40 transition-all" />
              <span className="absolute right-4 top-4 text-xs font-black text-cyan-400">SIHU</span>
            </div>
          </div>
        </div>

        <button className="w-full btn-blue py-4 text-sm font-black uppercase tracking-[0.2em] relative z-10">
           <Plus className="inline-block mr-2" size={16} strokeWidth={4} /> Add Liquidity 
        </button>
      </div>

      {/* Pools Grid */}
      <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">Global Markets</h3>
      <div className="grid grid-cols-1 gap-4">
        {pools.map((pool, idx) => (
          <div key={idx} className="glass p-5 border-white/5 hover:border-blue-500/20 transition-all group">
            
            <div className="flex justify-between items-start mb-5">
               <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center border-2 border-[#0F172A] relative z-10 shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-xs font-black text-white">{pool.pair1[0]}</span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-400 flex items-center justify-center border-2 border-[#0F172A] relative z-0 shadow-lg group-hover:translate-x-2 transition-transform">
                         <span className="text-xs font-black text-white">{pool.pair2[0]}</span>
                    </div>
                  </div>
                  <div>
                     <span className="text-base font-black tracking-tighter uppercase block">{pool.pair1} / {pool.pair2}</span>
                     <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{pool.fullName1} • {pool.fullName2}</span>
                  </div>
               </div>
               <div className="bg-blue-500/10 px-3 py-1 rounded-full text-[9px] font-black text-blue-400 border border-blue-500/20">
                 {pool.fee} FEE
               </div>
            </div>

            <div className="bg-black/20 rounded-2xl p-4 mb-5">
               <div className="flex items-center justify-between mb-3 text-[11px] font-bold pb-3 border-b border-white/5">
                  <span className="text-white/30">Exchange Rate</span>
                  <span className="text-white">1 {pool.pair1} = <b className="text-blue-400 font-black">{pool.rate2} {pool.pair2}</b></span>
               </div>
               <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-white/30 tracking-widest uppercase text-[9px]">Market Depth</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[9px] font-black">ACTIVE</span>
                    <span className="text-white/40">{pool.trades} trades</span>
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-center mb-5 px-1">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">Total Value Locked</span>
                 <span className="text-[11px] font-bold text-white/60">{pool.tvl1} {pool.pair1} + {pool.tvl2} {pool.pair2}</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  <Droplet size={14} />
               </div>
            </div>

            <div className="flex gap-3">
               <button className="flex-1 btn-blue py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Repeat size={14} strokeWidth={3} /> Swap
               </button>
               <button className="flex-[0.6] bg-white/[0.03] border border-white/5 hover:bg-white/10 text-white/60 font-black py-3.5 rounded-2xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Plus size={14} strokeWidth={3} /> Add
               </button>
            </div>

          </div>
        ))}
      </div>
      
    </main>
  );
}
