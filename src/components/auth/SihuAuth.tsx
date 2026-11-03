"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface SihuUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface SihuAuthResult {
  ok: boolean;
  error?: string;
}

export interface SihuAuth {
  ready: boolean;
  available: boolean;
  googleEnabled: boolean;
  signedIn: boolean;
  user: SihuUser | null;
  email: string | null;
  name: string | null;
  signInWithGoogle: (next?: string) => void;
  signInWithEmail: (email: string, password: string) => Promise<SihuAuthResult>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<SihuAuthResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const EMPTY_AUTH: SihuAuth = {
  ready: true,
  available: false,
  googleEnabled: false,
  signedIn: false,
  user: null,
  email: null,
  name: null,
  signInWithGoogle: () => {},
  signInWithEmail: async () => ({ ok: false, error: "Sign-in is not available." }),
  signUpWithEmail: async () => ({ ok: false, error: "Sign-up is not available." }),
  signOut: async () => {},
  refresh: async () => {},
  getAccessToken: async () => null,
};

const Ctx = createContext<SihuAuth>(EMPTY_AUTH);

export const useSihuAuth = () => useContext(Ctx);

type MeResponse = {
  user?: SihuUser | null;
  available?: boolean;
  googleEnabled?: boolean;
};

type AuthResponse = {
  user?: SihuUser;
  error?: string;
};

export default function SihuAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [user, setUser] = useState<SihuUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as MeResponse;
      setUser(data.user ?? null);
      setAvailable(data.available !== false);
      setGoogleEnabled(Boolean(data.googleEnabled));
    } catch {
      setAvailable(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signInWithGoogle = useCallback((next?: string) => {
    const target =
      next ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/portal");
    window.location.assign(`/api/auth/google?next=${encodeURIComponent(target)}`);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<SihuAuthResult> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await response.json()) as AuthResponse;
        if (!response.ok || !data.user) {
          return { ok: false, error: data.error ?? "Could not sign you in." };
        }
        setUser(data.user);
        setAvailable(true);
        setReady(true);
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the sign-in service." };
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string): Promise<SihuAuthResult> => {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = (await response.json()) as AuthResponse;
        if (!response.ok || !data.user) {
          return { ok: false, error: data.error ?? "Could not create your account." };
        }
        setUser(data.user);
        setAvailable(true);
        setReady(true);
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the sign-in service." };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors; clear local state anyway.
    }
    setUser(null);
  }, []);

  const value = useMemo<SihuAuth>(
    () => ({
      ready,
      available,
      googleEnabled,
      signedIn: Boolean(user),
      user,
      email: user?.email ?? null,
      name: user?.name ?? null,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refresh,
      getAccessToken: async () => null,
    }),
    [
      ready,
      available,
      googleEnabled,
      user,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refresh,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
