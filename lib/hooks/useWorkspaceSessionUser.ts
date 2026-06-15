"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkOrderSessionUser } from "@/lib/workorder/sessionUserProfile";

type AuthMeResponse = {
  authenticated?: boolean;
  user?: WorkOrderSessionUser | null;
};

type WorkspaceSessionUserState = {
  user: WorkOrderSessionUser | null;
  isLoaded: boolean;
  refresh: () => Promise<void>;
};

export function useWorkspaceSessionUser(): WorkspaceSessionUserState {
  const [user, setUser] = useState<WorkOrderSessionUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const result = await response.json() as AuthMeResponse;
      setUser(result.authenticated ? result.user ?? null : null);
    } catch (error) {
      setUser(null);

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[workspace session user]",
          error instanceof Error ? error.message : error,
        );
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const handleProfileRefresh = () => {
      void refresh();
    };

    void refresh();
    window.addEventListener("focus", handleProfileRefresh);
    window.addEventListener("wafl-profile-updated", handleProfileRefresh);

    return () => {
      window.removeEventListener("focus", handleProfileRefresh);
      window.removeEventListener("wafl-profile-updated", handleProfileRefresh);
    };
  }, [refresh]);

  return { user, isLoaded, refresh };
}
