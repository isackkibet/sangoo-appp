"use client";
import { useState, useEffect } from "react";
import { useSihuStore } from "@/store/useSihuStore";
import WalletConnectModal from "@/components/dapp/WalletConnectModal";
import { Pickaxe, Zap, Gift, CheckCircle, Clock, Users, UserPlus, Cpu, Rocket, PartyPopper, Ticket } from "lucide-react";
import "../dapp.css";

const WHITELIST = [
  { name: "SIHU Early Birds", spots: "247 / 500",  badge: "Hot",    status: "open",   reward: "500 SIHU" },
  { name: "USDT Liquidity",   spots: "89 / 200",   badge: "Early",  status: "open",   reward: "1,000 USDT" },
  { name: "Governance DAO",   spots: "500 / 500",  badge: "⏰ Closed", status: "closed", reward: "200 SANGO" },
];

export default function MinePage() {
  const { connected, balances, autoMineActive, toggleAutoMine, incrementSihu, accountId } = useSihuStore();
  const [showModal, setShowModal] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [minted, setMinted] = useState<string | null>(null);
  const [mintName, setMintName] = useState("");
  const [mintSym, setMintSym] = useState("");
  const [mintSupply, setMintSupply] = useState("");
  const [countdown, setCountdown] = useState(86400);

  // Countdown
  useEffect(() => {
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const claim = () => {
    if (!connected) { setShowModal(true); return; }
    incrementSihu(100);
    setClaimed(true);
  };

  const mint = () => {
    if (!mintName || !mintSym || !mintSupply) return;
    setMinted(`0.0.${Math.floor(Math.random() * 9000000 + 1000000)}`);
  };

  return (
    <main className="text-white p-4 pt-8 pb-24 flex flex-col gap-6 w-full max-w-6xl mx-auto lg:px-8">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3">
           <Pickaxe className="text-blue-500" /> Mining Hub
        </h1>
        <p className="text-[10px] text-blue-400/50 font-bold uppercase tracking-[0.2em]">
          PoS Mining • Token Minting • SIHU Airdrops
        </p>
      </div>

      {/* ── DAILY CLAIM CARD ── */}
      <div className="glass p-6 relative overflow-hidden border-blue-500/20"
           style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.05))" }}>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
        
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Daily Stewardship Reward</p>
        <div className="flex items-end gap-3 mb-6">
          <span className="text-5xl font-black text-white tracking-tighter leading-none">100</span>
          <span className="text-xl font-black text-blue-400 pb-1">SIHU</span>
          <span className="text-xs text-white/30 pb-1.5 ml-1">+ 50 Bonus</span>
        </div>

        {!claimed ? (
          <button onClick={claim} className="btn-blue w-full py-4 text-sm font-black uppercase tracking-widest shadow-blue-500/20">
            <Gift size={16} className="inline -mt-0.5 mr-1.5" /> Claim daily SIHU
          </button>
        ) : (
          <div className="flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
            <CheckCircle size={28} className="text-emerald-500" />
            <div>
              <p className="text-xs font-black text-emerald-500 uppercase">Success! Next claim in:</p>
              <p className="text-2xl font-black text-white font-mono tracking-widest mt-1">
                {fmtTime(countdown)}
              </p>
            </div>
            <div className="ml-auto bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase">
               Streak: 3
            </div>
          </div>
        )}
      </div>

      {/* ── AUTO-MINE AGENT ── */}
      <div className={`glass p-5 transition-all duration-500 ${
        autoMineActive ? "border-blue-500/40 bg-blue-500/5" : "border-white/5 bg-white/[0.02]"
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-2xl ${autoMineActive ? "bg-blue-500 shadow-lg shadow-blue-500/30" : "bg-white/5"}`}>
               <Cpu size={20} className={autoMineActive ? "text-white" : "text-white/20"} />
             </div>
             <div>
                <p className={`text-sm font-black uppercase tracking-tight ${autoMineActive ? "text-blue-400" : "text-white/60"}`}>Auto-Reward Bot</p>
                <p className="text-[10px] text-white/30 font-bold uppercase mt-0.5 tracking-wider">AI Mining Optimization</p>
             </div>
          </div>
          <button 
            onClick={connected ? toggleAutoMine : () => setShowModal(true)}
            className={`w-14 h-8 rounded-full relative transition-all p-1 ${
              autoMineActive ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/10"
            }`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-all ${
              autoMineActive ? "translate-x-6" : "translate-x-0"
            }`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { l:"Mine Rate", v:"0.003 /s", c:"text-blue-400" },
            { l:"Mined",     v:`${balances.sihu.toFixed(1)}`, c:"text-white" },
            { l:"Status",    v: autoMineActive ? "ONLINE" : "OFFLINE", c: autoMineActive ? "text-emerald-400" : "text-white/20" },
          ].map(s => (
            <div key={s.l} className="bg-black/20 border border-white/5 rounded-xl p-3 text-center">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5 leading-none">{s.l}</p>
              <p className={`text-[11px] font-black ${s.c} leading-none tracking-tight`}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MINT TOKENS ── */}
      <div className="glass p-6 border-indigo-500/20 bg-indigo-500/5">
        <h3 className="text-base font-black text-indigo-400 uppercase tracking-tighter mb-1 flex items-center gap-2">
           <Rocket size={18} /> SIHU Token Factory
        </h3>
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-6">
          Deploy Custom Assets on Hedera HTS
        </p>

        {!minted ? (
          <div className="flex flex-col gap-3">
            <input value={mintName} onChange={e=>setMintName(e.target.value)}
              placeholder="Token name (e.g. Sango Gold)"
              className="bg-black/20 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/40" />
            
            <div className="flex gap-3">
              <input value={mintSym} onChange={e=>setMintSym(e.target.value)}
                placeholder="Symbol"
                className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/40 uppercase" />
              <input value={mintSupply} onChange={e=>setMintSupply(e.target.value)}
                type="number" placeholder="Supply"
                className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500/40" />
            </div>
            
            <button onClick={mint}
              disabled={!(mintName && mintSym && mintSupply)}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all
                ${mintName && mintSym && mintSupply 
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg active:scale-95" 
                  : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"}`}>
              Launch on Mainnet Preview
            </button>
          </div>
        ) : (
          <div className="text-center py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
            <div className="mb-3 flex justify-center"><PartyPopper size={38} className="text-sky-300" /></div>
            <p className="text-sm font-black text-emerald-400 uppercase">ASSET DEPLOYED!</p>
            <p className="text-[9px] text-white/30 font-black uppercase mt-4 mb-1">Token Identifier:</p>
            <p className="font-mono text-base font-black text-blue-400 mb-6 bg-black/20 px-4 py-2 rounded-full inline-block">
              {minted}
            </p>
            <div>
              <button onClick={()=>{setMinted(null);setMintName("");setMintSym("");setMintSupply("")}}
                className="text-[10px] font-black text-white/40 border border-white/10 px-6 py-2 rounded-full uppercase tracking-widest hover:text-white transition-colors">
                New Deployment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── WHITELIST ── */}
      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 px-2 flex items-center gap-2">
          <UserPlus size={12} className="text-blue-500" /> Early Access Spots
        </p>
        <div className="flex flex-col gap-3">
          {WHITELIST.map((w, i) => (
            <div key={i} className="glass p-4 border-white/5 hover:border-blue-500/20 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-sky-300 border border-blue-500/20"><Ticket size={22} /></div>
              <div className="flex-1">
                <p className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">{w.name}</p>
                <div className="flex gap-4 items-center">
                  <span className="text-[9px] font-black text-white/30 uppercase flex items-center gap-1">
                    <Users size={10} /> {w.spots}
                  </span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase"><Gift size={11} className="inline -mt-0.5 mr-1" />{w.reward}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                  w.status === "open" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {w.badge}
                </span>
                <button
                  disabled={w.status === "closed"}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    w.status === "open" ? "btn-blue shadow-blue-500/10" : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                  }`}>
                  {w.status === "open" ? "Join" : "Closed"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && <WalletConnectModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
