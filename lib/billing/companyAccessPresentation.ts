import type { WaflSessionPayload } from "@/lib/auth/session";
import type { CompanyAccessBlockReason, CompanyAccessState } from "@/lib/billing/companyAccessRepository";

export type ServicePausedPageCopy = {
  eyebrow: string;
  sessionRequired: ServicePausedStatusCopy;
  profileRequiredAdmin: ServicePausedStatusCopy;
  profileRequiredMember: ServicePausedStatusCopy;
  approvalPendingAdmin: ServicePausedStatusCopy;
  approvalPendingMember: ServicePausedStatusCopy;
  rejectedAdmin: ServicePausedStatusCopy;
  rejectedMember: ServicePausedStatusCopy;
  subscriptionAdmin: ServicePausedStatusCopy;
  subscriptionMember: ServicePausedStatusCopy;
  unknown: ServicePausedStatusCopy;
  labels: {
    company: string;
    account: string;
    status: string;
  };
  actions: {
    logout: string;
    goAdmin: string;
    goSubscription: string;
    goLogin: string;
  };
  statusLabels: Record<ServicePausedViewStatus, string>;
};

export type ServicePausedStatusCopy = {
  title: string;
  description: string;
  notice: string;
};

export type ServicePausedViewStatus =
  | "session_required"
  | "profile_required"
  | "approval_pending"
  | "rejected"
  | "subscription_blocked"
  | "unknown";

export type ServicePausedViewModel = {
  eyebrow: string;
  title: string;
  description: string;
  notice: string;
  status: ServicePausedViewStatus;
  statusLabel: string;
  companyName: string;
  accountEmail: string;
  primaryActionHref: string;
  primaryActionLabel: string;
  secondaryActionHref: string;
  secondaryActionLabel: string;
  labels: ServicePausedPageCopy["labels"];
};

function resolveStatus(reason: CompanyAccessBlockReason | null): ServicePausedViewStatus {
  if (reason === "profile_required") return "profile_required";
  if (reason === "approval_pending") return "approval_pending";
  if (reason === "rejected") return "rejected";
  if (reason === "trial_expired" || reason === "subscription_blocked") return "subscription_blocked";

  return "unknown";
}

function pickStatusCopy(input: {
  copy: ServicePausedPageCopy;
  session: WaflSessionPayload | null;
  status: ServicePausedViewStatus;
}): ServicePausedStatusCopy {
  if (!input.session) return input.copy.sessionRequired;

  const isCompanyAdmin = input.session.role === "company_admin";
  if (input.status === "profile_required") {
    return isCompanyAdmin ? input.copy.profileRequiredAdmin : input.copy.profileRequiredMember;
  }
  if (input.status === "approval_pending") {
    return isCompanyAdmin ? input.copy.approvalPendingAdmin : input.copy.approvalPendingMember;
  }
  if (input.status === "rejected") {
    return isCompanyAdmin ? input.copy.rejectedAdmin : input.copy.rejectedMember;
  }
  if (input.status === "subscription_blocked") {
    return isCompanyAdmin ? input.copy.subscriptionAdmin : input.copy.subscriptionMember;
  }

  return input.copy.unknown;
}

function resolvePrimaryAction(input: {
  copy: ServicePausedPageCopy;
  session: WaflSessionPayload | null;
  status: ServicePausedViewStatus;
}): { href: string; label: string } {
  if (!input.session) {
    return { href: "/", label: input.copy.actions.goLogin };
  }

  if (input.session.role === "company_admin" && input.status === "profile_required") {
    return { href: "/admin", label: input.copy.actions.goAdmin };
  }

  if (input.session.role === "company_admin" && input.status === "subscription_blocked") {
    return { href: "/admin/subscription", label: input.copy.actions.goSubscription };
  }

  return { href: "/api/auth/logout", label: input.copy.actions.logout };
}

export function buildServicePausedViewModel(input: {
  session: WaflSessionPayload | null;
  accessState: CompanyAccessState | null;
  copy: ServicePausedPageCopy;
}): ServicePausedViewModel {
  const status = input.session ? resolveStatus(input.accessState?.workspaceBlockedReason ?? null) : "session_required";
  const statusCopy = pickStatusCopy({ copy: input.copy, session: input.session, status });
  const primaryAction = resolvePrimaryAction({ copy: input.copy, session: input.session, status });

  return {
    eyebrow: input.copy.eyebrow,
    title: statusCopy.title,
    description: statusCopy.description,
    notice: statusCopy.notice,
    status,
    statusLabel: input.copy.statusLabels[status],
    companyName: input.session?.companyName ?? "-",
    accountEmail: input.session?.email ?? "-",
    primaryActionHref: primaryAction.href,
    primaryActionLabel: primaryAction.label,
    secondaryActionHref: "/api/auth/logout",
    secondaryActionLabel: input.copy.actions.logout,
    labels: input.copy.labels,
  };
}
