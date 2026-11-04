import React, { useState } from "react";
import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { 
  Newspaper, Users, Briefcase, Building2, Laptop, ShieldCheck 
} from "lucide-react";
import type { LucideIcon } from "@/types/icon";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface ObjectiveCardProps {
  obj: typeof OBJECTIVES[0];
  Icon: LucideIcon;
}

function ObjectiveCard({ obj, Icon }: ObjectiveCardProps) {
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
      className="relative p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/[0.07] backdrop-blur-md bg-white/[0.01] transition-all duration-700 group h-full flex flex-col items-center text-center hover:bg-white/[0.04] overflow-hidden cursor-pointer"
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
      <div className="relative mb-12">
        {/* Atmospheric Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${obj.gradient} blur-3xl opacity-20 group-hover:opacity-50 transition-opacity duration-700`} />
        
        {/* Animated Tech Orbits */}
        <svg className="absolute -inset-8 w-36 h-36 opacity-30 group-hover:opacity-60 transition-opacity duration-700" viewBox="0 0 100 100">
           <motion.circle 
             cx="50" cy="50" r="45" 
             fill="none" stroke="currentColor" strokeWidth="0.5" 
             strokeDasharray="10 20"
             className={`text-transparent bg-clip-border bg-gradient-to-r ${obj.gradient}`}
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           />
           <motion.circle 
             cx="50" cy="50" r="38" 
             fill="none" stroke="white" strokeWidth="0.2" 
             strokeDasharray="1 5"
             animate={{ rotate: -360 }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
           />
        </svg>

        {/* The Badge Container */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-[1.8rem] md:rounded-[2rem] bg-slate-950 border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden group/badge">
           {/* Frosted Shimmer Layer */}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-50" />
           
           {/* Animated Internal Glow */}
           <div className={`absolute inset-2 rounded-[1.5rem] bg-gradient-to-br ${obj.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
           
           {/* Dual-Tone Interactive Icon */}
           <div className="relative z-10">
              <Icon 
                className={`absolute inset-0 w-10 h-10 md:w-12 md:h-12 blur-lg opacity-60 text-transparent bg-clip-text bg-gradient-to-br ${obj.gradient}`} 
                strokeWidth={3}
              />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="relative w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" strokeWidth={1.2} />
              </motion.div>
           </div>

           {/* Technical Sweep Animation */}
           <motion.div 
             className="absolute inset-0 w-full h-[200%] bg-gradient-to-b from-transparent via-white/[0.08] to-transparent"
             animate={{ y: ["-100%", "100%"] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
           />
        </div>
      </div>
      
      <h3 className="text-xl md:text-2xl font-black mb-4 text-white uppercase tracking-tight group-hover:text-primary transition-colors">
        {obj.title}
      </h3>
      <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-[280px]">
        {obj.desc}
      </p>
    </motion.div>
  );
}


const OBJECTIVES = [
  {
    title: "Premium Content",
    desc: "Producing high-caliber professional content through an elite newsgathering network.",
    icon: Newspaper,
    gradient: "from-blue-500 to-cyan-500",
    glow: "rgba(6,182,212,0.3)",
  },
  {
    title: "Civic Engagement",
    desc: "Establishing deep stakeholder networks and community involvement strategies.",
    icon: Users,
    gradient: "from-emerald-500 to-green-600",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    title: "Resource Strategy",
    desc: "Driving sustainability through robust financial and human resource mobilization.",
    icon: Briefcase,
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.3)",
  },
  {
    title: "Institutional Power",
    desc: "Building a solid network of modern equipment and elite editorial skills.",
    icon: Building2,
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.3)",
  },
  {
    title: "ICT Integration",
    desc: "Seamlessly weaving digital and traditional channels across our production pipelines.",
    icon: Laptop,
    gradient: "from-pink-500 to-rose-600",
    glow: "rgba(244,63,94,0.3)",
  },
  {
    title: "Eco Watchdog",
    desc: "Maintaining a fierce demand for accountability on Lake Victoria ecosystem preservation.",
    icon: ShieldCheck,
    gradient: "from-sky-400 to-blue-600",
    glow: "rgba(56,189,248,0.3)",
  },
];

export default function ObjectivesSection() {
  return (
    <section
      id="objectives"
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/95" />
      </div>

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 z-[1] opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

      {/* Accent glow lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent z-[2]" />

      {/* SIHU Logo watermark */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 z-[2] opacity-[0.06] hidden lg:block">
        <Image src="/images/sihu-logo.png" alt="" width={300} height={300} aria-hidden />
      </div>
      <div className="absolute top-1/2 right-8 -translate-y-1/2 z-[2] opacity-[0.06] hidden lg:block">
        <Image src="/images/sihu-logo.png" alt="" width={300} height={300} aria-hidden className="scale-x-[-1]" />
      </div>


      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <RevealOnScroll className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-primary font-black text-xs tracking-[0.4em] uppercase mb-4 block drop-shadow-md">
            Our Mission
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-white uppercase tracking-tight drop-shadow-lg">
            Core Objectives
          </h2>
          <div className="w-20 md:w-24 h-1 md:h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mt-6 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {OBJECTIVES.map((obj, idx) => {
            const Icon = obj.icon;
            return (
              <RevealOnScroll key={idx} delay={idx * 100}>
                <ObjectiveCard obj={obj} Icon={Icon} />
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
