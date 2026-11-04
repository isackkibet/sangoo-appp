"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function HomeHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled 
          ? "py-3" 
          : "py-8"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-700 px-6 py-3 rounded-[2rem] border ${
          isScrolled 
            ? "bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-2xl" 
            : "bg-transparent border-transparent"
        }`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-10">
            <div className={`p-1.5 rounded-xl transition-all duration-700 ${
              isScrolled ? "bg-white scale-90" : "bg-white/10 backdrop-blur-md scale-110 shadow-2xl"
            }`}>
              <Image 
                src="/images/logo-main.png" 
                alt="SIHU Hub" 
                width={120} 
                height={35} 
                className="h-8 md:h-10 w-auto object-contain"
                priority
              />
            </div>
            {!isScrolled && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:block"
              >
                 <span className="block font-heading font-black text-white text-lg tracking-tight">SIHU Hub</span>
                 <span className="block text-[8px] text-primary font-bold uppercase tracking-widest leading-none">Lake Victoria Basin</span>
              </motion.div>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] text-white">
            <a href="#intro" className="px-4 py-2 hover:text-primary transition-colors">Intro</a>
            <a href="#pillars" className="px-4 py-2 hover:text-primary transition-colors">Pillars</a>
            <div className="w-[1px] h-4 bg-white/20 mx-2" />
            <Link href="/login?next=/media/feed" className="px-5 py-2 hover:text-primary transition-all">
              Login
            </Link>
            <Link href="/portal" className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-white hover:text-slate-950 transition-all shadow-xl shadow-primary/20 ml-2">
              Enter Portal
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-white relative z-10" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-4 top-24 z-[60]"
          >
            <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
              <div className="flex flex-col gap-6 font-black text-center text-white uppercase tracking-[0.2em] text-[10px]">
                <a href="#intro" onClick={() => setMobileMenuOpen(false)}>Establishment</a>
                <a href="#pillars" onClick={() => setMobileMenuOpen(false)}>Focus Areas</a>
                <Link href="/portal" onClick={() => setMobileMenuOpen(false)} className="bg-primary text-white py-5 rounded-2xl shadow-xl shadow-primary/20">
                  Global Info Portal
                </Link>
                <Link href="/login?next=/media/feed" onClick={() => setMobileMenuOpen(false)} className="border border-white/20 text-white py-4 rounded-2xl bg-white/5">
                  Log In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
