"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types/workorder";
import {
  createWorkOrderSessionProfile,
  type WorkOrderSessionUser,
} from "@/lib/workorder/sessionUserProfile";

type AuthMeResponse = {
  authenticated?: boolean;
  user?: WorkOrderSessionUser | null;
};

export function useWorkOrderSessionProfile(): UserProfile | null {
  const [sessionProfile, setSessionProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const result = await response.json() as AuthMeResponse;
        if (cancelled) return;

        setSessionProfile(result.authenticated ? createWorkOrderSessionProfile(result.user) : null);
      } catch (error) {
        if (cancelled) return;
        setSessionProfile(null);

        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[workorder session profile]",
            error instanceof Error ? error.message : error,
          );
        }
      }
    }

    const handleProfileRefresh = () => {
      void loadSessionProfile();
    };

    void loadSessionProfile();
    window.addEventListener("focus", handleProfileRefresh);
    window.addEventListener("wafl-profile-updated", handleProfileRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleProfileRefresh);
      window.removeEventListener("wafl-profile-updated", handleProfileRefresh);
    };
  }, []);

  return sessionProfile;
}
