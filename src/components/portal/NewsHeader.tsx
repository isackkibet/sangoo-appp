"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, UserRound } from "lucide-react";
import { useSihuAuth } from "@/components/auth/SihuAuth";

/* Same destinations as before; a clean, readable news-site bar. */
const LINKS = [
  { name: "Home", href: "/" },
  { name: "News", href: "/portal" },
  { name: "Media", href: "/media/feed", special: true },
  { name: "AI Hub", href: "/ai" },
  { name: "DApp", href: "/dapp" },
  { name: "Play", href: "/play" },
  { name: "Verify", href: "/verify", special: true },
];

export default function NewsHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const path = usePathname() ?? "";
  const auth = useSihuAuth();
  const who = auth.name?.split(" ")[0] ?? auth.email?.split("@")[0] ?? "Account";
  const loginHref = path && path !== "/login" ? `/login?next=${encodeURIComponent(path)}` : "/login";
  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-center justify-between h-[72px] gap-4">
          {/* Logo */}
          <Link href="/portal" className="flex items-center gap-3 shrink-0" aria-label="Sango Information Hub news">
            <Image src="/images/logo-main.png" alt="Sango Information Hub" width={140} height={40} className="h-9 md:h-10 w-auto object-contain" priority />
            <span className="hidden md:block h-8 w-px bg-slate-200" />
            <span className="hidden md:block leading-tight">
              <span className="block text-[13px] font-bold text-slate-900">Sango Information Hub</span>
              <span className="block text-[11px] text-slate-500">News from the Lake Victoria Basin</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-1 text-[14px] font-semibold">
            {LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={
                  link.special
                    ? "ml-1 px-4 py-2 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                    : `relative px-3.5 py-2 rounded-full transition-colors ${isActive(link.href) ? "text-sky-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`
                }
              >
                {link.name}
                {!link.special && isActive(link.href) && <span className="absolute left-3.5 right-3.5 -bottom-[17px] h-[3px] rounded-full bg-sky-500" />}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {auth.signedIn ? (
              <Link href="/login" title={auth.email ?? undefined} className="hidden sm:inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border border-slate-200 hover:border-slate-400 text-slate-800 text-[13px] font-semibold transition-colors">
                <span className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-[12px] font-bold">{who.charAt(0).toUpperCase()}</span>
                <span className="max-w-[120px] truncate">{who}</span>
              </Link>
            ) : (
              <Link href={loginHref} className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-sky-600 transition-colors text-[13px] font-semibold">
                <LogIn size={15} /> Log in
              </Link>
            )}
            <button
              className="lg:hidden w-11 h-11 inline-flex items-center justify-center text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden border-t border-slate-200 bg-white shadow-xl"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-3.5 rounded-xl text-[16px] font-semibold border-b border-slate-100 last:border-0 ${isActive(link.href) ? "text-sky-700 bg-sky-50" : "text-slate-800"}`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href={auth.signedIn ? "/login" : loginHref}
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 inline-flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white font-semibold text-[15px] rounded-full"
              >
                {auth.signedIn ? <><UserRound size={16} /> {who}</> : <><LogIn size={16} /> Log in</>}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
