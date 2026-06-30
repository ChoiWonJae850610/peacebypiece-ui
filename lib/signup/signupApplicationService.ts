import {
  TRIAL_MEMBER_LIMIT,
  TRIAL_STORAGE_LIMIT_BYTES,
  getTrialEndsAt,
} from "@/lib/billing/companyTrialPolicy";
import {
  assertCanStartSignupProvisioning,
  assertSignupApplicationStatusTransition,
} from "./signupApplicationStatus";
import type { SignupApplicationRepository } from "./signupApplicationRepository";
import type { SignupApprovalProvisioningPort } from "./signupApplicationProvisioning";
import type { SignupApplicationRecord, SignupApplicationStatus } from "./signupApplicationTypes";

export type SignupApplicationService = {
  transitionStatus(input: {
    application: SignupApplicationRecord;
    to: SignupApplicationStatus;
    systemUserId?: string | null;
    reason?: string | null;
    now?: Date;
  }): Promise<SignupApplicationRecord>;
  approveAndProvision(input: {
    application: SignupApplicationRecord;
    approvedBySystemUserId: string;
    now?: Date;
  }): Promise<SignupApplicationRecord>;
};

export function createSignupApplicationService(dependencies: {
  repository: SignupApplicationRepository;
  provisioning: SignupApprovalProvisioningPort;
}): SignupApplicationService {
  return {
    async transitionStatus(input) {
      assertSignupApplicationStatusTransition(input.application.status, input.to);

      return dependencies.repository.transitionStatus({
        applicationId: input.application.id,
        from: input.application.status,
        to: input.to,
        systemUserId: input.systemUserId ?? null,
        reason: input.reason ?? null,
        now: input.now ?? new Date(),
        compareAndSet: true,
      });
    },

    async approveAndProvision(input) {
      const approvedAt = input.now ?? new Date();
      assertCanStartSignupProvisioning(input.application.status);

      try {
        const result = await dependencies.provisioning.provisionApprovedSignup({
          application: input.application,
          approvedBySystemUserId: input.approvedBySystemUserId,
          approvedAt,
        });

        assertTrialPolicySnapshot(result.trial, approvedAt);

        const updated = await dependencies.repository.findById(input.application.id);
        if (!updated || updated.status !== "approved" || updated.provisioningStatus !== "completed") {
          throw new SignupProvisioningPersistedError(
            input.application.id,
            "SIGNUP_PROVISIONING_COMPLETED_RECORD_NOT_FOUND",
          );
        }
        return updated;
      } catch (error) {
        const errorCode = sanitizeProvisioningErrorCode(error);
        throw new SignupProvisioningPersistedError(input.application.id, errorCode);
      }
    },
  };
}

export class SignupProvisioningError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "SignupProvisioningError";
  }
}

export class SignupProvisioningPersistedError extends Error {
  constructor(
    readonly applicationId: string,
    readonly code: string,
  ) {
    super(code);
    this.name = "SignupProvisioningPersistedError";
  }
}

export function sanitizeProvisioningErrorCode(error: unknown): string {
  if (error instanceof SignupProvisioningError && /^[A-Z0-9_]{3,80}$/.test(error.code)) {
    return error.code;
  }
  if (
    error
    && typeof error === "object"
    && "code" in error
    && typeof (error as { code?: unknown }).code === "string"
    && /^[A-Z0-9_]{3,80}$/.test((error as { code: string }).code)
  ) {
    return (error as { code: string }).code;
  }
  return "SIGNUP_PROVISIONING_FAILED";
}

function assertTrialPolicySnapshot(input: {
  startedAt: Date;
  endsAt: Date;
  storageLimitBytes: number;
  memberLimit: number;
}, approvedAt: Date): void {
  if (input.startedAt.getTime() !== approvedAt.getTime()) {
    throw new Error("Signup Trial start time must equal the system-admin approval time.");
  }

  const expectedEndsAt = getTrialEndsAt(input.startedAt);

  if (input.endsAt.getTime() !== expectedEndsAt.getTime()) {
    throw new Error("Signup Trial window must start at approval time and last 7 days.");
  }
  if (input.storageLimitBytes !== TRIAL_STORAGE_LIMIT_BYTES) {
    throw new Error("Signup Trial storage limit must be 100MB.");
  }
  if (input.memberLimit !== TRIAL_MEMBER_LIMIT) {
    throw new Error("Signup Trial member limit must be 3.");
  }
}
