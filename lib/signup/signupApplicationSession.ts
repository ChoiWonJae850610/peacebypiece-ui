import type { SignupApplicationStatus } from "./signupApplicationTypes";

export type PendingSignupApplicationSession = {
  kind: "signup_application";
  applicationId: string;
  googleSub: string;
  emailNormalized: string;
  emailVerified: true;
  status: SignupApplicationStatus;
  issuedAt: string;
};

export const PENDING_SIGNUP_ALLOWED_ROUTE_PREFIXES = [
  "/pending",
  "/signup",
  "/login",
  "/terms",
  "/privacy",
  "/policies",
] as const;

export const PENDING_SIGNUP_BLOCKED_ROUTE_PREFIXES = [
  "/workspace",
  "/api/workspace",
  "/api/workorders",
  "/api/files",
  "/api/members",
  "/api/company",
  "/api/admin/settings",
  "/api/admin/subscription",
  "/api/material-orders",
  "/api/workorders/",
] as const;

export function isPendingSignupApplicationStatus(status: SignupApplicationStatus): boolean {
  return status === "draft" || status === "submitted" || status === "reviewing" || status === "changes_requested";
}
