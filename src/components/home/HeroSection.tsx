"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center overflow-hidden bg-slate-950 group">
      {/* Background with subtle motion */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-105" 
          style={{ 
            backgroundImage: 'url("/images/6.jpg")',
            filter: 'brightness(1.12) contrast(1.04) saturate(1.12)' 
          }}
        />
        
        {/* Balanced Sun Glow - Creating a natural 'Sunburst' effect without over-sharpening */}
        <div className="absolute top-[5%] right-[15%] w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] bg-amber-200/12 blur-[90px] sm:blur-[120px] md:blur-[150px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute top-[10%] right-[20%] w-64 h-64 bg-white/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Surgical Contrast - Keeping 90% of the image untouched */}
        {/* Bottom edge fade remains for mobile footer UI */}
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
        {/* Tight left fade specifically for headline contrast */}
        <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-[#020617]/70 via-[#020617]/5 to-transparent" />
        
        {/* Removed Grid Noise for maximum image clarity */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.15),transparent_70%)] transition-all duration-1000 pointer-events-none" />
      </motion.div>

      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Main Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-widest mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Sango Information Hub
              </h2>

              <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black mb-6 leading-[0.95] md:leading-[0.9] text-sky-400/90 tracking-tighter">
                ELEVATING <br />
                <span className="text-gradient">ENVIRONMENTAL</span> <br />
                GOVERNANCE.
              </h1>

              <p className="text-xl md:text-2xl text-primary font-black mb-4 uppercase tracking-[0.2em] drop-shadow-md">
                We care about the lake.
              </p>

              <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed drop-shadow-sm">
                Empowering the Lake Victoria Basin community through an elite, citizen-driven information network and gamified verification.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/portal" className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-primary text-white rounded-2xl font-black hover:bg-white hover:text-slate-950 transition-all text-center shadow-xl shadow-primary/20 scale-100 md:scale-105 active:scale-95 group">
                  Enter Info Portal
                  <svg className="inline-block ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Link>
                <a href="#intro" className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-2xl font-black hover:bg-white/10 transition-all text-center">
                  Explore Mission
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right side spacer for asymmetric layout balance */}
          <div className="flex-1 hidden lg:block" />

        </div>
      </div>
    </section>
  );
}
