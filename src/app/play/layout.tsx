"use client";

import React from 'react';
import { BarChart3, Crown } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NewsHeader from '../../components/portal/NewsHeader';

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0 opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-tr from-[#020617] via-primary/5 to-transparent pointer-events-none z-0" />
      
      {/* Navigation */}
      <div className="relative z-50">
        <NewsHeader />
      </div>

      {/* Play Section Header */}
      {/* Room for the fixed site header */}
      <div className="h-[72px]" />
      <div className="border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-[72px] z-40 pt-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-baseline justify-between gap-4">
          <div className="py-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
              Basin Arena
            </h1>
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] mt-1.5 max-w-lg">
              Strategic Competition & Prediction Nodes
            </p>
          </div>

          <div className="flex space-x-2 pb-[-1px]">
            <Link 
              href="/play/predictions" 
              className={`px-6 py-3 font-bold text-sm tracking-wide rounded-t-xl transition-all border-b-2 ${pathname === '/play/predictions' ? 'bg-white/10 text-primary border-primary' : 'hover:bg-white/5 border-transparent text-slate-400'}`}
            >
              <BarChart3 size={15} className="inline -mt-0.5 mr-1.5" />Predictions market
            </Link>
            <Link 
              href="/play/chess" 
              className={`px-6 py-3 font-bold text-sm tracking-wide rounded-t-xl transition-all border-b-2 ${pathname === '/play/chess' ? 'bg-white/10 text-primary border-primary' : 'hover:bg-white/5 border-transparent text-slate-400'}`}
            >
              <Crown size={15} className="inline -mt-0.5 mr-1.5" />AI chess
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
