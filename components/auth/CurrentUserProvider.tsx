"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { WaflCurrentUser, WaflCurrentUserResponse } from "@/lib/auth/currentUser";

type CurrentUserContextValue = {
  user: WaflCurrentUser | null;
  authenticated: boolean;
  isLoading: boolean;
  refreshCurrentUser: () => Promise<WaflCurrentUser | null>;
  clearCurrentUser: () => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

async function fetchCurrentUser(): Promise<WaflCurrentUser | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("CURRENT_USER_LOAD_FAILED");

  const payload = (await response.json()) as WaflCurrentUserResponse;
  return payload.authenticated ? payload.user : null;
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WaflCurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCurrentUser = useCallback(() => {
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    fetchCurrentUser()
      .then((nextUser) => {
        if (!cancelled) setUser(nextUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      user,
      authenticated: Boolean(user),
      isLoading,
      refreshCurrentUser,
      clearCurrentUser,
    }),
    [clearCurrentUser, isLoading, refreshCurrentUser, user],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return context;
}
