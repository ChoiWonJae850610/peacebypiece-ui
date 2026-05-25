export type WorkOrderVisibilityScope =
  | { mode: "company" }
  | {
      mode: "assigned";
      userId: string;
      companyMemberId?: string | null;
    };

export type WorkOrderCompanyScope = {
  companyId: string;
  companyName?: string | null;
  visibility?: WorkOrderVisibilityScope;
};

export function resolveWorkOrderCompanyScope(scope?: WorkOrderCompanyScope | null): {
  companyId: string;
  companyName: string;
} {
  const companyId = scope?.companyId?.trim();
  if (!companyId) {
    throw new Error("COMPANY_SESSION_REQUIRED");
  }

  return {
    companyId,
    companyName: scope?.companyName?.trim() || companyId,
  };
}

export function resolveWorkOrderCompanyId(
  scope?: WorkOrderCompanyScope | null,
): string {
  return resolveWorkOrderCompanyScope(scope).companyId;
}

export function normalizeWorkOrderVisibilityScope(
  scope?: WorkOrderCompanyScope | null,
): WorkOrderVisibilityScope {
  const visibility = scope?.visibility;
  if (visibility?.mode !== "assigned") return { mode: "company" };

  const userId = visibility.userId.trim();
  if (!userId) return { mode: "company" };

  return {
    mode: "assigned",
    userId,
    companyMemberId: visibility.companyMemberId?.trim() || null,
  };
}
