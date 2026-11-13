"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight, Megaphone, Leaf, Eye, ShieldAlert, Newspaper, Users, Coins, Building2, Laptop, ShieldCheck,
  MapPin, Mail, Phone, Bot, Send, MessageCircle, CheckCircle2,
} from "lucide-react";

/*
 * The SIHU home page: who SIHU is, what it does, the latest stories, and
 * how to reach the team. Same words, logo and photos as before; a calmer,
 * modern layout that works on phones.
 */

const SIHU_EMAIL = "sangoinformationhub@gmail.com";
const SIHU_PHONE = "0722 318 820";
const SIHU_WHATSAPP = "https://wa.me/254722318820";
const SIHU_TELEGRAM = "https://t.me/SihuHubBot";

const PILLARS = [
  { Icon: Megaphone, title: "Public engagement", text: "Engage the public on developmental issues and environmental protection through online/digital media, radio, newspaper and public forums." },
  { Icon: Leaf, title: "Climate accountability", text: "Generate demand for accountability both in government and public on climate change and preservation of the Lake Victoria ecosystem." },
  { Icon: Eye, title: "Public watchdog", text: "Be the public watchdog and voice by amplifying concerns of communities around Lake Victoria on human rights and development issues." },
  { Icon: ShieldAlert, title: "Cross-border safety", text: "Generate stories that sensitize communities on the dangers of cross-border insecurity and environmental protection issues within the county." },
];

const OBJECTIVES = [
  { Icon: Newspaper, title: "Content generation", text: "For the hub to produce high quality and professional content, we have established an elaborate newsgathering network, editorial skills development structure and relevant modern equipment." },
  { Icon: Users, title: "Community involvement", text: "We have established a very solid stakeholder engagement, community involvement and information gathering network through outreaches, promotional activities and content tapping and dissemination strategies." },
  { Icon: Coins, title: "Resource mobilization", text: "The hub requires sufficient resources to finance its operations and improve performance. Both financial and human resources are critical to the success and sustainability of the hub." },
  { Icon: Building2, title: "Institutional capacity", text: "For the hub to produce high quality and professional content, we have established an elaborate newsgathering network, editorial skills development structure and relevant modern equipment." },
  { Icon: Laptop, title: "ICTs integration", text: "Weaving digital and traditional channels — radio, print, e-paper and online — into one integrated production pipeline that reaches all communities." },
  { Icon: ShieldCheck, title: "Eco watchdog", text: "Demanding accountability on preserving the Lake Victoria ecosystem and generating stories that drive environmental protection and conservation action." },
];

const STATS = [
  { value: 10, suffix: "", label: "counties in the Kenyan basin" },
  { value: 40, suffix: "M+", label: "people depend on Lake Victoria" },
  { value: 3, suffix: "", label: "countries share Lake Victoria" },
  { value: 700, suffix: "mm–2000mm", label: "annual rainfall range across the basin" },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const } }),
};

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-[13px] font-bold uppercase tracking-[0.14em] ${light ? "text-sky-300" : "text-sky-700"}`}>{children}</p>;
}

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Message from ${form.name}`;
    const body = `${form.message}\n\nFrom: ${form.name} (${form.email})`;
    window.location.href = `mailto:${SIHU_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="bg-white text-slate-900">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-slate-950 pt-[72px]">
        <div className="absolute inset-0">
          <Image src="/images/lake-fisherman-hero.jpg" alt="Fisherman casting a net on Lake Victoria at golden hour" fill priority quality={90} sizes="100vw" className="object-cover object-[center_40%] animate-netcast" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/20" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/80 to-transparent" />

        <div className="relative container mx-auto max-w-7xl px-4 lg:px-8 py-16">
          <div className="max-w-3xl">
            <motion.div variants={fade} initial="hidden" animate="show" custom={0} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[13px] font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sango Information Hub · Busia, Kenya
            </motion.div>
            <motion.h1 variants={fade} initial="hidden" animate="show" custom={1} className="font-heading text-white text-[28px] min-[375px]:text-[34px] sm:text-5xl lg:text-[64px] font-bold leading-[1.1] mt-5">
              We care about <span className="text-sky-300">Lake Victoria.</span>
            </motion.h1>
            <motion.p variants={fade} initial="hidden" animate="show" custom={2} className="text-slate-200 text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
              We have established a very solid stakeholder engagement, community involvement and information gathering network through outreaches, promotional activities and content tapping and dissemination strategies.
            </motion.p>
            <motion.div variants={fade} initial="hidden" animate="show" custom={3} className="flex flex-wrap gap-3 mt-7">
              <Link href="/portal" className="group inline-flex items-center gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-[15px] sm:text-[16px] font-semibold shadow-lg shadow-sky-500/30 transition-all duration-300">
                Read the latest news <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#story" className="inline-flex items-center gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/25 text-white text-[15px] sm:text-[16px] font-semibold transition-all duration-300">
                Our story
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== THE LAKE IN NUMBERS ===== */}
      <section className="bg-slate-950 text-white border-t border-white/10">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <p className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-sky-300 break-all leading-tight">{s.value}{s.suffix}</p>
              <p className="text-[13px] text-slate-300 mt-1 leading-snug">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== INTRODUCTION (2-column, world map background — mirrors old SIHU) ===== */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        <Image src="/images/Map.png" alt="" fill sizes="100vw" className="object-contain object-center opacity-100" />
        <div className="absolute inset-0 bg-white/60 sm:bg-white/40" />
        <div className="relative container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16">
            <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
              <Eyebrow>Sango Information Hub</Eyebrow>
              <h2 className="font-heading text-[30px] md:text-[38px] font-bold leading-tight mt-3 text-slate-900">Introduction</h2>
              <div className="space-y-4 mt-6 text-[16px] text-slate-700 leading-relaxed">
                <p>
                  Sango Information Hub (SIHU) is a registered community media initiative that works on knowledge management and information sharing on natural resources, environmental protection and development around the Lake Victoria Basin in Kenya.
                </p>
                <p>
                  SIHU works through community involvement in production of radio content, digital information gathering and sharing, a community information and traditional knowledge restoration centre, and production of regular community newspapers — both print and e-paper.
                </p>
                <p>
                  The office is located at Fort Jesus Road in Busia town. The Group&apos;s membership is drawn from across Kenyans residing within the Lake Victoria Basin with interest on human rights, development and environmental protection.
                </p>
                <p>
                  The community media initiative — <em>Sango</em> is the indigenous name for Lake Victoria — produces content and information through community correspondents with focus on development news and environmental protection in the Lake Victoria Basin.
                </p>
              </div>
            </motion.div>
            <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} custom={1}>
              <Eyebrow>The Basin</Eyebrow>
              <h2 className="font-heading text-[30px] md:text-[38px] font-bold leading-tight mt-3 text-slate-900">Lake Victoria Region</h2>
              <div className="space-y-4 mt-6 text-[16px] text-slate-700 leading-relaxed">
                <p>
                  The Lake Victoria Basin Region is made up of ten counties in Kenya, mostly the Western and Nyanza regions, covering nearly 10% of Kenya&apos;s territory. The region is highly densely populated and lies between latitudes 1°16′N and 1°54′S and longitudes 33°55′ and 35°51′E. The equator passes across the region.
                </p>
                <p>
                  The average annual rainfall varies from 700mm along the Lake Victoria shores to 2,000mm in the highlands. Key livelihoods affected include areas around Rivers Yala, Nzoia and Suo, and catchment ecosystems including Mt. Elgon, Lugari, Butere-Mumias, Bungoma, Teso, Busia, Kakamega, Vihiga, Homa Bay, Kisumu, Siaya and Bondo.
                </p>
                <p>
                  Despite better natural resource endowments, the Lake Victoria Basin has been noted as a poverty hotspot, with many people living below the poverty line due to high population density, lack of economic opportunities and rapid degradation of natural resources.
                </p>
                <p>
                  The region is the most flood-prone in Kenya, due to geography, high rainfall, poor land-use practices, deforestation and accumulation of silt in the lower Nzoia Basin — the largest of the four sub-basins of Lake Victoria.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* ===== OUR STORY ===== */}
      <section id="story" className="scroll-mt-20 py-20 md:py-28">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="font-heading text-[34px] md:text-[44px] font-bold leading-tight mt-3">Community media for the Lake Victoria Basin</h2>
            <p className="text-[17px] text-slate-600 leading-relaxed mt-6">
              Sango Information Hub (SIHU) is a registered community media initiative that works on knowledge management and information sharing on natural resources, environmental protection and development around the Lake Victoria Basin in Kenya.
            </p>
            <p className="text-[17px] text-slate-600 leading-relaxed mt-4">
              SIHU works through community involvement in production of radio content, digital information gathering and sharing, a community information and traditional knowledge restoration centre, and production of regular community newspapers — both print and e-paper.
            </p>
            <p className="text-[17px] text-slate-600 leading-relaxed mt-4">
              The community media initiative — Sango is the indigenous name for Lake Victoria — produces content and information through community correspondents with focus on development news and environmental protection in the Lake Victoria Basin.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "The Lake Victoria Basin covers ten counties in Kenya, mostly Western and Nyanza — nearly 10% of Kenya's territory — and is highly densely populated.",
                "The region's annual rainfall varies from 700mm along the lake shores to 2,000mm in the highlands.",
                "Despite rich natural resources, the basin has been noted as a poverty hotspot due to high population density, lack of economic opportunities, and rapid degradation of natural resources.",
                "Our community correspondents produce development news and environmental protection stories from across the basin.",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[16px] text-slate-700 leading-relaxed">
                  <CheckCircle2 size={20} className="text-sky-600 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <p className="inline-flex items-center gap-2 mt-8 text-[14px] font-semibold text-slate-500">
              <MapPin size={16} className="text-sky-600" /> Fort Jesus Road, Busia Town
            </p>
          </motion.div>
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} custom={1} className="relative">
            <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-[0_30px_80px_-30px_rgba(15,23,42,0.5)] group">
              <Image
                src="/images/lake-victoria-bg.png"
                alt="Lake Victoria seen from space"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover object-center animate-netcast"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-60" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-sky-300 text-[12px] font-bold uppercase tracking-[0.12em] mb-1.5">Lake Victoria from space</p>
                <h3 className="text-white font-heading text-[18px] sm:text-[22px] font-bold leading-snug">
                  Africa&apos;s largest freshwater lake — lifeblood of 40 million people across Kenya, Uganda and Tanzania.
                </h3>
              </div>
              <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                🛰️ Satellite view
              </div>
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-2 flex items-center gap-2 transition-all duration-300 group-hover:scale-105">
                <Image src="/images/logo-main.png" alt="Sango Information Hub" width={80} height={24} className="h-6 w-auto object-contain" />
              </div>
            </div>

            {/* Floating info card */}
            <div className="mt-6 md:absolute md:-bottom-6 md:-left-4 lg:-left-8 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 max-w-[280px] mx-auto md:mx-0">
              <Image src="/images/logo-main.png" alt="Sango Information Hub" width={48} height={48} className="w-12 h-auto object-contain shrink-0" />
              <div>
                <p className="font-bold text-[15px] leading-tight">Sango Information Hub</p>
                <p className="text-[13px] text-slate-500">We care about Lake Victoria</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== WHAT WE STAND FOR ===== */}
      <section id="pillars" className="scroll-mt-20 relative overflow-hidden bg-slate-950 text-white py-20 md:py-28">
        <Image src="/images/lake-victoria-map.png" alt="" fill sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
        <div className="relative container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="max-w-2xl">
            <Eyebrow light>Key pillars</Eyebrow>
            <h2 className="font-heading text-[34px] md:text-[44px] font-bold leading-tight mt-3">What we stand for</h2>
            <p className="text-[17px] text-slate-300 leading-relaxed mt-4">The principles that drive our reporting across the Lake Victoria ecosystem.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {PILLARS.map((p, i) => (
              <motion.div key={p.title} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} custom={i}
                className="group rounded-3xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 hover:border-sky-400/40 p-5 sm:p-7 transition-all duration-300">
                <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-400/15 text-sky-300 flex items-center justify-center group-hover:scale-110 transition-transform"><p.Icon size={20} /></span>
                <p className="text-[11px] font-bold text-slate-400 mt-5">Pillar {i + 1}</p>
                <h3 className="font-heading text-[18px] font-bold mt-1">{p.title}</h3>
                <p className="text-[14px] text-slate-300 leading-relaxed mt-2">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OBJECTIVES ===== */}
      <section className="py-20 md:py-28 bg-[#f6f8fb]">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow>Our mission</Eyebrow>
            <h2 className="font-heading text-[34px] md:text-[44px] font-bold leading-tight mt-3">Core objectives</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {OBJECTIVES.map((o, i) => (
              <motion.div key={o.title} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} custom={i % 3}
                className="group bg-white rounded-3xl p-7 border border-slate-200/80 hover:border-sky-200 hover:shadow-[0_20px_40px_-24px_rgba(2,132,199,0.45)] hover:-translate-y-1 transition-all">
                <span className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors"><o.Icon size={22} /></span>
                <h3 className="font-heading text-[20px] font-bold mt-5">{o.title}</h3>
                <p className="text-[15px] text-slate-600 leading-relaxed mt-2">{o.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== REACH US ===== */}
      <section className="pb-6">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-[2rem] bg-gradient-to-br from-sky-600 to-blue-800 text-white p-8 md:p-14 relative overflow-hidden">
            <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-white/10" />
            <div className="absolute right-20 -bottom-32 w-72 h-72 rounded-full bg-white/5" />
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="font-heading text-[30px] md:text-[40px] font-bold leading-tight">Stay informed about the lake</h2>
                <p className="text-[17px] text-sky-100 leading-relaxed mt-4 max-w-lg">Get stories and alerts on Telegram or WhatsApp, or ask our AI assistant about the Lake Victoria Basin.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { href: SIHU_TELEGRAM, Icon: Send, title: "Telegram", text: "Updates bot", ext: true },
                  { href: SIHU_WHATSAPP, Icon: MessageCircle, title: "WhatsApp", text: "Chat with us", ext: true },
                  { href: "/ai", Icon: Bot, title: "AI assistant", text: "Ask a question", ext: false },
                ].map((c) => {
                  const inner = (
                    <>
                      <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><c.Icon size={20} /></span>
                      <span className="block font-bold text-[16px] mt-4">{c.title}</span>
                      <span className="block text-[13.5px] text-sky-100">{c.text}</span>
                    </>
                  );
                  const cls = "block rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 p-5 transition-colors";
                  return c.ext
                    ? <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                    : <Link key={c.title} href={c.href} className={cls}>{inner}</Link>;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="scroll-mt-20 py-20 md:py-28">
        <div className="container mx-auto max-w-7xl px-4 lg:px-8 grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Eyebrow>Contact</Eyebrow>
            <h2 className="font-heading text-[34px] md:text-[44px] font-bold leading-tight mt-3">Start a conversation</h2>
            <p className="text-[17px] text-slate-600 leading-relaxed mt-4">Have a story, a tip or a question about the basin? Write to the SIHU team.</p>
            <div className="mt-8 space-y-4">
              <a href={`mailto:${SIHU_EMAIL}`} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-sky-300 transition-colors">
                <span className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center"><Mail size={20} /></span>
                <span><span className="block text-[13px] text-slate-500">Email</span><span className="block font-semibold text-[15px] break-all">{SIHU_EMAIL}</span></span>
              </a>
              <a href={`tel:+254722318820`} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-sky-300 transition-colors">
                <span className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center"><Phone size={20} /></span>
                <span><span className="block text-[13px] text-slate-500">Phone</span><span className="block font-semibold text-[15px]">{SIHU_PHONE}</span></span>
              </a>
            </div>
          </div>
          <form onSubmit={send} className="lg:col-span-3 bg-[#f6f8fb] rounded-[2rem] p-6 md:p-10 border border-slate-200/80 space-y-5">
            {sent && (
              <p className="flex items-start gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-[15px]" role="status">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> Your email app is opening with your message. Press send there to reach us.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="block text-[14px] font-semibold text-slate-700 mb-2">Your name</span>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 bg-white text-[15px] focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15" placeholder="Full name" />
              </label>
              <label className="block">
                <span className="block text-[14px] font-semibold text-slate-700 mb-2">Your email</span>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 bg-white text-[15px] focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15" placeholder="you@example.com" />
              </label>
            </div>
            <label className="block">
              <span className="block text-[14px] font-semibold text-slate-700 mb-2">Message</span>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 bg-white text-[15px] leading-relaxed focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 resize-y" placeholder="Tell us what is on your mind" />
            </label>
            <button type="submit" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[15px] font-semibold transition-colors">
              <Send size={17} /> Send message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
