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
export const WAFL_V2_ALPHA50_MATERIAL_DRAFT_MUTATION_APPROVAL =
  "2.0.0-alpha.50-dev-test-mobile-material-draft-runtime";
export const WAFL_V2_ALPHA51_MATERIAL_LIFECYCLE_MUTATION_APPROVAL =
  "2.0.0-alpha.51-dev-test-mobile-material-lifecycle-runtime";
export const WAFL_V2_ALPHA52_CORE_INLINE_MUTATION_APPROVAL =
  "2.0.0-alpha.52-dev-test-mobile-core-inline-runtime";
export const WAFL_V2_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_APPROVAL =
  "2.0.0-alpha.55-dev-test-mobile-material-order-lifecycle-runtime";
export const WAFL_V2_ALPHA56_ACCESSORY_LIFECYCLE_PARITY_MUTATION_APPROVAL =
  "2.0.0-alpha.56-dev-test-accessory-lifecycle-parity-runtime";
export const WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL =
  "2.0.0-alpha.57-dev-test-work-order-image-runtime";
export const WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL =
  "2.0.0-alpha.59-dev-test-size-color-structure-runtime";
export const WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL =
  "2.0.0-alpha.60-dev-test-draft-child-hard-delete-runtime";
export const WAFL_V2_ALPHA61_MOBILE_WORK_ORDER_CREATE_MUTATION_APPROVAL =
  "2.0.0-alpha.61-dev-test-mobile-work-order-create-runtime";
export const WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL =
  "2.0.0-alpha.62-dev-test-size-measurement-runtime";

const SUPPORTED_MUTATION_APPROVALS = new Set([
  WAFL_V2_ALPHA25_MUTATION_APPROVAL,
  WAFL_V2_ALPHA26_MUTATION_APPROVAL,
  WAFL_V2_ALPHA27_MUTATION_APPROVAL,
  WAFL_V2_ALPHA30_MUTATION_APPROVAL,
  WAFL_V2_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_APPROVAL,
  WAFL_V2_ALPHA56_ACCESSORY_LIFECYCLE_PARITY_MUTATION_APPROVAL,
  WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL,
  WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL,
  WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL,
  WAFL_V2_ALPHA61_MOBILE_WORK_ORDER_CREATE_MUTATION_APPROVAL,
  WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL,
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

export function getWorkOrderV2CreateMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA25_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA61_MOBILE_WORK_ORDER_CREATE_MUTATION_APPROVAL
  ) return { ok: false, reason: "work-order-create-mutation-approval-missing" };
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2BasicInfoMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA25_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA52_CORE_INLINE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL
  ) {
    return { ok: false, reason: "basic-info-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2MaterialDraftMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA26_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA50_MATERIAL_DRAFT_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA51_MATERIAL_LIFECYCLE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA52_CORE_INLINE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA56_ACCESSORY_LIFECYCLE_PARITY_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL
  ) {
    return { ok: false, reason: "material-draft-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2ImageMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL
  ) return { ok: false, reason: "work-order-asset-mutation-approval-missing" };
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2SizeColorStructureMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA61_MOBILE_WORK_ORDER_CREATE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL
  ) return { ok: false, reason: "size-color-mutation-approval-missing" };
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2MeasurementMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL,
  });
}

export function getWorkOrderV2DraftChildHardDeleteMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL,
  });
}

export function getWorkOrderV2SizeColorHardDeleteMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL
  ) return { ok: false, reason: "size-color-hard-delete-mutation-approval-missing" };
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2MaterialHardDeleteMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (
    configuredApproval !== WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL
    && configuredApproval !== WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL
  ) return { ok: false, reason: "material-hard-delete-mutation-approval-missing" };
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function isAlpha46BasicInfoMutationRuntime(): boolean {
  return process.env.WAFL_V2_COMMAND_MUTATION_APPROVED === WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL;
}

export function isAlpha59SizeColorStructureMutationRuntime(): boolean {
  return process.env.WAFL_V2_COMMAND_MUTATION_APPROVED === WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL;
}
