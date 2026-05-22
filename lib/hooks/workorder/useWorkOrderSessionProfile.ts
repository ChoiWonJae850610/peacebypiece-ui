"use client";

import { useEffect, useState } from "react";
import { buildUserRoleState } from "@/lib/constants/roles";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/workorder";

type AuthMeResponse = {
  authenticated?: boolean;
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    roleTemplateCode?: string | null;
    companyMemberId?: string | null;
    permissionCodes?: readonly string[] | null;
  } | null;
};

const ROLE_TEMPLATE_TO_WORKORDER_ROLE: Record<string, RoleType | null> = {
  company_admin: "admin",
  designer: "designer",
  inspector: "inspector",
  inventory_manager: "inspector",
  viewer: null,
};

function normalizePermissionCodes(permissionCodes: readonly string[] | null | undefined): readonly string[] {
  if (!Array.isArray(permissionCodes)) return [];

  return Array.from(
    new Set(
      permissionCodes
        .map((permissionCode) => String(permissionCode ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function resolveWorkOrderRole(user: AuthMeResponse["user"]): RoleType {
  const roleTemplateCode = user?.roleTemplateCode?.trim();
  if (roleTemplateCode && roleTemplateCode in ROLE_TEMPLATE_TO_WORKORDER_ROLE) {
    return ROLE_TEMPLATE_TO_WORKORDER_ROLE[roleTemplateCode] ?? "designer";
  }

  return user?.role === "company_admin" || user?.role === "system_admin"
    ? "admin"
    : "designer";
}

function createSessionProfile(user: AuthMeResponse["user"]): UserProfile | null {
  if (!user?.id) return null;

  const role = resolveWorkOrderRole(user);

  return {
    id: user.id,
    companyMemberId: user.companyMemberId?.trim() || null,
    name: user.name?.trim() || user.email?.trim() || user.id,
    permissionCodes: normalizePermissionCodes(user.permissionCodes),
    ...buildUserRoleState([role]),
  };
}

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

        setSessionProfile(result.authenticated ? createSessionProfile(result.user) : null);
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

    void loadSessionProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return sessionProfile;
}
