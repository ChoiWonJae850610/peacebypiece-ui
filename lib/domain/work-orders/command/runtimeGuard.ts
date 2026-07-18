import "server-only";

import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

export const WAFL_V2_ALPHA25_MUTATION_APPROVAL =
  "2.0.0-alpha.25-dev-test-command-runtime";
export const WAFL_V2_ALPHA26_MUTATION_APPROVAL =
  "2.0.0-alpha.26-dev-test-material-command-runtime";
export const WAFL_V2_ALPHA27_MUTATION_APPROVAL =
  "2.0.0-alpha.27-dev-test-revision-issue-runtime";
export const WAFL_V2_ALPHA30_MUTATION_APPROVAL =
  "2.0.0-alpha.30-dev-test-factory-instruction-runtime";
export const WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL =
  "2.0.0-alpha.46-dev-test-mobile-basic-info-runtime";

const SUPPORTED_MUTATION_APPROVALS = new Set([
  WAFL_V2_ALPHA25_MUTATION_APPROVAL,
  WAFL_V2_ALPHA26_MUTATION_APPROVAL,
  WAFL_V2_ALPHA27_MUTATION_APPROVAL,
  WAFL_V2_ALPHA30_MUTATION_APPROVAL,
]);

export type WorkOrderV2CommandRuntimeGuard =
  | {
      readonly ok: true;
      readonly fingerprint: string;
      readonly mutationApproved: boolean;
    }
  | { readonly ok: false; readonly reason: string };

export function getWorkOrderV2CommandRuntimeGuard(input?: {
  readonly requireMutationApproval?: boolean;
  readonly requiredMutationApproval?: string;
}): WorkOrderV2CommandRuntimeGuard {
  if (process.env.WAFL_V2_COMMAND_API_ENABLED !== "1") {
    return { ok: false, reason: "command-api-disabled" };
  }

  const readGuard = getWorkOrderV2ReadRuntimeGuard();
  if (!readGuard.ok) return readGuard;

  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  const mutationApproved = input?.requiredMutationApproval
    ? configuredApproval === input.requiredMutationApproval
    : SUPPORTED_MUTATION_APPROVALS.has(configuredApproval);
  if (input?.requireMutationApproval && !mutationApproved) {
    return { ok: false, reason: "command-mutation-approval-missing" };
  }

  return {
    ok: true,
    fingerprint: readGuard.fingerprint,
    mutationApproved,
  };
}

export function getWorkOrderV2BasicInfoMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA25_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL
  ) {
    return { ok: false, reason: "basic-info-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function isAlpha46BasicInfoMutationRuntime(): boolean {
  return process.env.WAFL_V2_COMMAND_MUTATION_APPROVED === WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL;
}
