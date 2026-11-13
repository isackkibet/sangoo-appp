"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import BasinMap from "@/components/map/BasinMap";
import SihuStatsPanel from "@/components/stats/SihuStatsPanel";
import { BASIN_FACTS, BASIN_PLACES, BASIN_PLACE_KINDS, type BasinPlace, type BasinPlaceKind } from "@/constants/basin";

const ALL_KINDS = Object.keys(BASIN_PLACE_KINDS) as BasinPlaceKind[];

/** Search term for news about a place ("Kisumu County" -> "Kisumu"). */
const newsQuery = (p: BasinPlace) => p.name.replace(/ County$/, "").replace(/^SIHU office, /, "").replace(/ \(.*\)$/, "").split(",")[0];

export default function MapExplorer() {
  const [kinds, setKinds] = React.useState<BasinPlaceKind[]>(ALL_KINDS);
  const [selected, setSelected] = React.useState<BasinPlace | null>(BASIN_PLACES[0]);
  const [focusId, setFocusId] = React.useState<string | null>(null);

  const toggle = (k: BasinPlaceKind) =>
    setKinds((cur) => (cur.includes(k) ? (cur.length > 1 ? cur.filter((x) => x !== k) : cur) : [...cur, k]));
  const pick = (p: BasinPlace) => { setSelected(p); setFocusId(null); requestAnimationFrame(() => setFocusId(p.id)); };
  const shown = BASIN_PLACES.filter((p) => kinds.includes(p.kind));

  return (
    <div className="bg-[#f6f8fb] min-h-screen pt-[72px] text-slate-900">
      <header className="container mx-auto max-w-7xl px-4 lg:px-8 pt-10 md:pt-14 pb-6">
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-700">Basin map</p>
        <h1 className="font-heading text-[32px] md:text-[44px] font-bold leading-tight mt-2">The Lake Victoria Basin in Kenya</h1>
        <p className="text-[16px] md:text-[17px] text-slate-600 mt-3 max-w-3xl leading-relaxed">
          Explore the counties, rivers, wetlands and forests SIHU reports on. Choose a place to learn about it and read related stories.
        </p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
          {BASIN_FACTS.map((f) => (
            <div key={f.label} className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col-reverse">
              <dt className="text-[12.5px] text-slate-500">{f.label}</dt>
              <dd className="font-heading text-[22px] md:text-[26px] font-bold text-sky-700 leading-tight">{f.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className="container mx-auto max-w-7xl px-4 lg:px-8 pb-12" aria-label="Interactive map">
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Show on the map">
          {ALL_KINDS.map((k) => {
            const on = kinds.includes(k);
            return (
              <button key={k} onClick={() => toggle(k)} aria-pressed={on}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-colors ${on ? "bg-white border-slate-300 text-slate-900 shadow-sm" : "bg-transparent border-slate-200 text-slate-400"}`}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: on ? BASIN_PLACE_KINDS[k].color : "#cbd5e1" }} />
                {BASIN_PLACE_KINDS[k].label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-12 gap-5">
          <BasinMap className="lg:col-span-8 h-[420px] sm:h-[520px] lg:h-[620px]" kinds={kinds} focusId={focusId} onSelect={setSelected} />

          <aside className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            {selected && (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-5" aria-live="polite">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: BASIN_PLACE_KINDS[selected.kind].color }}>{BASIN_PLACE_KINDS[selected.kind].label}</p>
                <h2 className="font-heading text-[20px] font-bold mt-1">{selected.name}</h2>
                <p className="text-[14.5px] text-slate-600 leading-relaxed mt-2">{selected.summary}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {selected.kind === "office" ? (
                    <Link href="/#contact" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[13px] font-semibold">Contact SIHU <ArrowRight size={14} /></Link>
                  ) : (
                    <Link href={`/portal?q=${encodeURIComponent(newsQuery(selected))}#latest-news`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[13px] font-semibold">
                      <Newspaper size={14} /> News about {newsQuery(selected)}
                    </Link>
                  )}
                  <Link href="/ai" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 hover:border-sky-400 text-slate-800 text-[13px] font-semibold">Ask SIHU AI</Link>
                </div>
              </div>
            )}
            <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden flex-1 min-h-0">
              <p className="px-5 pt-4 pb-2 text-[13px] font-semibold text-slate-500">{shown.length} places</p>
              <ul className="max-h-[300px] lg:max-h-[340px] overflow-y-auto px-2 pb-2">
                {shown.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => pick(p)} aria-current={selected?.id === p.id ? "true" : undefined}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${selected?.id === p.id ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BASIN_PLACE_KINDS[p.kind].color }} />
                      <span className="text-[14px] font-semibold text-slate-800">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 lg:px-8 pb-16" aria-labelledby="live-numbers">
        <h2 id="live-numbers" className="font-heading text-[24px] md:text-[28px] font-bold mb-5">SIHU in numbers</h2>
        <SihuStatsPanel />
      </section>
    </div>
  );
}
