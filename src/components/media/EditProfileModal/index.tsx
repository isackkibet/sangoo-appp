'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Lock } from 'lucide-react';
import type { MediaUser } from '@/lib/media/types';

type Props = {
  user: MediaUser;
  onClose: () => void;
  onSaved: (user: MediaUser) => void;
};

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15';

/** Edit your name, username, bio, location, website and privacy. Saved to the SIHU database. */
export default function EditProfileModal({ user, onClose, onSaved }: Props) {
  const [name, setName] = useState(user.full_name ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [location, setLocation] = useState(user.location ?? '');
  const [website, setWebsite] = useState(user.website ?? '');
  const [isPrivate, setIsPrivate] = useState(Boolean(user.is_private));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  // Same rule as the server: lowercase letters, numbers, dots and underscores.
  const cleanUsername = (v: string) => v.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '').slice(0, 30);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) { setError('Your name must be at least 2 characters.'); return; }
    if (!/^[a-z0-9._]{3,30}$/.test(username) || username.startsWith('.') || username.endsWith('.')) {
      setError('Usernames must be 3–30 characters using letters, numbers, dots or underscores.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/media/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), username, bio, location, website: website.trim(), isPrivate }),
      });
      const data = (await res.json()) as { user?: MediaUser; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error || 'Could not save your profile.');
      onSaved(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && onClose()}>
      <form
        onSubmit={save}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 id="edit-profile-title" className="text-[17px] font-bold text-slate-900">Edit profile</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100 text-slate-600 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <label className="block">
            <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">Name</span>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={120} autoComplete="name" placeholder="e.g. Isack Kibet" className={INPUT} required />
            <span className="block text-[12px] text-slate-500 mt-1">Shown on your posts and profile.</span>
          </label>

          <label className="block">
            <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">Username</span>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">@</span>
              <input value={username} onChange={e => setUsername(cleanUsername(e.target.value))} placeholder="isack.kibet" className={`${INPUT} pl-8`} required />
            </div>
            <span className="block text-[12px] text-slate-500 mt-1">Letters, numbers, dots and underscores. Must be unique.</span>
          </label>

          <label className="block">
            <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">Bio</span>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 160))} rows={3} placeholder="Tell people about yourself" className={`${INPUT} resize-none`} />
            <span className="block text-right text-[11.5px] text-slate-400 mt-0.5">{bio.length}/160</span>
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">Location</span>
              <input value={location} onChange={e => setLocation(e.target.value)} maxLength={80} placeholder="e.g. Busia" className={INPUT} />
            </label>
            <label className="block">
              <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">Website</span>
              <input value={website} onChange={e => setWebsite(e.target.value)} type="url" placeholder="https://" className={INPUT} />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer">
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="mt-0.5 w-4 h-4 accent-sky-600" />
            <span>
              <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900"><Lock size={14} /> Private account</span>
              <span className="block text-[12.5px] text-slate-500 mt-0.5">Only people you approve can see your posts.</span>
            </span>
          </label>

          {error && <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2" role="alert">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-white flex gap-3 px-5 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[14px] font-semibold disabled:opacity-60">
            {saving && <Loader2 size={16} className="animate-spin" />} {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
