import React, { useState } from "react";
import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { Megaphone, Leaf, Eye, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "@/types/icon";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface PillarCardProps {
  pillar: typeof PILLARS[0];
  Icon: LucideIcon;
  idx: number;
}

function PillarCard({ pillar, Icon, idx }: PillarCardProps) {
  const [isTouch, setIsTouch] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-100, 100], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-15, 15]), { stiffness: 300, damping: 30 });

  React.useEffect(() => {
    setIsTouch(!window.matchMedia("(hover: hover)").matches);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isTouch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div 
      className="relative p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/[0.07] hover:border-white/20 transition-all duration-700 group h-full backdrop-blur-3xl bg-white/[0.01] overflow-hidden cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        rotateX: isTouch ? 0 : rotateX, 
        rotateY: isTouch ? 0 : rotateY, 
        perspective: 1000 
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* ── Creative Holographic Badge ── */}
      <div className="relative mb-10">
        {/* Glow Layer */}
        <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} blur-3xl opacity-10 group-hover:opacity-40 transition-opacity duration-700`} />
        
        {/* Animated Tech Orbits */}
        <svg className="absolute -inset-8 w-32 h-32 md:w-36 md:h-36 opacity-30 group-hover:opacity-60 transition-opacity duration-700" viewBox="0 0 100 100">
           <motion.circle 
             cx="50" cy="50" r="45" 
             fill="none" stroke="currentColor" strokeWidth="0.5" 
             strokeDasharray="10 20"
             className={`text-transparent bg-clip-border bg-gradient-to-r ${pillar.gradient}`}
             animate={{ rotate: 360 }}
             transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           />
           <motion.circle 
             cx="50" cy="50" r="38" 
             fill="none" stroke="white" strokeWidth="0.2" 
             strokeDasharray="1 5"
             animate={{ rotate: -360 }}
             transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
           />
        </svg>

        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[1.8rem] bg-slate-950 border border-white/20 flex items-center justify-center overflow-hidden shadow-2xl group/badge">
          {/* Inner Shine */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-40" />
          
          {/* Duotone Icon */}
          <div className="relative z-10">
             <Icon 
              className={`absolute inset-0 w-8 h-8 md:w-10 md:h-10 blur-md opacity-40 text-transparent bg-clip-text bg-gradient-to-br ${pillar.gradient}`}
              strokeWidth={3}
            />
            <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className="relative w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" strokeWidth={1.2} />
            </motion.div>
          </div>
          
          {/* Technical Sweep Animation */}
          <motion.div 
             className="absolute inset-0 w-full h-[200%] bg-gradient-to-b from-transparent via-white/[0.08] to-transparent"
             animate={{ y: ["-100%", "100%"] }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           />
        </div>
      </div>

      {/* Number badge */}
      <span className="absolute top-8 right-10 text-[10px] font-black text-white/5 uppercase tracking-[0.3em] group-hover:text-primary/30 transition-all duration-500 whitespace-nowrap">
        PILLAR 0{idx + 1}
      </span>

      <p className="text-base md:text-lg font-medium leading-relaxed text-slate-300 group-hover:text-white transition-colors">
        {pillar.text}
      </p>
    </motion.div>
  );
}


const PILLARS = [
  {
    text: "Public engagement on developmental issues through elite digital media and public forums",
    icon: Megaphone,
    gradient: "from-sky-500 to-blue-600",
    glow: "rgba(56,189,248,0.25)",
  },
  {
    text: "Accountability demand on climate change and preservation of the Lake Victoria Ecosystem",
    icon: Leaf,
    gradient: "from-emerald-500 to-teal-600",
    glow: "rgba(16,185,129,0.25)",
  },
  {
    text: "Public watchdog amplifying community concerns on human rights and development",
    icon: Eye,
    gradient: "from-violet-500 to-indigo-600",
    glow: "rgba(139,92,246,0.25)",
  },
  {
    text: "Sensitizing communities on dangers of cross-border insecurity and environmental protection",
    icon: ShieldAlert,
    gradient: "from-amber-500 to-orange-600",
    glow: "rgba(245,158,11,0.25)",
  },
];

export default function PillarsSection() {
  return (
    <section
      id="pillars"
      className="py-16 md:py-32 text-white relative overflow-hidden"
    >
      {/* ── Lake Victoria Satellite Background ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/lake-victoria-bg.png"
          alt="Lake Victoria aerial view"
          fill
          className="object-cover"
          quality={85}
          priority={false}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-blue-950/88 to-slate-950/95" />
      </div>

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 z-[1] opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

      {/* Accent glow lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent z-[2]" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent z-[2]" />

      {/* SIHU Logo watermark */}
      <div className="absolute top-8 right-8 z-[2] opacity-[0.08] hidden lg:block">
        <Image src="/images/sihu-logo.png" alt="" width={200} height={200} aria-hidden />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 md:gap-20 items-start lg:items-center">
          <div className="lg:w-1/3">
            <RevealOnScroll>
              <span className="text-primary font-black text-xs tracking-[0.3em] uppercase mb-4 block">
                Foundations
              </span>
              <h2 className="text-3xl md:text-6xl font-black mt-2 mb-6 text-nyc-header uppercase">
                Key <br className="hidden md:block" /> Pillars
              </h2>
              <p className="text-lg md:text-xl font-light text-slate-400 leading-relaxed">
                Our core principles driving sustainable change across the Lake
                Victoria ecosystem.
              </p>
            </RevealOnScroll>
          </div>

          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {PILLARS.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <RevealOnScroll key={idx} delay={idx * 150}>
                    <PillarCard pillar={pillar} Icon={Icon} idx={idx} />
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
