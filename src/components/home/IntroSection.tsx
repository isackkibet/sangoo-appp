import React, { useState, useEffect } from "react";
import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function IntroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <section 
      id="intro" 
      onMouseMove={handleMouseMove}
      className="py-16 md:py-32 bg-background relative overflow-hidden group/intro"
    >
      {/* ── Base Layer (Atmospheric Dark) ── */}
      <div 
        className="absolute inset-0 z-0 bg-slate-950 pointer-events-none"
      />

      {/* ── Background Image (Mobile-Friendly Visibility) ── */}
      <div 
        className="absolute inset-0 z-[1] opacity-30 md:opacity-20 pointer-events-none transition-all duration-700 blur-[3px] md:blur-[2px]"
        style={{ 
          backgroundImage: 'url("/images/lake-victoria-sunrise-hd.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* ── Interactive Spotlight Reveal ── */}
      <motion.div 
        className="absolute inset-0 z-[2] opacity-0 group-hover/intro:opacity-100 transition-opacity duration-700 pointer-events-none hidden md:block"
        style={{ 
          backgroundImage: 'url("/images/lake-victoria-sunrise-hd.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          WebkitMaskImage: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(circle 250px at ${x}px ${y}px, black 0%, transparent 100%)`
          ),
          maskImage: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(circle 250px at ${x}px ${y}px, black 0%, transparent 100%)`
          ),
        }}
      />

      {/* Dynamic Watermark */}
      <motion.div 
        className="absolute -right-20 -top-20 z-[3] opacity-[0.03] select-none pointer-events-none"
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 50, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <Image src="/images/sihu-logo.png" alt="" width={600} height={600} />
      </motion.div>

      {/* Animated glow overlay */}
      <div className="absolute inset-0 z-[3] bg-gradient-to-tr from-primary/5 via-transparent to-blue-500/5 animate-pulse" style={{ animationDuration: '8s' }} />
      
      {/* Floating Data Particles */}
      <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
        {isMounted && [...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full blur-[1px]"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: [null, (Math.random() * 100 - 50) + "%"],
              x: [null, (Math.random() * 100 - 50) + "%"],
              opacity: [0, 0.4, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-stretch">
              <div className="lg:w-1/2">
                <RevealOnScroll>
                   <div className="glass-premium p-8 md:p-14 rounded-[2.5rem] md:rounded-[3rem] h-full shadow-2xl border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-primary/10 transition-all duration-500"></div>
                      <span className="text-primary font-bold text-[10px] md:text-xs tracking-[0.3em] uppercase mb-4 block relative z-10">Origins</span>
                      <h2 className="text-3xl md:text-5xl font-black mt-2 mb-8 text-nyc-header text-foreground uppercase relative z-10">
                        Our <br /> Story
                      </h2>
                      <div className="space-y-6 text-nyc-body text-slate-300 md:text-muted-foreground text-base md:text-lg font-medium md:font-light leading-relaxed relative z-10">
                          <p>Sango Information Hub (SIHU) is a registered community media initiative that works on knowledge management and information sharing on natural resources and environmental protection and development around the Lake Victoria Basin in Kenya.</p>
                          <p>The Sango Information Hub works through community involvement in production of radio content, digital information gathering and sharing, community information and traditional knowledge restoration centre.</p>
                      </div>
                   </div>
                </RevealOnScroll>
              </div>
              <div className="lg:w-1/2">
                <RevealOnScroll delay={200}>
                  <div className="glass-premium p-8 md:p-14 rounded-[2.5rem] md:rounded-[3rem] h-full shadow-2xl border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-500"></div>
                      <div className="space-y-6 md:space-y-8 text-nyc-body text-slate-300 md:text-muted-foreground text-base md:text-lg font-medium md:font-light leading-relaxed relative z-10 h-full flex flex-col justify-between">
                          <div>
                            <p className="mb-6">The Lake Victoria Basin Region is made up of ten Counties in Kenya mostly the Western and Nyanza that cover nearly 10% of Kenya&apos;s territory, is highly densely populated.</p>
                            <p>Producing content and information through community correspondents majorly with focus on development news and environmental protection in the Lake Victoria Basin.</p>
                          </div>
                          <div className="pt-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-[1px] bg-primary"></div>
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Fort Jesus Road, Busia Town</span>
                            </div>
                          </div>
                       </div>
                  </div>
                </RevealOnScroll>
              </div>
          </div>
      </div>
    </section>
  );
}
