'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Headphones, Loader2, CheckCircle2, AlertCircle,
  User, Link as LinkIcon, Clock, Tag, X, Plus,
} from 'lucide-react';

const CATEGORIES = ['Environment', 'Community', 'News', 'Governance', 'Agriculture', 'Technology', 'General'] as const;
type Category = typeof CATEGORIES[number];

interface PodcastForm {
  title: string;
  host: string;
  email: string;
  episode: string;
  duration: string;
  category: Category;
  description: string;
  audioUrl: string;
  coverImageUrl: string;
  tags: string[];
}

const EMPTY: PodcastForm = {
  title: '', host: '', email: '', episode: '', duration: '',
  category: 'Environment', description: '', audioUrl: '', coverImageUrl: '', tags: [],
};

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-semibold text-slate-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-slate-400">{hint}</p>}
    </div>
  );
}

export default function SubmitPodcastPage() {
  const [form, setForm] = useState<PodcastForm>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (field: keyof PodcastForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || form.tags.includes(t) || form.tags.length >= 6) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, t] }));
    setTagInput('');
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Podcast title is required.';
    if (!form.host.trim()) return 'Host name is required.';
    if (!form.email.trim() || !form.email.includes('@')) return 'A valid email is required.';
    if (!form.description.trim()) return 'Description is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); setStatus('error'); return; }
    setStatus('submitting');
    setErrorMsg('');
    try {
      // ── BACKEND INTEGRATION POINT ────────────────────────────────
      // Replace with: await fetch('/api/podcasts', { method: 'POST', body: JSON.stringify(form) })
      await new Promise(r => setTimeout(r, 1200));
      console.log('[PodcastSubmit] payload ready for backend:', form);
      setStatus('success');
    } catch {
      setErrorMsg('Submission failed. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="font-heading text-[28px] font-bold text-slate-900 mb-3">Podcast submitted!</h1>
          <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
            Thank you, <strong>{form.host}</strong>. Your podcast has been received and will be reviewed before publication.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => { setForm(EMPTY); setStatus('idle'); }}
              className="px-6 py-3 rounded-full border border-slate-300 hover:border-slate-900 text-[14px] font-semibold transition-colors">
              Submit another
            </button>
            <Link href="/portal" className="px-6 py-3 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[14px] font-semibold transition-colors">
              Back to portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Image src="/images/logo-main.png" alt="SIHU" width={80} height={24} className="h-7 w-auto object-contain" />
              <span className="text-[13px] font-semibold text-slate-500 hidden sm:block">/ Submit podcast</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Headphones size={24} />
          </div>
          <div>
            <h1 className="font-heading text-[30px] md:text-[38px] font-bold text-slate-900">Submit a podcast</h1>
            <p className="text-slate-500 text-[15px] mt-0.5">Share audio content from the Lake Victoria Basin community.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Podcast details */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <Headphones size={18} className="text-sky-600" />
              <h2 className="text-[17px] font-bold text-slate-900">Podcast details</h2>
            </div>
            <Field label="Podcast title" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Lake Victoria Weekly — Episode 5" className={INPUT} maxLength={120} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Episode number / series" hint="e.g. Episode 12 or Season 2, Ep 3">
                <input value={form.episode} onChange={e => set('episode', e.target.value)} placeholder="Episode 1" className={INPUT} />
              </Field>
              <Field label="Duration" hint="e.g. 32 min">
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="45 min" className={INPUT + ' pl-9'} />
                </div>
              </Field>
            </div>
            <Field label="Category" required>
              <select value={form.category} onChange={e => set('category', e.target.value as Category)} className={INPUT}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Description" required hint="2–4 sentences shown in podcast previews">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                placeholder="What is this episode about? Who is featured?" className={INPUT + ' resize-none'} maxLength={400} />
              <span className="text-[11px] text-slate-400 self-end">{form.description.length}/400</span>
            </Field>
          </section>

          {/* Host details */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <User size={18} className="text-sky-600" />
              <h2 className="text-[17px] font-bold text-slate-900">Host details</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Host / producer name" required>
                <input value={form.host} onChange={e => set('host', e.target.value)} placeholder="Your name" className={INPUT} autoComplete="name" />
              </Field>
              <Field label="Email" required hint="For editorial correspondence only">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className={INPUT} />
              </Field>
            </div>
          </section>

          {/* Media */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <LinkIcon size={18} className="text-sky-600" />
              <h2 className="text-[17px] font-bold text-slate-900">Audio &amp; cover</h2>
            </div>
            <Field label="Audio URL" hint="Paste a link to your audio file or podcast platform (Spotify, SoundCloud, Anchor, etc.)">
              <input type="url" value={form.audioUrl} onChange={e => set('audioUrl', e.target.value)} placeholder="https://open.spotify.com/episode/..." className={INPUT} />
            </Field>
            <Field label="Cover image URL" hint="Square image recommended. Direct file upload available once storage is connected.">
              <input type="url" value={form.coverImageUrl} onChange={e => set('coverImageUrl', e.target.value)} placeholder="https://..." className={INPUT} />
              {form.coverImageUrl && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden mt-2 bg-slate-100 shrink-0">
                  <Image src={form.coverImageUrl} alt="Cover preview" fill className="object-cover"
                    onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </Field>
            <Field label="Tags" hint="Up to 6 tags. Press Enter or + to add.">
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="e.g. environment" className={INPUT + ' flex-1'} maxLength={32} />
                <button type="button" onClick={addTag} className="px-4 py-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[13px] flex items-center gap-1 transition-colors">
                  <Plus size={15} /> Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[13px] font-medium">
                      #{t}
                      <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </section>

          {status === 'error' && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[14px]">
              <AlertCircle size={18} className="shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-100 text-slate-600 text-[13px] leading-relaxed">
            <Tag size={16} className="shrink-0 mt-0.5 text-slate-400" />
            <p>By submitting you agree that SIHU may publish and promote your podcast. Your contact details are never published.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={status === 'submitting'}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[15px] font-semibold transition-colors disabled:opacity-60 disabled:pointer-events-none">
              {status === 'submitting' ? <><Loader2 size={17} className="animate-spin" /> Submitting…</> : <><Headphones size={17} /> Submit podcast</>}
            </button>
            <Link href="/portal" className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-4 rounded-full border border-slate-300 hover:border-slate-900 text-[15px] font-semibold transition-colors text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
