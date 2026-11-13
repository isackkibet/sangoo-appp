"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu, X, LogIn, UserRound, ArrowUpRight, ChevronDown,
  Home, Newspaper, Users, Map as MapIcon, Bot, Wallet, Gamepad2, ScanSearch, Info, PenLine, Mail,
} from "lucide-react";
import { useSihuAuth } from "@/components/auth/SihuAuth";
import SihuLogo from "@/components/brand/SihuLogo";

type NavLink = { name: string; href: string; hint: string; Icon: typeof Home };

/* Everything SIHU offers, in two groups so nothing is hidden behind guesswork.
 * The bar keeps its 72px height: other layouts offset against it. */
const PRIMARY: NavLink[] = [
  { name: "Home", href: "/", hint: "Welcome to SIHU", Icon: Home },
  { name: "News", href: "/portal", hint: "Stories, podcasts and events", Icon: Newspaper },
  { name: "Community", href: "/media/feed", hint: "Reports, photos and videos from members", Icon: Users },
  { name: "Basin Map", href: "/map", hint: "Counties, rivers and places we cover", Icon: MapIcon },
  { name: "AI Assistant", href: "/ai", hint: "Ask SIHU AI about the lake", Icon: Bot },
];
const MORE: NavLink[] = [
  { name: "About SIHU", href: "/#story", hint: "Who we are and what we stand for", Icon: Info },
  { name: "Submit a story", href: "/portal/submit", hint: "Send an article, podcast or event", Icon: PenLine },
  { name: "Verify", href: "/verify", hint: "Help check field photos", Icon: ScanSearch },
  { name: "DApp", href: "/dapp", hint: "SIHU wallet, mining and vaults", Icon: Wallet },
  { name: "Play", href: "/play", hint: "Predictions and AI chess", Icon: Gamepad2 },
  { name: "Contact", href: "/#contact", hint: "Reach the SIHU team", Icon: Mail },
];

export default function NewsHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const moreRef = React.useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const path = usePathname() ?? "";
  const auth = useSihuAuth();
  const who = auth.name?.split(" ")[0] ?? auth.email?.split("@")[0] ?? "Account";
  const loginHref = path && path !== "/login" ? `/login?next=${encodeURIComponent(path)}` : "/login";
  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/") return path === "/";
    const section = href === "/media/feed" ? "/media" : href;
    return path === section || path.startsWith(`${section}/`);
  };
  const moreActive = MORE.some((l) => isActive(l.href));

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus after navigating.
  React.useEffect(() => { setMobileMenuOpen(false); setMoreOpen(false); }, [path]);

  // "More" dropdown: closes on Escape or a click outside.
  React.useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => { if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [moreOpen]);

  // While the mobile menu is open: Escape closes it and the page behind doesn't scroll.
  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileMenuOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };
  const closeAll = () => { setMobileMenuOpen(false); setMoreOpen(false); };

  return (
    <nav
      aria-label="Main"
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 border-b ${
        mobileMenuOpen
          ? "bg-white border-slate-200/80"
          : scrolled
          ? "bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]"
          : "bg-white/95 backdrop-blur-md border-slate-200/60"
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-center justify-between h-[72px] gap-3">
          {/* Logo — the official SIHU wordmark */}
          <Link
            href="/"
            className="group flex items-center shrink-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            aria-label="Sango Information Hub (SIHU) — home"
          >
            <span className="transition-transform duration-300 group-hover:scale-[1.02]">
              <SihuLogo variant="full" alt="" priority className="h-11 sm:h-12 lg:h-[46px] xl:h-14" />
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-0.5 p-1 rounded-full bg-slate-100/80 ring-1 ring-slate-200/70 text-[14px] font-semibold">
            {PRIMARY.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  title={link.hint}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3 xl:px-4 py-2 rounded-full whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    active ? "text-sky-700" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sihu-nav-active"
                      transition={spring}
                      className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)]"
                    />
                  )}
                  <span className="relative">{link.name}</span>
                </Link>
              );
            })}

            {/* More */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-controls="sihu-more-menu"
                className={`relative inline-flex items-center gap-1 px-3 xl:px-4 py-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  moreActive || moreOpen ? "text-sky-700" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {moreActive && (
                  <motion.span layoutId="sihu-nav-active" transition={spring}
                    className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)]" />
                )}
                <span className="relative">More</span>
                <ChevronDown size={15} className={`relative transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    id="sihu-more-menu"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-[calc(100%+14px)] w-[520px] origin-top-right rounded-3xl bg-white p-2.5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 grid grid-cols-2 gap-1"
                  >
                    {MORE.map((l) => (
                      <Link key={l.name} href={l.href} onClick={closeAll} aria-current={isActive(l.href) ? "page" : undefined}
                        className={`group flex items-start gap-3 rounded-2xl p-3 transition-colors ${isActive(l.href) ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                        <span className="w-9 h-9 shrink-0 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors"><l.Icon size={17} /></span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold text-slate-900">{l.name}</span>
                          <span className="block text-[12.5px] font-normal text-slate-500 leading-snug mt-0.5">{l.hint}</span>
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {auth.signedIn ? (
              <Link
                href="/login"
                title={auth.email ?? undefined}
                className="hidden sm:inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm text-slate-800 text-[13px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center text-[12px] font-bold">
                  {who.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{who}</span>
              </Link>
            ) : (
              <Link
                href={loginHref}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-600/25 active:scale-[0.98] transition-all text-[13px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                <LogIn size={15} /> Log in
              </Link>
            )}
            <button
              type="button"
              className="lg:hidden w-11 h-11 inline-flex items-center justify-center text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="sihu-mobile-menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenuOpen ? "close" : "open"}
                  initial={reduceMotion ? false : { rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={reduceMotion ? undefined : { rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile and tablet menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute inset-x-0 top-[72px] h-[100dvh] bg-slate-950/40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            <motion.div
              key="panel"
              id="sihu-mobile-menu"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden relative border-t border-slate-200 bg-white shadow-2xl max-h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain"
            >
              <div className="container mx-auto max-w-2xl px-4 py-4">
                {[{ title: "Explore", links: PRIMARY }, { title: "More from SIHU", links: MORE }].map((group) => (
                  <div key={group.title} className="mb-3">
                    <p className="px-3 pt-1 pb-2 text-[11.5px] font-bold uppercase tracking-[0.12em] text-slate-400">{group.title}</p>
                    <motion.ul
                      initial="hidden"
                      animate="show"
                      variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.03 } } }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-1"
                    >
                      {group.links.map((link) => {
                        const active = isActive(link.href);
                        return (
                          <motion.li key={link.name} variants={{ hidden: { opacity: 0, y: reduceMotion ? 0 : 6 }, show: { opacity: 1, y: 0 } }}>
                            <Link
                              href={link.href}
                              onClick={closeAll}
                              aria-current={active ? "page" : undefined}
                              className={`group flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors ${active ? "bg-sky-50 ring-1 ring-sky-100" : "hover:bg-slate-50"}`}
                            >
                              <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${active ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700"}`}><link.Icon size={18} /></span>
                              <span className="min-w-0 flex-1">
                                <span className={`block text-[15.5px] font-semibold ${active ? "text-sky-700" : "text-slate-900"}`}>{link.name}</span>
                                <span className="block text-[12.5px] text-slate-500 truncate">{link.hint}</span>
                              </span>
                              <ArrowUpRight size={16} className={`shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${active ? "text-sky-600" : "text-slate-300"}`} />
                            </Link>
                          </motion.li>
                        );
                      })}
                    </motion.ul>
                  </div>
                ))}
                <Link
                  href={auth.signedIn ? "/login" : loginHref}
                  onClick={closeAll}
                  className="mt-2 inline-flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 hover:bg-sky-600 transition-colors text-white font-semibold text-[15px] rounded-full"
                >
                  {auth.signedIn ? <><UserRound size={16} /> {who}</> : <><LogIn size={16} /> Log in</>}
                </Link>
                <p className="mt-4 mb-1 flex items-center justify-center gap-2 text-[12px] text-slate-400">
                  <SihuLogo variant="mark" alt="" className="h-5" /> We care about Lake Victoria
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
