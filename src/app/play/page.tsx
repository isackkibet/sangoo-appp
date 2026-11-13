"use client";

import React from 'react';
import { BarChart3, Crown } from "lucide-react";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PlayHubPage() {
  return (
    <div className="py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Predictions Market Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="group"
        >
          <Link href="/play/predictions" className="block h-full">
            <div className="h-full bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 hover:border-primary/50 transition-all shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="mb-8 w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl border border-primary/30 group-hover:scale-110 transition-transform">
                <BarChart3 size={30} />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Predictions <br />Market</h2>
              <p className="text-slate-400 font-medium mb-8 flex-1 leading-relaxed">
                Stake your SIHU Credits on basin-wide telemetry outcomes. Analyze trends, predict water levels, and earn yields on high-integrity data.
              </p>
              
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform">
                Launch Market Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* AI Chess Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="group"
        >
          <Link href="/play/chess" className="block h-full">
            <div className="h-full bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 hover:border-accent/50 transition-all shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="mb-8 w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-4xl border border-accent/30 group-hover:scale-110 transition-transform">
                <Crown size={30} />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">AI Strategic<br />Chess</h2>
              <p className="text-slate-400 font-medium mb-8 flex-1 leading-relaxed">
                Challenge our basin-trained AI engine in a strategic chess match. Prove your intelligence, stake credits, and rise in the agent leaderboard.
              </p>
              
              <div className="flex items-center gap-2 text-accent font-black uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform">
                Enter Strategy Arena
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </Link>
        </motion.div>

      </div>
      
      {/* Network Stats Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-12 p-8 border border-white/5 rounded-3xl bg-slate-900/50 flex flex-wrap items-center justify-center gap-12"
      >
        <div className="text-center">
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Players</div>
           <div className="text-xl font-black text-white">4,284</div>
        </div>
        <div className="text-center">
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Staked</div>
           <div className="text-xl font-black text-primary">840.4K SIHU</div>
        </div>
        <div className="text-center">
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yields Distributed</div>
           <div className="text-xl font-black text-emerald-400">+125,280</div>
        </div>
      </motion.div>
    </div>
  );
}
