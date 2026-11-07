'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { X, ImagePlus, Film, Loader2, AlertCircle } from 'lucide-react';
import { useCreateStoryStore } from '@/store/media/modalStores';
import { useStoryStore } from '@/store/media/storyStore';
import { useSihuAuth } from '@/components/auth/SihuAuth';
import {
  prepareMedia,
  SERVER_UPLOAD_MAX_BYTES,
  type PreparedMedia,
} from '@/lib/media/prepareUpload';

export default function CreateStoryModal() {
  const { isOpen, close } = useCreateStoryStore();
  const { signedIn } = useSihuAuth();
  const loadStories = useStoryStore(s => s.load);
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<PreparedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPreview(null);
    setCaption('');
    setBusy(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (preview?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, busy, close]);

  if (!isOpen) return null;

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      setPreview(await prepareMedia(file));
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  };

  const share = async () => {
    if (!preview || busy) return;
    setBusy(true);
    setError(null);

    try {
      let res: Response;
      if (preview.file.size <= SERVER_UPLOAD_MAX_BYTES) {
        const form = new FormData();
        form.append('media', preview.file);
        form.append('width', String(preview.width));
        form.append('height', String(preview.height));
        form.append('duration', String(preview.durationMs ?? ''));
        form.append('caption', caption);
        res = await fetch('/api/media/stories', {
          method: 'POST',
          body: form,
        });
      } else {
        const signRes = await fetch('/api/media/uploads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mime: preview.file.type,
            size: preview.file.size,
            folder: 'stories',
          }),
        });
        const signed = (await signRes.json()) as {
          path?: string;
          signedUrl?: string;
          error?: string;
        };

        if (!signRes.ok || !signed.signedUrl || !signed.path) {
          throw new Error(signed.error || 'Could not prepare the upload.');
        }

        let uploadRes: Response;
        try {
          const form = new FormData();
          form.append('cacheControl', '31536000');
          form.append('', preview.file);
          uploadRes = await fetch(signed.signedUrl, {
            method: 'PUT',
            headers: { 'x-upsert': 'false' },
            body: form,
          });
        } catch {
          throw new Error(
            'Could not reach Supabase Storage. Check Storage CORS settings for your site, or choose a file under 4 MB.',
          );
        }

        if (!uploadRes.ok) {
          const detail = await uploadRes.text().catch(() => '');
          throw new Error(`Upload failed (${uploadRes.status}). ${detail}`.trim());
        }

        res = await fetch('/api/media/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caption,
            media: {
              path: signed.path,
              mime: preview.file.type,
              kind: preview.kind,
              width: preview.width,
              height: preview.height,
              durationMs: preview.durationMs,
            },
          }),
        });
      }
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || 'Could not share your story.');
      }

      await loadStories(true);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share your story.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-3 sm:p-6"
      onClick={() => {
        if (!busy) close();
      }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-bold text-slate-900">
            {signedIn ? 'Add to your story' : 'Sign in to share a story'}
          </h2>
          <button
            onClick={close}
            disabled={busy}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {!signedIn ? (
          <div className="p-8 text-center">
            <p className="text-[15px] text-slate-600 leading-relaxed">
              You need an account to share stories with the community.
            </p>
            <Link
              href="/login?next=/media/feed"
              className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[14px] font-semibold transition-colors"
            >
              Sign in or create an account
            </Link>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {preview ? (
              <div className="relative w-full overflow-hidden rounded-xl bg-slate-900">
                <div className="relative w-full max-h-[56vh] flex items-center justify-center">
                  {preview.kind === 'video' ? (
                    <video
                      src={preview.previewUrl}
                      controls
                      playsInline
                      className="max-h-[56vh] w-full object-contain"
                    />
                  ) : (
                    <Image
                      src={preview.previewUrl}
                      alt="Selected story preview"
                      width={preview.width}
                      height={preview.height}
                      unoptimized
                      className="max-h-[56vh] w-auto object-contain"
                    />
                  )}
                </div>
                <button
                  onClick={() => {
                    setPreview(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  disabled={busy}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[12px] font-semibold disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 w-full aspect-[4/5] rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 text-sky-500">
                  <ImagePlus size={38} />
                  <Film size={38} />
                </div>
                <span className="text-[15px] font-semibold text-slate-800">
                  Choose a photo or video
                </span>
                <span className="text-[12.5px] text-slate-500">
                  Disappears after 24 hours
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  className="hidden"
                  onChange={event => void pickFile(event.target.files?.[0])}
                />
              </label>
            )}

            <textarea
              value={caption}
              onChange={event => setCaption(event.target.value)}
              rows={2}
              maxLength={2200}
              placeholder="Add a caption to your story..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-[14.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-y"
            />

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px] leading-relaxed"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </p>
            )}

            <button
              onClick={() => void share()}
              disabled={!preview || busy}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[15px] font-semibold transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {busy ? 'Sharing...' : 'Share story'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
