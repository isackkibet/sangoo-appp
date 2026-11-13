"use client";

import { useState } from 'react';
import { PredictionList, StakingInterface, PredictionMarket } from '../../../components/portal/play/Predictions';
import { Zap, Info } from "lucide-react";

/* Practice questions about the basin. Each names the public source that settles it.
 * (Replaced invented odds, trading volumes and a fake "performance history".) */
const QUESTIONS: PredictionMarket[] = [
  {
    id: 'q-long-rains-2027',
    title: 'Will the March–May 2027 long rains be above normal in the Lake Victoria Basin?',
    description: 'Settled by the Kenya Meteorological Department\'s seasonal review for the Lake Victoria Basin counties.',
    category: 'Climate',
    endDate: '2027-06-30',
    source: { name: 'Kenya Meteorological Department', url: 'https://meteo.go.ke' },
  },
  {
    id: 'q-budalangi-floods-2027',
    title: 'Will the River Nzoia flood homes in Budalang\'i during the 2027 long rains?',
    description: 'Settled by flood reports from the National Disaster Operations Centre and Busia County for March–May 2027.',
    category: 'Disasters',
    endDate: '2027-06-15',
    source: { name: 'Kenya Red Cross / Busia County', url: 'https://www.redcross.or.ke' },
  },
  {
    id: 'q-hyacinth-winam-2027',
    title: 'Will water hyacinth block Kisumu port for more than two weeks in 2027?',
    description: 'Settled by Kenya Ports Authority and Kenya Marine and Fisheries Research Institute reports on the Winam Gulf.',
    category: 'Lake Victoria',
    endDate: '2027-12-31',
    source: { name: 'KMFRI', url: 'https://www.kmfri.go.ke' },
  },
  {
    id: 'q-lake-level-2027',
    title: 'Will Lake Victoria\'s water level in June 2027 be higher than in June 2026?',
    description: 'Settled by the Lake Victoria Basin Commission / Nile Basin water level records for the lake.',
    category: 'Lake Victoria',
    endDate: '2027-07-31',
    source: { name: 'Lake Victoria Basin Commission', url: 'https://www.lvbcom.org' },
  },
];

export default function PredictionsPage() {
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);

  return (
    <div className="space-y-8">
      <p className="flex items-start gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4 text-[14px] text-slate-300 leading-relaxed">
        <Info size={18} className="text-sky-300 shrink-0 mt-0.5" />
        Practice forecasts: choose Yes or No on real questions about the basin. Nothing is staked, and your picks are saved only on this device.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Zap size={18} className="inline -mt-1 mr-1.5 text-primary" />Open questions
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
              Practice mode
            </span>
          </div>

          <PredictionList
            markets={QUESTIONS}
            onSelectMarket={setSelectedMarket}
            selectedMarketId={selectedMarket?.id}
          />
        </div>

        <div className="space-y-8">
          <StakingInterface market={selectedMarket} />
        </div>
      </div>
    </div>
  );
}
