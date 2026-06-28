import {
  SIGNUP_APPLICATION_FINAL_STATUSES,
  type SignupApplicationStatus,
} from "./signupApplicationTypes";

export const PROVISIONING_FAILURE_STATUS = "provisioning_failed" as const;

const SIGNUP_APPLICATION_TRANSITIONS: Record<
  SignupApplicationStatus,
  readonly SignupApplicationStatus[]
> = {
  draft: ["submitted", "canceled"],
  submitted: ["reviewing", "changes_requested", "rejected", "canceled"],
  reviewing: ["changes_requested", "approved", "rejected", "canceled"],
  changes_requested: ["submitted", "rejected", "canceled"],
  approved: [],
  rejected: [],
  canceled: [],
  provisioning_failed: ["rejected", "canceled"],
};

export function getAllowedSignupApplicationTransitions(
  status: SignupApplicationStatus,
): readonly SignupApplicationStatus[] {
  return SIGNUP_APPLICATION_TRANSITIONS[status];
}

export function isFinalSignupApplicationStatus(status: SignupApplicationStatus): boolean {
  return SIGNUP_APPLICATION_FINAL_STATUSES.includes(
    status as (typeof SIGNUP_APPLICATION_FINAL_STATUSES)[number],
  );
}

export function canTransitionSignupApplicationStatus(
  from: SignupApplicationStatus,
  to: SignupApplicationStatus,
): boolean {
  return SIGNUP_APPLICATION_TRANSITIONS[from].includes(to);
}

export function assertSignupApplicationStatusTransition(
  from: SignupApplicationStatus,
  to: SignupApplicationStatus,
): void {
  if (!canTransitionSignupApplicationStatus(from, to)) {
    throw new Error(`Invalid signup application status transition: ${from} -> ${to}`);
  }
}

export function canStartSignupProvisioning(status: SignupApplicationStatus): boolean {
  return status === "reviewing";
}

export function assertCanStartSignupProvisioning(status: SignupApplicationStatus): void {
  if (!canStartSignupProvisioning(status)) {
    throw new Error(`Signup provisioning can only start from reviewing status: ${status}`);
  }
}
