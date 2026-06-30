import "server-only";

import { isServerDevTestRuntime } from "@/lib/runtime/serverRuntime";

export const SIGNUP_APPROVAL_PROVISIONING_EXECUTION_ENV =
  "WAFL_ENABLE_SIGNUP_APPROVAL_PROVISIONING";
export const SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION =
  "RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST";

export type SignupApprovalProvisioningBlockReason =
  | "SIGNUP_PROVISIONING_EXECUTION_FLAG_REQUIRED"
  | "SIGNUP_PROVISIONING_DEV_TEST_RUNTIME_REQUIRED"
  | "SIGNUP_PROVISIONING_CONFIRMATION_REQUIRED";

export type SignupApprovalProvisioningExecutionGate = {
  enabled: boolean;
  reasons: SignupApprovalProvisioningBlockReason[];
};

export function getSignupApprovalProvisioningExecutionGate(input: {
  confirmation?: string | null;
} = {}): SignupApprovalProvisioningExecutionGate {
  const reasons: SignupApprovalProvisioningBlockReason[] = [];
  if (process.env[SIGNUP_APPROVAL_PROVISIONING_EXECUTION_ENV] !== "1") {
    reasons.push("SIGNUP_PROVISIONING_EXECUTION_FLAG_REQUIRED");
  }
  if (!isServerDevTestRuntime()) {
    reasons.push("SIGNUP_PROVISIONING_DEV_TEST_RUNTIME_REQUIRED");
  }
  if (input.confirmation !== SIGNUP_APPROVAL_PROVISIONING_CONFIRMATION) {
    reasons.push("SIGNUP_PROVISIONING_CONFIRMATION_REQUIRED");
  }
  return {
    enabled: reasons.length === 0,
    reasons,
  };
}
