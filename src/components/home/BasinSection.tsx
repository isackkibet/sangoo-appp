"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import SihuStatsPanel from "@/components/stats/SihuStatsPanel";

// Leaflet needs the browser; the placeholder keeps the layout steady while it loads.
const BasinMap = dynamic(() => import("@/components/map/BasinMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-3xl bg-slate-800/60 animate-pulse" />,
});

/** Basin map preview + live SIHU numbers on the home page. */
export default function BasinSection() {
  return (
    <section id="basin" className="scroll-mt-20 relative overflow-hidden bg-slate-950 text-white py-16 md:py-24" aria-labelledby="basin-title">
      <div className="relative container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-300">The basin we cover</p>
            <h2 id="basin-title" className="font-heading text-[30px] md:text-[40px] font-bold leading-tight mt-3">Ten counties, one lake</h2>
            <p className="text-[16px] text-slate-300 leading-relaxed mt-4">
              From Mt. Elgon to the Winam Gulf, SIHU reports on the communities, rivers and wetlands of the Kenyan Lake Victoria Basin. Our office is on Fort Jesus Road in Busia.
            </p>
            <Link href="/map" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-[15px] font-semibold shadow-lg shadow-sky-500/25 transition-colors">
              Open the basin map <ArrowRight size={16} />
            </Link>
            <h3 className="font-heading text-[20px] font-bold mt-10 mb-4">SIHU in numbers</h3>
            <SihuStatsPanel dark />
          </div>
          <div className="lg:col-span-7 h-[360px] sm:h-[460px] lg:h-[560px] lg:sticky lg:top-24">
            <BasinMap compact className="h-full border-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
}
