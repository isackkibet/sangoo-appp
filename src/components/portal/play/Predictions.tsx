"use client";

import React, { useState } from 'react';
import { Target, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * Practice forecasts about the Lake Victoria Basin.
 * There are no odds, volumes or stakes: those were invented numbers. Each
 * question names the public source that will settle it, and a visitor's
 * forecast is kept on their own device.
 */

/** ─── MODELS ─── **/

export interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  /** When the outcome can be checked (ISO date). */
  endDate: string;
  /** Who publishes the result. */
  source: { name: string; url: string };
}

export type Forecast = 'yes' | 'no';
const STORE = 'sihu_practice_forecasts_v1';

export function readForecasts(): Record<string, Forecast> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; }
}
function saveForecast(id: string, f: Forecast | null) {
  const all = readForecasts();
  if (f) all[id] = f; else delete all[id];
  localStorage.setItem(STORE, JSON.stringify(all));
  window.dispatchEvent(new Event('sihu-forecasts'));
}

/** Live view of this device's forecasts. */
export function useForecasts() {
  const [map, setMap] = useState<Record<string, Forecast>>({});
  React.useEffect(() => {
    const sync = () => setMap(readForecasts());
    sync();
    window.addEventListener('sihu-forecasts', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sihu-forecasts', sync); window.removeEventListener('storage', sync); };
  }, []);
  return map;
}

const dateWords = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

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
  const forecasts = useForecasts();
  const categories = ['All', ...Array.from(new Set(markets.map(m => m.category)))];
  const filtered = filter === 'All' ? markets : markets.filter(m => m.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter questions">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            aria-pressed={filter === cat}
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
        {filtered.map(market => {
          const mine = forecasts[market.id];
          return (
            <button
              key={market.id}
              type="button"
              onClick={() => onSelectMarket(market)}
              aria-pressed={selectedMarketId === market.id}
              className={`text-left rounded-2xl border transition-all duration-300 p-5 group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedMarketId === market.id
                  ? 'bg-slate-800 border-primary shadow-xl shadow-primary/10'
                  : 'bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-800'
              }`}
            >
              <span className="flex justify-between items-start gap-3 mb-3">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400 group-hover:text-primary transition-colors uppercase tracking-widest">
                  {market.category}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">Result after {dateWords(market.endDate)}</span>
              </span>
              <span className="text-base font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">{market.title}</span>
              <span className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{market.description}</span>
              <span className="mt-auto text-[12px] font-semibold">
                {mine
                  ? <span className={mine === 'yes' ? 'text-emerald-400' : 'text-rose-400'}>Your forecast: {mine === 'yes' ? 'Yes' : 'No'}</span>
                  : <span className="text-slate-500">No forecast yet — tap to choose</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** ─── FORECAST PANEL ─── **/

export function StakingInterface({ market }: { market: PredictionMarket | null }) {
  const forecasts = useForecasts();

  if (!market) {
    return (
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="mb-4 opacity-30 flex justify-center"><Target size={38} /></div>
        <h3 className="text-lg font-bold text-slate-300">Choose a question</h3>
        <p className="text-sm text-slate-500 mt-2">Pick a question from the list to make your practice forecast.</p>
      </div>
    );
  }

  const mine = forecasts[market.id];

  return (
    <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 shadow-2xl lg:sticky lg:top-[180px]">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Your practice forecast</p>
      <h3 className="text-lg font-bold text-white mb-3 leading-tight">{market.title}</h3>
      <p className="text-[13px] text-slate-400 leading-relaxed mb-5">{market.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-5" role="radiogroup" aria-label="Your forecast">
        {(['yes', 'no'] as const).map(side => (
          <button
            key={side}
            role="radio"
            aria-checked={mine === side}
            onClick={() => saveForecast(market.id, mine === side ? null : side)}
            className={`py-3 rounded-xl font-black border transition-all ${
              mine === side
                ? side === 'yes' ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/20'
            }`}
          >
            {side === 'yes' ? 'Yes' : 'No'}
          </button>
        ))}
      </div>

      {mine ? (
        <p className="flex items-start gap-2 text-[13px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3" role="status">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> Saved on this device. Check back after {dateWords(market.endDate)} to see how you did.
        </p>
      ) : (
        <p className="text-[13px] text-slate-500">Practice only — no credits, money or tokens are used.</p>
      )}

      <a href={market.source.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
        Settled by: {market.source.name} <ExternalLink size={13} />
      </a>
    </div>
  );
}
