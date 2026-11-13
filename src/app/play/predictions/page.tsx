"use client";

import { useState } from 'react';
import { PredictionList, StakingInterface, ResultTracker, PredictionMarket } from '../../../components/portal/play/Predictions';
import { ChevronRight, Zap, BarChart3 } from "lucide-react";

const MOCK_MARKETS: PredictionMarket[] = [
  {
    id: '1',
    title: 'Will the Kisumu Water Quality sensors report <0.05 E.coli by Sep?',
    description: 'Outcome determined by the verified IoT sensor data from the Kisumu Basin Water Project. Verification requires 3 independent local reports.',
    category: 'Lake Victoria',
    yesOdds: 72,
    noOdds: 28,
    totalVolume: '5,420',
    endDate: '2026-09-30'
  },
  {
    id: '2',
    title: 'Will the SIHU Social Token reach $1.00 relative to Hedera?',
    description: 'Market settles based on the 7-day volume-weighted average price of SIHU on the SaucerSwap DEX.',
    category: 'Social',
    yesOdds: 45,
    noOdds: 55,
    totalVolume: '25,890',
    endDate: '2026-06-30'
  },
  {
    id: '3',
    title: 'Will 50+ New Micro-Forests be verified by citizen agents this month?',
    description: 'Requires at least 50 unique, photo-verified micro-forest submissions through the SIHU Verify & Earn portal.',
    category: 'Ecosystem',
    yesOdds: 68,
    noOdds: 32,
    totalVolume: '12,400',
    endDate: '2026-04-30'
  },
  {
    id: '4',
    title: 'Will the Winam Gulf Floating Solar Project exceed 2MW by June?',
    description: 'Determined by the official energy output report from the Green Energy Council of East Africa.',
    category: 'Climate',
    yesOdds: 88,
    noOdds: 12,
    totalVolume: '8,200',
    endDate: '2026-06-15'
  }
];

const RECENT_HISTORY = [
  {
    title: 'Maji Safi Phase 1 Implementation',
    status: 'completed' as const,
    completionPct: 100,
    totalStaked: '8,400',
    endDate: '2026-03-15'
  },
  {
    title: 'Nyeri Reforestation Drive (Target 5ha)',
    status: 'failed' as const,
    completionPct: 42,
    totalStaked: '4,500',
    endDate: '2026-02-28'
  },
  {
    title: 'E-Waste Bin Network Setup',
    status: 'active' as const,
    completionPct: 65,
    totalStaked: '1,200',
    endDate: '2026-05-30'
  }
];

export default function PredictionsPage() {
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);

  return (
    <div className="space-y-12 animate-fade-in-up">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Markets List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Zap size={18} className="inline -mt-1 mr-1.5 text-primary" />Active markets
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
              Live Network Feed
            </span>
          </div>
          
          <PredictionList 
            markets={MOCK_MARKETS} 
            onSelectMarket={setSelectedMarket} 
            selectedMarketId={selectedMarket?.id}
          />
        </div>

        {/* Right Column - Staking Interface */}
        <div className="space-y-8">
          <StakingInterface market={selectedMarket} />
        </div>
      </div>

      {/* History / Tracking Section */}
      <div className="pt-12 border-t border-white/10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black flex items-center gap-2">
            <BarChart3 size={18} className="inline -mt-1 mr-1.5 text-amber-500" />Network performance history
          </h2>
          <button className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest hover:text-primary transition-all cursor-pointer flex items-center gap-2 group/all bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-slate-900 shadow-sm">
            View All Reports 
            <ChevronRight size={14} strokeWidth={3} className="transition-transform group-hover/all:translate-x-1 text-primary" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RECENT_HISTORY.map((hist, idx) => (
            <ResultTracker key={idx} {...hist} />
          ))}
        </div>
      </div>

    </div>
  );
}
