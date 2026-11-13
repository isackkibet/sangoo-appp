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
                Practise forecasting outcomes for the Lake Victoria Basin — water quality, reforestation and energy projects — and see how your predictions compare.
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
                Challenge the SIHU chess AI at three difficulty levels. Play right in your browser — no account needed.
              </p>
              
              <div className="flex items-center gap-2 text-accent font-black uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform">
                Enter Strategy Arena
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </Link>
        </motion.div>

      </div>
      
      {/* Was a panel of invented network numbers (players, staked, yields); replaced by an honest note. */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-12 p-6 border border-white/10 rounded-3xl bg-slate-900/50 text-center text-[14px] text-slate-300 leading-relaxed"
      >
        Play is in <strong className="text-white">practice mode</strong>: markets use practice credits only, and no money or tokens are staked.
        Leaderboards and live markets will appear here once they launch.
      </motion.p>
    </div>
  );
}
