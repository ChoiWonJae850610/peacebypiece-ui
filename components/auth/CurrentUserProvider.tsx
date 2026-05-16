"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const refreshInFlightRef = useRef<Promise<WaflCurrentUser | null> | null>(null);

  const refreshCurrentUser = useCallback(async () => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    setIsLoading(true);
    const nextRefresh = fetchCurrentUser()
      .then((nextUser) => {
        setUser(nextUser);
        return nextUser;
      })
      .catch((error) => {
        console.error("Current user refresh failed", error);
        setUser(null);
        return null;
      })
      .finally(() => {
        refreshInFlightRef.current = null;
        setIsLoading(false);
      });

    refreshInFlightRef.current = nextRefresh;
    return nextRefresh;
  }, []);

  const clearCurrentUser = useCallback(() => {
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void refreshCurrentUser();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCurrentUser();
      }
    };

    const handleWindowFocus = () => {
      void refreshCurrentUser();
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [refreshCurrentUser]);

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
