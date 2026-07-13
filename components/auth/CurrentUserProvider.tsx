"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { WaflCurrentUser, WaflCurrentUserResponse } from "@/lib/auth/currentUser";

type CurrentUserContextValue = {
  user: WaflCurrentUser | null;
  authenticated: boolean;
  isLoading: boolean;
  refreshCurrentUser: () => Promise<WaflCurrentUser | null>;
  clearCurrentUser: () => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);
const CURRENT_USER_FETCH_DISABLED_PATHS = new Set(["/dev/workorder-preview-sample"]);

type CurrentUserFetchResult =
  | { status: "authenticated"; user: WaflCurrentUser }
  | { status: "unauthenticated" }
  | { status: "failed"; error: unknown };

async function fetchCurrentUser(): Promise<CurrentUserFetchResult> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (response.status === 401) return { status: "unauthenticated" };
    if (!response.ok) throw new Error("CURRENT_USER_LOAD_FAILED");

    const payload = (await response.json()) as WaflCurrentUserResponse;
    if (!payload.authenticated || !payload.user) return { status: "unauthenticated" };
    return { status: "authenticated", user: payload.user };
  } catch (error) {
    return { status: "failed", error };
  }
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentUserFetchDisabled = CURRENT_USER_FETCH_DISABLED_PATHS.has(pathname);
  const [user, setUser] = useState<WaflCurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(!currentUserFetchDisabled);
  const refreshInFlightRef = useRef<Promise<WaflCurrentUser | null> | null>(null);
  const userRef = useRef<WaflCurrentUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshCurrentUser = useCallback(async () => {
    if (currentUserFetchDisabled) {
      return null;
    }
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    setIsLoading(true);
    const nextRefresh = fetchCurrentUser()
      .then((result) => {
        if (result.status === "authenticated") {
          setUser(result.user);
          return result.user;
        }

        if (result.status === "unauthenticated") {
          setUser(null);
          return null;
        }

        return userRef.current;
      })
      .finally(() => {
        refreshInFlightRef.current = null;
        setIsLoading(false);
      });

    refreshInFlightRef.current = nextRefresh;
    return nextRefresh;
  }, [currentUserFetchDisabled]);

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
