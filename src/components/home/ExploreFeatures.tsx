"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Newspaper, Users, Map as MapIcon, Bot, PenLine, ScanSearch, Wallet, Gamepad2 } from "lucide-react";

/* One place that lists every SIHU feature, so visitors never have to hunt through menus. */
const FEATURES = [
  { href: "/portal", Icon: Newspaper, title: "News & stories", text: "Reporting on the environment, governance and development from across the basin, plus podcasts and events." },
  { href: "/media/feed", Icon: Users, title: "Community reports", text: "Photos, videos and updates shared by members from their villages, beaches and farms." },
  { href: "/map", Icon: MapIcon, title: "Basin map", text: "An interactive map of the Kenyan Lake Victoria Basin: counties, rivers, wetlands and forests." },
  { href: "/ai", Icon: Bot, title: "SIHU AI Assistant", text: "Ask questions about the lake in English or Kiswahili and get answers with sources." },
  { href: "/portal/submit", Icon: PenLine, title: "Submit a story", text: "Send an article, podcast or event to the SIHU editors for review and publication." },
  { href: "/verify", Icon: ScanSearch, title: "Verify", text: "Help keep environmental reporting true by checking field photos." },
  { href: "/dapp", Icon: Wallet, title: "SIHU DApp", text: "Connect a wallet to see SIHU, AVAX and USDT balances and explore community finance tools." },
  { href: "/play", Icon: Gamepad2, title: "Play", text: "Practise prediction markets about the basin and play chess against the SIHU AI." },
];

export default function ExploreFeatures() {
  return (
    <section id="explore" className="scroll-mt-20 py-16 md:py-24 bg-white" aria-labelledby="explore-title">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-700">Explore SIHU</p>
            <h2 id="explore-title" className="font-heading text-[30px] md:text-[40px] font-bold leading-tight mt-3">Everything SIHU offers, in one place</h2>
          </div>
          <p className="text-[15.5px] text-slate-600 max-w-md leading-relaxed">News, community reports, maps and tools for the Lake Victoria Basin — pick where to start.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {FEATURES.map((f, i) => (
            <motion.div key={f.href} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}>
              <Link href={f.href}
                className="group relative flex h-full flex-col rounded-3xl border border-slate-200/80 bg-[#f8fafc] p-6 transition-all hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_20px_40px_-24px_rgba(2,132,199,0.45)] focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300">
                <span className="w-11 h-11 rounded-2xl bg-white ring-1 ring-slate-200 text-sky-700 flex items-center justify-center transition-colors group-hover:bg-sky-600 group-hover:text-white group-hover:ring-sky-600"><f.Icon size={20} /></span>
                <h3 className="font-heading text-[18px] font-bold mt-5 text-slate-900">{f.title}</h3>
                <p className="text-[14px] text-slate-600 leading-relaxed mt-2 flex-1">{f.text}</p>
                <ArrowUpRight size={18} className="absolute top-6 right-6 text-slate-300 transition-all group-hover:text-sky-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
