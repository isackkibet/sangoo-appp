'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Image as ImageIcon, Tag, Send,
  CheckCircle2, AlertCircle, User, Loader2, X, Plus,
} from 'lucide-react';

// ─── Types (mirrors backend shape — swap for real service when DB is ready) ───

type Category =
  | 'Environment'
  | 'Community'
  | 'News'
  | 'Governance'
  | 'Conservation'
  | 'Agriculture'
  | 'Technology'
  | 'General';

interface ArticleForm {
  title: string;
  author: string;
  email: string;
  category: Category;
  summary: string;
  content: string;
  coverImageUrl: string;
  tags: string[];
}

const CATEGORIES: Category[] = [
  'Environment', 'Community', 'News', 'Governance',
  'Conservation', 'Agriculture', 'Technology', 'General',
];

const EMPTY: ArticleForm = {
  title: '',
  author: '',
  email: '',
  category: 'Environment',
  summary: '',
  content: '',
  coverImageUrl: '',
  tags: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-slate-400">{hint}</p>}
    </div>
  );
}

const INPUT =
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all';

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubmitArticlePage() {
  const [form, setForm] = useState<ArticleForm>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const set = (field: keyof ArticleForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || form.tags.includes(t) || form.tags.length >= 8) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, t] }));
    setTagInput('');
  };

  const removeTag = (t: string) =>
    setForm(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) }));

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.author.trim()) return 'Author name is required.';
    if (!form.email.trim() || !form.email.includes('@')) return 'A valid email is required.';
    if (!form.summary.trim()) return 'Summary is required.';
    if (form.content.trim().length < 100) return 'Article body must be at least 100 characters.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); setStatus('error'); return; }

    setStatus('submitting');
    setErrorMsg('');

    try {
      // ── BACKEND INTEGRATION POINT ────────────────────────────────────────
      // Replace this block with your real API call, e.g.:
      //   await fetch('/api/articles', { method: 'POST', body: JSON.stringify(form) })
      // Or wire to publishingService.submitArticle(form)
      // ─────────────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1200)); // simulate network
      console.log('[ArticleSubmit] payload ready for backend:', form);
      setStatus('success');
    } catch {
      setErrorMsg('Submission failed. Please try again.');
      setStatus('error');
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="font-heading text-[28px] font-bold text-slate-900 mb-3">Article submitted!</h1>
          <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
            Thank you, <strong>{form.author}</strong>. Your article has been received and will be reviewed by the SIHU editorial team before publication.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setForm(EMPTY); setStatus('idle'); }}
              className="px-6 py-3 rounded-full border border-slate-300 hover:border-slate-900 text-[14px] font-semibold transition-colors"
            >
              Submit another
            </button>
            <Link
              href="/portal"
              className="px-6 py-3 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[14px] font-semibold transition-colors"
            >
              Back to portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Image src="/images/logo-main.png" alt="SIHU" width={80} height={24} className="h-7 w-auto object-contain" />
              <span className="text-[13px] font-semibold text-slate-500 hidden sm:block">/ Submit article</span>
            </div>
          </div>
          <span className="text-[12px] text-slate-400 hidden md:block">All fields marked * are required</span>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 lg:px-8 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-heading text-[34px] md:text-[44px] font-bold text-slate-900 leading-tight">
            Submit a story
          </h1>
          <p className="text-[17px] text-slate-500 mt-3 max-w-2xl leading-relaxed">
            Share reporting, field notes, events or research from the Lake Victoria Basin. Submissions are reviewed by the SIHU editorial team before publication.
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">

          {/* ── Section: Author ─────────────────────────────────────────── */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <User size={18} />
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">Your details</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Full name" required>
                <input
                  value={form.author}
                  onChange={e => set('author', e.target.value)}
                  placeholder="e.g. Jane Mwangi"
                  className={INPUT}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email address" required hint="For editorial correspondence only — not published">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT}
                  autoComplete="email"
                />
              </Field>
            </div>
          </section>

          {/* ── Section: Article metadata ───────────────────────────────── */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileText size={18} />
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">Article details</h2>
            </div>

            <Field label="Headline / Title" required hint="Keep it clear and specific — 10 to 80 characters works best">
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Water hyacinth removal revives fish populations in Winam Gulf"
                className={INPUT}
                maxLength={120}
              />
            </Field>

            <Field label="Category" required>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value as Category)}
                className={INPUT}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Summary" required hint="2–3 sentences shown in article previews and search results">
              <textarea
                value={form.summary}
                onChange={e => set('summary', e.target.value)}
                rows={3}
                placeholder="Briefly describe the story and why it matters to the Lake Victoria community…"
                className={INPUT + ' resize-none'}
                maxLength={300}
              />
              <span className="text-[11px] text-slate-400 self-end">{form.summary.length}/300</span>
            </Field>
          </section>

          {/* ── Section: Article body ───────────────────────────────────── */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FileText size={18} />
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">Article body</h2>
            </div>

            <Field
              label="Full article text"
              required
              hint="Plain text or basic Markdown. Minimum 100 characters. When the backend is connected this field will support rich text editing."
            >
              <textarea
                value={form.content}
                onChange={e => set('content', e.target.value)}
                rows={14}
                placeholder="Write your full article here…&#10;&#10;Introduce the topic, provide context, and include quotes or data where relevant."
                className={INPUT + ' resize-y font-mono text-[14px] leading-relaxed'}
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{form.content.trim().length} characters</span>
                <span className={form.content.trim().length < 100 ? 'text-red-400' : 'text-emerald-500'}>
                  {form.content.trim().length < 100 ? `${100 - form.content.trim().length} more needed` : '✓ Minimum met'}
                </span>
              </div>
            </Field>
          </section>

          {/* ── Section: Media + Tags ───────────────────────────────────── */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ImageIcon size={18} />
              </span>
              <h2 className="text-[17px] font-bold text-slate-900">Media &amp; tags</h2>
            </div>

            <Field
              label="Cover image URL"
              hint="Paste a public image URL (Unsplash, Wikimedia, your own hosted image). Direct file upload will be available once storage is connected."
            >
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={e => set('coverImageUrl', e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className={INPUT}
              />
              {form.coverImageUrl && (
                <div className="relative aspect-[16/7] rounded-xl overflow-hidden mt-2 bg-slate-100">
                  <Image
                    src={form.coverImageUrl}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </Field>

            <Field label="Tags" hint="Up to 8 tags. Press Enter or click + to add.">
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="e.g. Lake Victoria"
                  className={INPUT + ' flex-1'}
                  maxLength={32}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors font-semibold text-[13px] flex items-center gap-1"
                >
                  <Plus size={15} /> Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[13px] font-medium">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </section>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {status === 'error' && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[14px]">
              <AlertCircle size={18} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* ── Editorial note ──────────────────────────────────────────── */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-100 text-slate-600 text-[13px] leading-relaxed">
            <Tag size={16} className="shrink-0 mt-0.5 text-slate-400" />
            <p>
              By submitting you agree that SIHU may publish, edit for clarity, and translate your article for the Lake Victoria Basin community. Your contact details are never published.
            </p>
          </div>

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[15px] font-semibold transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {status === 'submitting' ? (
                <><Loader2 size={17} className="animate-spin" /> Submitting…</>
              ) : (
                <><Send size={17} /> Submit for review</>
              )}
            </button>
            <Link
              href="/portal"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-slate-300 hover:border-slate-900 text-[15px] font-semibold transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
