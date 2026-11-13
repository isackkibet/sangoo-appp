import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import type { ComponentType } from "react";

type IconType = ComponentType<{ size?: number; className?: string }>;

type Action = { href: string; label: string; external?: boolean };

/**
 * An honest page for a DApp feature that is not live yet. It explains what is
 * planned and links to what works today, instead of showing invented figures
 * and buttons that do nothing.
 */
export default function PhasePreview({
  Icon, title, intro, planned, actions,
}: { Icon: IconType; title: string; intro: string; planned: string[]; actions: Action[] }) {
  return (
    <main className="relative overflow-hidden pb-24 text-white">
      <div className="pointer-events-none absolute -top-40 right-[-10%] w-[560px] h-[560px] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="relative container mx-auto max-w-4xl px-4 lg:px-8 pt-10 md:pt-14">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-200 text-[12.5px] font-semibold">
          <Clock size={13} /> Coming in Phase 2
        </span>
        <div className="flex items-start gap-4 mt-5">
          <span className="w-14 h-14 shrink-0 rounded-2xl bg-sky-400/10 text-sky-300 flex items-center justify-center"><Icon size={26} /></span>
          <div>
            <h1 className="font-heading text-[32px] md:text-[42px] font-bold leading-tight">{title}</h1>
            <p className="text-slate-300 text-[16px] md:text-[17px] mt-3 leading-relaxed max-w-2xl">{intro}</p>
          </div>
        </div>

        <section className="mt-10 rounded-3xl bg-slate-900 border border-white/10 p-6 md:p-8">
          <h2 className="font-bold text-[18px]">What is planned</h2>
          <ul className="mt-4 space-y-3">
            {planned.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] text-slate-300 leading-relaxed">
                <CheckCircle2 size={18} className="text-sky-400 shrink-0 mt-0.5" /> {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13.5px] text-slate-500">
            No figures are shown until this feature is live on the network. Follow progress on the{" "}
            <a href="https://t.me/SihuHubBot" target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">SIHU Telegram</a>.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          {actions.map((a, i) => {
            const cls = i === 0
              ? "inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors"
              : "inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-colors";
            return a.external ? (
              <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer" className={cls}>{a.label} <ExternalLink size={15} /></a>
            ) : (
              <Link key={a.href} href={a.href} className={cls}>{a.label} <ArrowRight size={15} /></Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
