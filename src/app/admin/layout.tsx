"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import SihuLogo from "@/components/brand/SihuLogo";

type IconComponent = React.ComponentType<{ className?: string; size?: number }>;

const NAV: { href: string; label: string; icon: IconComponent }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/media", label: "Media Moderation", icon: ShieldAlert },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/admins", label: "Admins", icon: UserCog },
  { href: "/admin/videos", label: "Sango News Videos", icon: Video },
];

const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/content": "Content Manager",
  "/admin/media": "Media Moderation",
  "/admin/reports": "Reports",
  "/admin/users": "Users",
  "/admin/admins": "Admins",
  "/admin/videos": "Sango News Videos",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    if (isLogin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      return;
    }

    let active = true;
    let key = "";
    try {
      key = sessionStorage.getItem("sihu_admin_key") || "";
    } catch {
      /* storage blocked */
    }

    fetch("/api/admin/session", {
      cache: "no-store",
      credentials: "same-origin",
      headers: key ? { "x-admin-key": key } : undefined,
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          authenticated?: boolean;
          email?: string | null;
        };
        if (!active) return;
        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
          setAdminEmail(data.email ?? "");
        } else {
          setIsAuthenticated(false);
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        if (!active) return;
        setIsAuthenticated(false);
        router.replace("/admin/login");
      });

    return () => {
      active = false;
    };
  }, [isLogin, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/session", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem("sihu_admin_key");
      sessionStorage.removeItem("sango_admin_auth");
      sessionStorage.removeItem("sango_admin_email");
    } catch {
      /* storage blocked */
    }
    router.replace("/admin/login");
  };

  if (isLogin) return <>{children}</>;

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060D1A]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const title = TITLES[pathname] ?? "Admin";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 md:min-h-screen flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="shrink-0 rounded-xl shadow-[0_0_15px_rgba(88,179,242,0.4)]">
              <SihuLogo variant="mark" onDark alt="SIHU" className="h-9" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight uppercase tracking-wider">
                Admin
              </h2>
              <span className="block text-[10px] text-slate-400">Sango Information Hub</span>
              {adminEmail && (
                <span className="block max-w-[150px] truncate text-[10px] text-slate-500">
                  {adminEmail}
                </span>
              )}
            </div>
          </div>

          <nav className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    active
                      ? "bg-white/10 text-white border-white/5"
                      : "text-slate-300 border-transparent hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-slate-400"}`} />
                  {label}
                </Link>
              );
            })}
            <Link
              href="/admin/content#ai-gateway"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-transparent hover:bg-white/5 hover:text-white transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-slate-400" />
              AI Settings
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10 space-y-4">
          <a
            href="/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full text-sm font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            View Live Portal
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Secure Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sango-only administration. KAI remains a separate platform.
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              Live Portal <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
