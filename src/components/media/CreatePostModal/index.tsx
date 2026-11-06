'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ImagePlus, Film, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { useCreatePostStore } from '@/store/media/modalStores';
import { useMediaFeedStore } from '@/store/media/feedStore';
import { useSihuAuth } from '@/components/auth/SihuAuth';
import { MEDIA_CATEGORIES } from '@/lib/media/categories';
import type { MediaPost } from '@/lib/media/mockData';

type Kind = 'image' | 'video';
type Preview = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  kind: Kind;
};

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

async function prepareImage(file: File): Promise<Preview> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1440;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process that photo.');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Your browser could not process that photo.'));
      },
      'image/jpeg',
      0.85,
    );
  });

  const uploadFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
  });

  return {
    file: uploadFile,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
    kind: 'image',
  };
}

function prepareVideo(file: File): Promise<Preview> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 720;
      const height = video.videoHeight || 1280;
      resolve({ file, previewUrl: objectUrl, width, height, kind: 'video' });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('That video format is not supported. Use MP4 or WebM.'));
    };

    video.src = objectUrl;
  });
}

async function prepareMedia(file: File): Promise<Preview> {
  if (file.type.startsWith('video/')) {
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error('That video is too large. Choose one under 50 MB.');
    }
    return prepareVideo(file);
  }

  if (file.type.startsWith('image/')) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('That photo is too large. Choose one under 20 MB.');
    }
    return prepareImage(file);
  }

  throw new Error('Choose a photo or video.');
}

export default function CreatePostModal() {
  const router = useRouter();
  const { isOpen, close } = useCreatePostStore();
  const { signedIn } = useSihuAuth();
  const prepend = useMediaFeedStore(s => s.prepend);
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<string>('community');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPreview(null);
    setCaption('');
    setCategory('community');
    setLocation('');
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) close();
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
      const signRes = await fetch('/api/media/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mime: preview.file.type, size: preview.file.size }),
      });
      const signed = (await signRes.json()) as {
        path?: string;
        signedUrl?: string;
        error?: string;
      };

      if (!signRes.ok || !signed.signedUrl || !signed.path) {
        throw new Error(signed.error || 'Could not prepare the upload.');
      }

      const form = new FormData();
      form.append('cacheControl', '31536000');
      form.append('', preview.file);
      const uploadRes = await fetch(signed.signedUrl, {
        method: 'PUT',
        headers: { 'x-upsert': 'false' },
        body: form,
      });

      if (!uploadRes.ok) {
        const detail = await uploadRes.text().catch(() => '');
        throw new Error(`Upload failed (${uploadRes.status}). ${detail}`.trim());
      }

      const res = await fetch('/api/media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          category,
          locationName: location,
          media: [
            {
              path: signed.path,
              mime: preview.file.type,
              kind: preview.kind,
              width: preview.width,
              height: preview.height,
              durationMs: null,
              altText: caption,
            },
          ],
        }),
      });
      const data = (await res.json()) as { post?: MediaPost; error?: string };

      if (!res.ok || !data.post) {
        throw new Error(data.error || 'Could not share your post.');
      }

      prepend(data.post);
      close();
      router.push('/media/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share your post.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-3 sm:p-6"
      onClick={() => { if (!busy) close(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-bold text-slate-900">
            {signedIn ? 'Create new post' : 'Sign in to share'}
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
              You need an account to upload photos, like and reshare posts.
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
                <div className="relative w-full max-h-[52vh] flex items-center justify-center">
                  {preview.kind === 'video' ? (
                    <video
                      src={preview.previewUrl}
                      controls
                      playsInline
                      className="max-h-[52vh] w-full object-contain"
                    />
                  ) : (
                    <Image
                      src={preview.previewUrl}
                      alt="Selected photo preview"
                      width={preview.width}
                      height={preview.height}
                      unoptimized
                      className="max-h-[52vh] w-auto object-contain"
                    />
                  )}
                </div>
                <button
                  onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ''; }}
                  disabled={busy}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[12px] font-semibold disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 text-sky-500">
                  <ImagePlus size={38} />
                  <Film size={38} />
                </div>
                <span className="text-[15px] font-semibold text-slate-800">Choose a photo or video</span>
                <span className="text-[12.5px] text-slate-500">JPEG, PNG, WebP, MP4 or WebM</span>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  className="hidden"
                  onChange={e => void pickFile(e.target.files?.[0])}
                />
              </label>
            )}

            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={3}
              maxLength={2200}
              placeholder="Write a caption..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-[14.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 resize-y"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Category</span>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-[14px] text-slate-900 capitalize focus:outline-none focus:border-sky-500"
                >
                  {MEDIA_CATEGORIES.map(c => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Location (optional)</span>
                <span className="relative block">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Kisumu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </span>
              </label>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px] leading-relaxed">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </p>
            )}

            <button
              onClick={() => void share()}
              disabled={!preview || busy}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[15px] font-semibold transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {busy ? 'Sharing...' : 'Share post'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
