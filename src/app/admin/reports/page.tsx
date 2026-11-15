"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Flag,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  adminFetch,
  formatAdminDateTime,
} from "@/lib/admin/client";

type Status = "open" | "reviewing" | "resolved" | "dismissed";

type Report = {
  id: string;
  target_type: "post" | "comment" | "user" | "story";
  target_id: string;
  reason: string;
  details: string | null;
  status: Status;
  created_at: string;
  reporter: { id: string; username: string; avatar_url: string } | null;
  target_preview: string | null;
};

const FILTERS: { id: string; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "reviewing", label: "Reviewing" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
  { id: "", label: "All" },
];

const STATUS_STYLES: Record<Status, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  reviewing: "bg-sky-50 text-sky-700 border-sky-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  dismissed: "bg-slate-100 text-slate-500 border-slate-200",
};

const TARGET_ENDPOINTS: Record<Report["target_type"], string> = {
  post: "posts",
  comment: "comments",
  story: "stories",
  user: "",
};

export default function AdminReportsPage() {
  const [status, setStatus] = useState("open");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (filter = status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ reports: Report[] }>(
        `/api/admin/reports?status=${encodeURIComponent(filter)}`,
      );
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  const update = async (id: string, next: Status) => {
    setBusyId(id);
    setError(null);
    try {
      await adminFetch("/api/admin/reports", {
        method: "PATCH",
        body: JSON.stringify({ id, status: next }),
      });
      await load(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the report.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteTarget = async (report: Report) => {
    const endpoint = TARGET_ENDPOINTS[report.target_type];
    if (!endpoint) {
      setError("Open the Users page to suspend or verify this account.");
      return;
    }
    if (!window.confirm(`Delete the reported ${report.target_type}?`)) return;
    setBusyId(report.id);
    setError(null);
    try {
      await adminFetch(`/api/admin/${endpoint}/${report.target_id}`, { method: "DELETE" });
      await adminFetch("/api/admin/reports", {
        method: "PATCH",
        body: JSON.stringify({ id: report.id, status: "resolved" }),
      });
      await load(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the reported content.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Reports filed by members. Resolve, dismiss, or remove the reported content.
        </p>
        <button
          onClick={() => void load(status)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id || "all"}
            onClick={() => setStatus(filter.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              status === filter.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:border-slate-900"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {reports.length === 0 && !loading && (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
          No reports in this view.
        </p>
      )}

      <div className="space-y-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[report.status]}`}>
                <Flag size={12} /> {report.status}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                {report.target_type}
              </span>
              <span className="text-xs text-slate-500">
                {report.reporter?.username ? `@${report.reporter.username}` : "Anonymous"} ·{" "}
                {formatAdminDateTime(report.created_at)}
              </span>
            </div>

            <h3 className="mt-3 font-heading text-lg font-bold text-slate-900">
              {report.reason}
            </h3>
            {report.details && (
              <p className="mt-1 text-sm text-slate-600">{report.details}</p>
            )}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {report.target_preview || "The reported content has no preview."}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {report.status !== "reviewing" && (
                <button
                  onClick={() => void update(report.id, "reviewing")}
                  disabled={busyId === report.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                >
                  <Eye size={15} /> Reviewing
                </button>
              )}
              {report.status !== "resolved" && (
                <button
                  onClick={() => void update(report.id, "resolved")}
                  disabled={busyId === report.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  <CheckCircle2 size={15} /> Resolve
                </button>
              )}
              {report.status !== "dismissed" && (
                <button
                  onClick={() => void update(report.id, "dismissed")}
                  disabled={busyId === report.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <XCircle size={15} /> Dismiss
                </button>
              )}
              {report.target_type !== "user" && (
                <button
                  onClick={() => void deleteTarget(report)}
                  disabled={busyId === report.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  <Trash2 size={15} /> Delete {report.target_type}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
