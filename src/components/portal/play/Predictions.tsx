"use client";

import React, { useState } from 'react';
import { Target } from "lucide-react";

/** ─── MODELS ─── **/

export interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  yesOdds: number;
  noOdds: number;
  totalVolume: string;
  endDate: string;
}

/** ─── LIST COMPONENT ─── **/

export function PredictionList({ 
  markets, 
  onSelectMarket, 
  selectedMarketId 
}: { 
  markets: PredictionMarket[], 
  onSelectMarket: (m: PredictionMarket) => void, 
  selectedMarketId?: string 
}) {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Ecosystem', 'Social', 'Lake Victoria', 'Climate'];
  
  const filtered = filter === 'All' ? markets : markets.filter(m => m.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
              filter === cat 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                : 'bg-slate-800 text-slate-400 border-white/10 hover:border-primary/50 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(market => (
          <div 
            key={market.id}
            onClick={() => onSelectMarket(market)}
            className={`cursor-pointer rounded-2xl border transition-all duration-300 p-5 group flex flex-col ${
              selectedMarketId === market.id
                ? 'bg-slate-800 border-primary shadow-xl shadow-primary/10'
                : 'bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-800'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400 group-hover:text-primary transition-colors uppercase tracking-widest">
                {market.category}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vol: {market.totalVolume} Credits</span>
            </div>
            
            <h3 className="text-base font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">{market.title}</h3>
            <p className="text-xs text-slate-400 mb-5 line-clamp-2 leading-relaxed">{market.description}</p>
            
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="p-2 rounded-xl bg-slate-900/50 border border-white/5 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Yes</div>
                <div className="text-lg font-black text-emerald-400">{market.yesOdds}%</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/50 border border-white/5 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">No</div>
                <div className="text-lg font-black text-rose-400">{market.noOdds}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ─── STAKING INTERFACE ─── **/

export function StakingInterface({ market }: { market: PredictionMarket | null }) {
  const [amount, setAmount] = useState('10');
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [loading, setLoading] = useState(false);

  if (!market) {
    return (
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="mb-4 opacity-30 flex justify-center"><Target size={38} /></div>
        <h3 className="text-lg font-bold text-slate-300">Select a Market</h3>
        <p className="text-sm text-slate-500 mt-2">Choose an active market from the list to start trading on outcomes.</p>
      </div>
    );
  }

  const handleStake = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Stake of ${amount} SIHU Credits placed on ${side.toUpperCase()}!`);
    }, 1500);
  };

  return (
    <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 shadow-2xl sticky top-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Trade Outcome</h2>
      </div>

      <h3 className="text-lg font-bold text-white mb-6 leading-tight">{market.title}</h3>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => setSide('yes')}
          className={`py-3 rounded-xl font-black text-sm transition-all border ${
            side === 'yes' ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-500 border-white/5 hover:border-emerald-500/30'
          }`}
        >
          YES ({market.yesOdds}%)
        </button>
        <button 
          onClick={() => setSide('no')}
          className={`py-3 rounded-xl font-black text-sm transition-all border ${
            side === 'no' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-slate-900 text-slate-500 border-white/5 hover:border-rose-500/30'
          }`}
        >
          NO ({market.noOdds}%)
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            <span>Trade Amount</span>
            <span className="text-primary tracking-normal">Max: 1,500 Credits</span>
          </div>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white font-black text-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
              placeholder="0.00"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">CREDITS</span>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Potential Return</span>
            <span className="text-emerald-400">+{(parseFloat(amount || '0') * (1 + (100 - (side === 'yes' ? market.yesOdds : market.noOdds)) / 100)).toFixed(2)} Credits</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">Network Fee</span>
            <span className="text-slate-300">0.50 Credits</span>
          </div>
        </div>

        <button 
          onClick={handleStake}
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Place trade</>
          )}
        </button>
      </div>
    </div>
  );
}

/** ─── RESULT TRACKER ─── **/

export function ResultTracker({ 
  title, 
  status, 
  totalStaked, 
  endDate, 
  completionPct 
}: { 
  title: string, 
  status: 'active' | 'completed' | 'failed', 
  totalStaked: string, 
  endDate: string, 
  completionPct: number 
}) {
  const statusColors = {
    active: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    completed: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
    failed: 'text-rose-400 border-rose-400/20 bg-rose-400/5'
  };

  return (
    <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-800 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColors[status]}`}>
          {status}
        </span>
        <span className="text-[10px] text-slate-500 font-bold">{endDate}</span>
      </div>
      <h4 className="text-sm font-bold text-white mb-4 group-hover:text-primary transition-colors line-clamp-2">{title}</h4>
      
      <div className="space-y-3">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Progress</span>
          <span className="text-xs font-black text-white">{completionPct}%</span>
        </div>
        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${status === 'completed' ? 'bg-emerald-500' : status === 'failed' ? 'bg-rose-500' : 'bg-primary'}`} 
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-2 border-t border-white/5">
          <span>Staked Volume</span>
          <span className="text-slate-300">{totalStaked} Credits</span>
        </div>
      </div>
    </div>
  );
}
