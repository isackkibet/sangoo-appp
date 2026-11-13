'use client';

import { Loader2 } from 'lucide-react';

export type UploadStatus = { label: string; ratio?: number };

/** Progress for video processing and uploads (determinate when a ratio is known). */
export default function UploadProgress({ status, onCancel }: { status: UploadStatus; onCancel?: () => void }) {
  const pct = typeof status.ratio === 'number' ? Math.max(0, Math.min(100, Math.round(status.ratio * 100))) : null;
  return (
    <div className="w-full" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-[13px] font-semibold text-slate-700">
        <span className="inline-flex items-center gap-2 min-w-0">
          <Loader2 size={15} className="animate-spin shrink-0 text-sky-600" />
          <span className="truncate">{status.label}</span>
        </span>
        {pct !== null && <span className="tabular-nums text-slate-500">{pct}%</span>}
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
        {pct !== null ? (
          <div className="h-full rounded-full bg-sky-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
        ) : (
          <div className="h-full w-1/3 rounded-full bg-sky-500/70 animate-pulse" />
        )}
      </div>
      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-3 text-[12.5px] font-semibold text-slate-500 hover:text-rose-600">
          Cancel
        </button>
      )}
    </div>
  );
}
