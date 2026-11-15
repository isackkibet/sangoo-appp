"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { adminFetch, formatAdminDate, initials } from "@/lib/admin/client";

type Admin = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_suspended: boolean;
  created_at: string | null;
  is_owner: boolean;
  is_self: boolean;
  password: string | null;
};

type Response = { admins: Admin[]; selfEmail: string | null };

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<Response>("/api/admin/admins");
      setAdmins(data.admins);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admins.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adding) return;
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter the admin's email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setAdding(true);
    try {
      const res = await adminFetch<{ created: boolean; email: string }>(
        "/api/admin/admins",
        {
          method: "POST",
          body: JSON.stringify({
            email: trimmedEmail,
            name,
            password,
          }),
        },
      );
      setNotice(
        res.created
          ? `Admin added. Share ${res.email} and the password with them securely.`
          : `Admin access updated for ${res.email}. Their old sessions were signed out.`,
      );
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the admin.");
    } finally {
      setAdding(false);
    }
  };

  const resetPassword = async (admin: Admin) => {
    const next = window.prompt(
      `Set a new password for ${admin.email} (at least 8 characters):`,
    );
    if (next === null) return;
    if (next.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusyId(admin.id);
    setError(null);
    setNotice(null);
    try {
      await adminFetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify({
          email: admin.email,
          name: admin.name ?? "",
          password: next,
        }),
      });
      setNotice(`Password set for ${admin.email}. Share it privately.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not set the password.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const copyPassword = async (admin: Admin) => {
    if (!admin.password) return;
    try {
      await navigator.clipboard.writeText(admin.password);
      setCopiedId(admin.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("Could not copy. Reveal the password and copy it manually.");
    }
  };

  const removeAdmin = async (admin: Admin) => {
    if (admin.is_owner || admin.is_self) return;
    if (
      !window.confirm(
        `Remove admin access for ${admin.email}? They will be signed out and returned to a normal account.`,
      )
    ) {
      return;
    }
    setBusyId(admin.id);
    setError(null);
    setNotice(null);
    try {
      await adminFetch(`/api/admin/admins/${encodeURIComponent(admin.id)}`, {
        method: "DELETE",
      });
      setNotice(`Admin access removed for ${admin.email}.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not remove the admin.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Add or remove people who can manage the Sango admin portal. New admins
          sign in with the email and password you set here. Passwords are shown
          only to signed-in admins — share them privately.
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

      <form
        onSubmit={addAdmin}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-sky-700" />
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Add an admin
          </h2>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          If the email already has an account, its password is reset and admin
          access is granted.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name (optional)"
            autoComplete="off"
            maxLength={120}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email address"
            autoComplete="off"
            required
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password (at least 8 characters)"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={200}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
          />
        </div>

        <button
          type="submit"
          disabled={adding}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
        >
          {adding ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          {adding ? "Adding..." : "Add admin"}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {admins.length === 0 && !loading && (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
          No admins yet.
        </p>
      )}

      <div className="space-y-3">
        {admins.map((admin) => (
          <article
            key={admin.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {initials(admin.name || admin.email)}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-slate-900">
                  {admin.name || admin.email}
                </p>
                {admin.is_owner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    <Crown size={11} /> Owner
                  </span>
                )}
                {admin.is_self && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                    <ShieldCheck size={11} /> You
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-slate-500">{admin.email}</p>
              <p className="mt-1 text-xs text-slate-400">
                {admin.role}
                {admin.created_at
                  ? ` · added ${formatAdminDate(admin.created_at)}`
                  : ""}
              </p>

              {admin.password ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">Password</span>
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[12.5px] text-slate-800">
                    {revealed[admin.id] ? admin.password : "••••••••"}
                  </code>
                  <button
                    onClick={() =>
                      setRevealed((prev) => ({
                        ...prev,
                        [admin.id]: !prev[admin.id],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-600 hover:border-slate-900"
                  >
                    {revealed[admin.id] ? (
                      <EyeOff size={12} />
                    ) : (
                      <Eye size={12} />
                    )}
                    {revealed[admin.id] ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => void copyPassword(admin)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-600 hover:border-slate-900"
                  >
                    {copiedId === admin.id ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copiedId === admin.id ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  No password stored yet — use Reset password.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {admin.is_self ? (
                <span className="text-xs font-semibold text-slate-400">
                  Current account
                </span>
              ) : (
                <>
                  <button
                    onClick={() => void resetPassword(admin)}
                    disabled={busyId === admin.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                  >
                    {busyId === admin.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <KeyRound size={13} />
                    )}
                    Reset password
                  </button>
                  {admin.id.startsWith("owner:") ? (
                    <span className="text-xs font-semibold text-slate-400">
                      Set a password first
                    </span>
                  ) : (
                    <button
                      onClick={() => void removeAdmin(admin)}
                      disabled={busyId === admin.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <Trash2 size={13} />
                      Remove admin
                    </button>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
