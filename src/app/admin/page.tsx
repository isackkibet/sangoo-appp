"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Flag,
  MessageSquare,
  Newspaper,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import {
  adminFetch,
  formatAdminDateTime,
} from "@/lib/admin/client";

type Stats = {
  users: number;
  posts: number;
  comments: number;
  stories: number;
  messages: number;
  open_reports: number;
  suspended_users: number;
};

type Report = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  target_preview: string | null;
  reporter: { username: string } | null;
};

type Post = {
  id: string;
  caption: string;
  created_at: string;
  image_url: string | null;
  image_kind: string | null;
  author: { username: string; full_name: string; avatar_url: string };
};

type Overview = { stats: Stats; reports: Report[]; posts: Post[] };

const EMPTY: Overview = {
  stats: {
    users: 0,
    posts: 0,
    comments: 0,
    stories: 0,
    messages: 0,
    open_reports: 0,
    suspended_users: 0,
  },
  reports: [],
  posts: [],
};

let overviewCache: Overview | null = null;

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview>(overviewCache ?? EMPTY);
  const [loading, setLoading] = useState(!overviewCache);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await adminFetch<Overview>("/api/admin/overview");
      overviewCache = next;
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = [
    { label: "Members", value: data.stats.users, icon: Users, tone: "bg-sky-50 text-sky-700" },
    { label: "Posts", value: data.stats.posts, icon: Newspaper, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Comments", value: data.stats.comments, icon: MessageSquare, tone: "bg-indigo-50 text-indigo-700" },
    { label: "Active stories", value: data.stats.stories, icon: Video, tone: "bg-violet-50 text-violet-700" },
    { label: "Open reports", value: data.stats.open_reports, icon: Flag, tone: "bg-amber-50 text-amber-700" },
    { label: "Suspended", value: data.stats.suspended_users, icon: ShieldAlert, tone: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Everything published on Sango is managed here. KAI stays separate.
        </p>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={18} />
            </span>
            <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link
          href="/admin/media"
          className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <ShieldAlert className="text-rose-600" size={22} />
          <h3 className="mt-3 font-heading text-lg font-bold text-slate-900">Moderate media</h3>
          <p className="mt-1 text-sm text-slate-500">
            Remove illegal posts, comments and stories.
          </p>
        </Link>
        <Link
          href="/admin/reports"
          className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <Flag className="text-amber-600" size={22} />
          <h3 className="mt-3 font-heading text-lg font-bold text-slate-900">Review reports</h3>
          <p className="mt-1 text-sm text-slate-500">
            Work through open reports and resolve them.
          </p>
        </Link>
        <Link
          href="/admin/videos"
          className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <Video className="text-sky-600" size={22} />
          <h3 className="mt-3 font-heading text-lg font-bold text-slate-900">Post video links</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add YouTube reports to the Sango News section.
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-heading font-bold text-slate-900">Open reports</h2>
            <Link href="/admin/reports" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.reports.length === 0 && (
              <p className="px-5 py-8 text-sm text-slate-500">No open reports.</p>
            )}
            {data.reports.map((report) => (
              <div key={report.id} className="px-5 py-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                  <Flag size={13} /> {report.target_type} · {report.reason}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                  {report.target_preview || "No preview available."}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {report.reporter?.username ? `Reported by @${report.reporter.username}` : "Anonymous"} ·{" "}
                  {formatAdminDateTime(report.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-heading font-bold text-slate-900">Latest posts</h2>
            <Link href="/admin/media" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              Moderate
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.posts.length === 0 && (
              <p className="px-5 py-8 text-sm text-slate-500">No posts yet.</p>
            )}
            {data.posts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 px-5 py-4">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt=""
                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <Newspaper size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    @{post.author.username}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {post.caption || "No caption"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatAdminDateTime(post.created_at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0" size={18} />
        <p>
          Admin actions are protected by your SIHU editor login. Production
          deployments must set <code className="font-mono">SIHU_ADMIN_ACCOUNTS</code>{" "}
          and <code className="font-mono">SIHU_ADMIN_SESSION_SECRET</code>.
        </p>
      </div>
    </div>
  );
}
