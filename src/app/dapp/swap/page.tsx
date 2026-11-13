"use client";
import { ArrowDownUp, ChevronDown, Search, RefreshCw, Info } from "lucide-react";
import { useState } from "react";
import "../dapp.css";

const TOKENS = [
  { symbol: "SIHU",  name: "SIHU TOKEN",        color: "from-blue-600 to-cyan-500" },
  { symbol: "HBAR",  name: "Hedera HBAR",       color: "from-sky-400 to-blue-500" },
  { symbol: "USDT",  name: "Tether USDT",       color: "from-emerald-500 to-cyan-600" },
  { symbol: "SANGO", name: "SANGO Treasury",    color: "from-blue-800 to-indigo-900" },
];

export default function SwapPage() {
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken,   setToToken]   = useState(TOKENS[1]);
  const [amount, setAmount] = useState("");

  const rate = 1.24; // mock rate

  return (
    <main className="p-4 pt-10 pb-24 flex flex-col items-center min-h-[90vh] justify-center gap-6 w-full max-w-6xl mx-auto lg:px-8">

      {/* Title */}
      <div className="w-full max-w-[500px]">
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Swap Engine</h1>
        <p className="text-[10px] text-blue-400/50 mt-1 font-bold tracking-widest uppercase">Decentralized Exchange • SIHU Network</p>
      </div>

      {/* Swap Card */}
      <div className="w-full max-w-[500px] glass rounded-[2.5rem] p-6 border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Rate bar */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest">
            <Info size={14} className="text-blue-500/50" />
            <span>1 {fromToken.symbol} ≈ <strong className="text-blue-400">{rate} {toToken.symbol}</strong></span>
          </div>
          <button className="text-white/40 hover:text-blue-400 transition-colors bg-white/5 p-2 rounded-full">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* YOU PAY */}
        <div className="bg-black/20 rounded-3xl p-5 border border-white/5 focus-within:border-blue-500/40 transition-all mb-2">
          <div className="flex justify-between text-[10px] text-white/30 font-black tracking-[0.2em] mb-3">
            <span>YOU PAY</span>
            <span>Balance: 586.00 {fromToken.symbol}</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-transparent text-4xl font-black w-1/2 outline-none placeholder-white/10 text-white tracking-tighter"
            />
            <button className={`ml-auto flex items-center gap-2 bg-gradient-to-br ${fromToken.color} px-4 py-2.5 rounded-2xl shadow-lg transition-transform active:scale-95`}>
              <span className="text-white font-black text-sm uppercase">{fromToken.symbol}</span>
              <ChevronDown size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center relative z-10 -my-4">
          <button
            onClick={() => { const tmp = fromToken; setFromToken(toToken); setToToken(tmp); }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-110 transition-transform active:rotate-180 duration-500">
            <ArrowDownUp size={18} className="text-white" strokeWidth={3} />
          </button>
        </div>

        {/* YOU RECEIVE */}
        <div className="bg-black/20 rounded-3xl p-5 border border-white/5 mb-6 mt-2">
          <div className="text-[10px] text-white/30 font-black tracking-[0.2em] mb-3">YOU RECEIVE</div>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-black text-blue-400/40 tracking-tighter">
              {amount ? (parseFloat(amount) * rate).toFixed(4) : "0.00"}
            </span>
            <button className={`ml-auto flex items-center gap-2 bg-gradient-to-br ${toToken.color} px-4 py-2.5 rounded-2xl shadow-lg transition-transform active:scale-95`}>
              <span className="text-white font-black text-sm uppercase">{toToken.symbol}</span>
              <ChevronDown size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button className={`w-full font-black rounded-2xl py-5 text-sm uppercase tracking-[0.2em] transition-all
          ${amount && parseFloat(amount) > 0
            ? "btn-blue shadow-[0_0_25px_rgba(37,99,235,0.3)] hover:-translate-y-1"
            : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"}`}>
          {amount && parseFloat(amount) > 0 ? `Execute Swap ${fromToken.symbol} to ${toToken.symbol}` : "Enter Input Amount"}
        </button>
      </div>

      {/* Token list */}
      <div className="w-full max-w-[500px] glass rounded-3xl p-5 border border-white/5">
        <h3 className="text-[10px] font-black text-blue-400/50 uppercase tracking-[0.3em] mb-4 px-2">Market Liquidity</h3>
        <div className="flex flex-col gap-2">
          {TOKENS.map(t => (
            <button key={t.symbol}
              onClick={() => setToToken(t)}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left group
                ${toToken.symbol === t.symbol ? "bg-blue-500/10 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "hover:bg-white/5 border border-transparent"}`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center font-black text-white text-xs shadow-lg group-hover:scale-110 transition-transform`}>
                {t.symbol[0]}
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase">{t.symbol}</p>
                <p className="text-[10px] text-white/30 font-bold">{t.name}</p>
              </div>
              {toToken.symbol === t.symbol && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
            </button>
          ))}
        </div>
      </div>

    </main>
  );
}
