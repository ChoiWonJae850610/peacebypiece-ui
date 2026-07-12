import "server-only";

import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

export const WAFL_V2_ALPHA25_MUTATION_APPROVAL =
  "2.0.0-alpha.25-dev-test-command-runtime";

export type WorkOrderV2CommandRuntimeGuard =
  | {
      readonly ok: true;
      readonly fingerprint: string;
      readonly mutationApproved: boolean;
    }
  | { readonly ok: false; readonly reason: string };

export function getWorkOrderV2CommandRuntimeGuard(input?: {
  readonly requireMutationApproval?: boolean;
}): WorkOrderV2CommandRuntimeGuard {
  if (process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") {
    return { ok: false, reason: "command-api-disabled" };
  }

  const readGuard = getWorkOrderV2ReadRuntimeGuard();
  if (!readGuard.ok) return readGuard;

  const mutationApproved =
    process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ===
    WAFL_V2_ALPHA25_MUTATION_APPROVAL;
  if (input?.requireMutationApproval && !mutationApproved) {
    return { ok: false, reason: "command-mutation-approval-missing" };
  }

  return {
    ok: true,
    fingerprint: readGuard.fingerprint,
    mutationApproved,
  };
}
