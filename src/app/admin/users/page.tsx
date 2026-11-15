"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { adminFetch, formatAdminDate, initials } from "@/lib/admin/client";

type User = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  email: string;
  role: string;
  is_suspended: boolean;
  is_verified: boolean;
  reporter_verified?: boolean;
  follower_count?: number;
  post_count?: number;
  created_at: string;
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ users: User[] }>(
        `/api/admin/users?q=${encodeURIComponent(search)}`,
      );
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (user: User, action: string) => {
    let reason = "";
    if (action === "suspend") {
      reason = window.prompt(`Reason for suspending @${user.username}:`) ?? "";
      if (!reason.trim()) return;
    }
    if (action === "make-reporter" && !window.confirm(`Make @${user.username} a verified reporter?`)) {
      return;
    }
    setBusyId(user.id);
    setError(null);
    try {
      await adminFetch("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, action, reason }),
      });
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the user.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Search members, suspend abusive accounts, and verify reporters.
        </p>
        <div className="flex gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load(query);
              }}
              placeholder="Name, username or email"
              className="w-64 rounded-full border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
          <button
            onClick={() => void load(query)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {users.length === 0 && !loading && (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
          No users found.
        </p>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <article
            key={user.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {initials(user.full_name || user.username)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">{user.full_name}</p>
                <span className="text-sm text-slate-500">@{user.username}</span>
                {user.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                    <BadgeCheck size={11} /> Verified
                  </span>
                )}
                {user.reporter_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Reporter
                  </span>
                )}
                {user.is_suspended && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                    <ShieldAlert size={11} /> Suspended
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
              <p className="mt-1 text-xs text-slate-400">
                {user.role} · {user.post_count ?? 0} posts · {user.follower_count ?? 0} followers · joined{" "}
                {formatAdminDate(user.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {user.is_suspended ? (
                <button
                  onClick={() => void act(user, "unsuspend")}
                  disabled={busyId === user.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  <ShieldCheck size={13} /> Unsuspend
                </button>
              ) : (
                <button
                  onClick={() => void act(user, "suspend")}
                  disabled={busyId === user.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  <ShieldAlert size={13} /> Suspend
                </button>
              )}
              <button
                onClick={() => void act(user, user.is_verified ? "unverify" : "verify")}
                disabled={busyId === user.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
              >
                <BadgeCheck size={13} /> {user.is_verified ? "Unverify" : "Verify"}
              </button>
              {!user.reporter_verified && (
                <button
                  onClick={() => void act(user, "make-reporter")}
                  disabled={busyId === user.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <UserCheck size={13} /> Reporter
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
