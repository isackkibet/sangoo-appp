"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Mail,
  LogOut,
  CheckCircle2,
  Newspaper,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useSihuAuth } from "@/components/auth/SihuAuth";
import { KAI_URL } from "@/services/kaiHubService";

/** Where to go after signing in: a same-site path only. */
const safeNext = (v: string | null) => (v && /^\/(?![/\\])/.test(v) && !v.startsWith("/login") ? v : null);

type Mode = "signup" | "signin";

export default function LoginPage() {
  const router = useRouter();
  const auth = useSihuAuth();
  const [next, setNext] = useState<string | null>(null);
  // If the session check never answers (network), show the buttons anyway.
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.ready) return;
    const t = setTimeout(() => setWaitedTooLong(true), 8000);
    return () => clearTimeout(t);
  }, [auth.ready]);

  // Remember where the visitor came from (Google leaves the page and comes back).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = safeNext(params.get("next"));
    let target = fromUrl;
    try {
      if (fromUrl) sessionStorage.setItem("sihu-next", fromUrl);
      target = fromUrl ?? safeNext(sessionStorage.getItem("sihu-next"));
    } catch {
      /* storage blocked */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNext(target);

    if (params.get("mode") === "signin") setMode("signin");

    const oauthError = params.get("error");
    if (oauthError === "google_not_configured") {
      setError("Google sign-in is not set up yet. Create an account with email below.");
    } else if (oauthError) {
      setError("Google sign-in could not be completed. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (!auth.signedIn || !next) return;
    try {
      sessionStorage.removeItem("sihu-next");
    } catch {
      /* ignore */
    }
    router.replace(next);
  }, [auth.signedIn, next, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError(null);

    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    const result =
      mode === "signup"
        ? await auth.signUpWithEmail(name, email, password)
        : await auth.signInWithEmail(email, password);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    try {
      sessionStorage.removeItem("sihu-next");
    } catch {
      /* ignore */
    }
    router.replace(next ?? "/portal");
  };

  const switchMode = (value: Mode) => {
    setMode(value);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] grid lg:grid-cols-2">
      {/* Photo side */}
      <div className="relative hidden lg:block">
        <Image src="/images/lake-victoria-sunrise-hd.png" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/10" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <p className="font-heading text-[34px] font-bold leading-tight max-w-md">We care about the lake.</p>
          <p className="text-slate-200 text-[16px] mt-3 max-w-md leading-relaxed">One account for the Sango Information Hub and the KAI conservation platform.</p>
        </div>
      </div>

      {/* Sign-in side */}
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[14px] font-semibold text-slate-600 hover:text-slate-900 w-fit">
          <ArrowLeft size={17} /> Home
        </Link>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            <Image src="/images/logo-main.png" alt="Sango Information Hub" width={180} height={54} className="h-12 w-auto" priority />

            {!auth.ready && !waitedTooLong ? (
              <p className="flex items-center gap-2 mt-10 text-slate-500"><Loader2 size={18} className="animate-spin" /> Checking your session...</p>
            ) : auth.signedIn ? (
              <>
                <h1 className="font-heading text-[30px] font-bold text-slate-900 mt-8">You are signed in</h1>
                <p className="flex items-center gap-2 text-[15px] text-slate-600 mt-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> {auth.name ? `${auth.name} · ` : ""}{auth.email ?? "your account"}
                </p>
                <div className="mt-8 space-y-3">
                  <Link href="/portal" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[15px] font-semibold transition-colors">
                    <Newspaper size={17} /> Go to the news
                  </Link>
                  <Link href="/verify" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-slate-300 hover:border-slate-900 text-slate-800 text-[15px] font-semibold transition-colors">
                    <ShieldCheck size={17} /> Verify and earn
                  </Link>
                  <button onClick={() => { void auth.signOut(); }} className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-slate-600 hover:bg-slate-100 text-[14.5px] font-semibold">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-heading text-[30px] font-bold text-slate-900 mt-8">
                  {mode === "signup" ? "Create your account" : "Sign in to SIHU"}
                </h1>
                <p className="text-[15px] text-slate-600 mt-2 leading-relaxed">
                  {mode === "signup"
                    ? "Create an account with email, or continue with Google. The same account works on the KAI platform."
                    : "Welcome back. Sign in with email or continue with Google."}
                </p>

                {!auth.ready && (
                  <p className="mt-6 p-3 rounded-xl bg-slate-100 text-slate-600 text-[13.5px]">Sign-in is slow to load. If the buttons do nothing, refresh the page.</p>
                )}

                {!auth.available ? (
                  <p className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[14.5px] leading-relaxed">
                    Sign-in is not switched on for this site yet. Please try again later.
                  </p>
                ) : (
                  <div className="mt-8 space-y-3">
                    <button
                      onClick={() => auth.signInWithGoogle(next ?? "/portal")}
                      disabled={busy}
                      className="flex items-center justify-center gap-3 w-full py-3.5 rounded-full bg-white border border-slate-300 hover:border-slate-900 text-slate-900 text-[15px] font-semibold shadow-sm transition-colors disabled:opacity-60"
                    >
                      <GoogleIcon /> Continue with Google
                    </button>

                    {!auth.googleEnabled && (
                      <p className="text-[12.5px] text-slate-500 leading-relaxed text-center">
                        Google sign-in is not configured yet. Use email below.
                      </p>
                    )}

                    <div className="flex items-center gap-3 py-1">
                      <span className="h-px flex-1 bg-slate-200" />
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">or use email</span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className={`py-2 rounded-full text-[13.5px] font-semibold transition-colors ${mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Create account
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className={`py-2 rounded-full text-[13.5px] font-semibold transition-colors ${mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        Sign in
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      {mode === "signup" && (
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          type="text"
                          name="name"
                          placeholder="Full name"
                          autoComplete="name"
                          maxLength={120}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                        />
                      )}
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        name="email"
                        placeholder="Email address"
                        autoComplete="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                      />
                      <div className="relative">
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder={mode === "signup" ? "Password (at least 8 characters)" : "Password"}
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          required
                          minLength={mode === "signup" ? 8 : undefined}
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {error && (
                        <p role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13.5px] leading-relaxed">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={busy}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[15px] font-semibold transition-colors disabled:opacity-70"
                      >
                        {busy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={17} />}
                        {busy
                          ? mode === "signup"
                            ? "Creating account..."
                            : "Signing in..."
                          : mode === "signup"
                            ? "Create account"
                            : "Sign in with email"}
                      </button>
                    </form>

                    <p className="text-[13px] text-slate-500 text-center pt-1">
                      {mode === "signup" ? (
                        <>
                          Already have an account?{" "}
                          <button type="button" onClick={() => switchMode("signin")} className="font-semibold text-sky-700 hover:text-sky-900">
                            Sign in
                          </button>
                        </>
                      ) : (
                        <>
                          New to SIHU?{" "}
                          <button type="button" onClick={() => switchMode("signup")} className="font-semibold text-sky-700 hover:text-sky-900">
                            Create an account
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-10 pt-6 border-t border-slate-200">
                  <p className="text-[14px] font-semibold text-slate-800">SIHU editors</p>
                  <p className="text-[13.5px] text-slate-500 mt-1 leading-relaxed">
                    Publish news, photos and videos from the{" "}
                    <a href={`${KAI_URL}/hubs/sihu/admin`} className="font-semibold text-sky-700 hover:text-sky-900">Information Hub admin</a>.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
