import "server-only";

import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";
import {
  isMakerQaCapabilityEnabled,
  MAKER_QA_APPROVAL,
  MAKER_QA_CAPABILITY,
} from "@/lib/external-qa/makerQaCapabilities.mjs";

export const WAFL_V2_ALPHA25_MUTATION_APPROVAL =
  "2.0.0-alpha.25-dev-test-command-runtime";
export const WAFL_V2_ALPHA26_MUTATION_APPROVAL =
  "2.0.0-alpha.26-dev-test-material-command-runtime";
export const WAFL_V2_ALPHA27_MUTATION_APPROVAL =
  "2.0.0-alpha.27-dev-test-revision-issue-runtime";
export const WAFL_V2_ALPHA30_MUTATION_APPROVAL =
  "2.0.0-alpha.30-dev-test-factory-instruction-runtime";
export const WAFL_V2_ALPHA46_BASIC_INFO_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA46;
export const WAFL_V2_ALPHA50_MATERIAL_DRAFT_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA50;
export const WAFL_V2_ALPHA51_MATERIAL_LIFECYCLE_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA51;
export const WAFL_V2_ALPHA52_CORE_INLINE_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA52;
export const WAFL_V2_ALPHA55_MATERIAL_ORDER_LIFECYCLE_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA55;
export const WAFL_V2_ALPHA56_ACCESSORY_LIFECYCLE_PARITY_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA56;
export const WAFL_V2_ALPHA57_WORK_ORDER_IMAGE_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA57;
export const WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA59;
export const WAFL_V2_ALPHA60_DRAFT_CHILD_HARD_DELETE_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA60;
export const WAFL_V2_ALPHA61_MOBILE_WORK_ORDER_CREATE_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA61;
export const WAFL_V2_ALPHA62_MEASUREMENT_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA62;
export const WAFL_V2_ALPHA64_DOCUMENT_R0_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA64_CURRENT;
export const WAFL_V2_ALPHA65_PRODUCTION_AUTHORING_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA65_CURRENT;
export const WAFL_V2_ALPHA67_NTH_REORDER_MUTATION_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA67_CURRENT;

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
  WAFL_V2_ALPHA64_DOCUMENT_R0_MUTATION_APPROVAL,
  WAFL_V2_ALPHA65_PRODUCTION_AUTHORING_MUTATION_APPROVAL,
  WAFL_V2_ALPHA67_NTH_REORDER_MUTATION_APPROVAL,
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
  if (configuredApproval !== WAFL_V2_ALPHA25_MUTATION_APPROVAL
    && !isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.WORK_ORDER_CREATE)) {
    return { ok: false, reason: "work-order-create-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2BasicInfoMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (configuredApproval !== WAFL_V2_ALPHA25_MUTATION_APPROVAL
    && !isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.BASIC_INFO)) {
    return { ok: false, reason: "basic-info-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2MaterialDraftMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (configuredApproval !== WAFL_V2_ALPHA26_MUTATION_APPROVAL
    && !isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.MATERIAL_DRAFT)) {
    return { ok: false, reason: "material-draft-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2MaterialOrderMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (configuredApproval !== WAFL_V2_ALPHA26_MUTATION_APPROVAL
    && !isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.MATERIAL_ORDER)) {
    return { ok: false, reason: "material-order-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2ImageMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.ASSET_AUTHORING)) {
    return { ok: false, reason: "work-order-asset-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2SizeColorStructureMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.SIZE_COLOR_STRUCTURE)) {
    return { ok: false, reason: "size-color-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2MeasurementMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.MEASUREMENT)) {
    return { ok: false, reason: "measurement-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2ProductionMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.PRODUCTION_AUTHORING)) {
    return { ok: false, reason: "production-authoring-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({ requireMutationApproval: true, requiredMutationApproval: configuredApproval });
}

export function getWorkOrderV2DocumentR0MutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.DOCUMENT_R0)) {
    return { ok: false, reason: "document-r0-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2ReorderMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.REORDER_CREATE)) {
    return { ok: false, reason: "reorder-create-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({ requireMutationApproval: true, requiredMutationApproval: configuredApproval });
}

export function getWorkOrderV2DraftChildHardDeleteMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.WORK_ORDER_DRAFT_DELETE)) {
    return { ok: false, reason: "work-order-draft-delete-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2SizeColorHardDeleteMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.SIZE_COLOR_HARD_DELETE)) {
    return { ok: false, reason: "size-color-hard-delete-mutation-approval-missing" };
  }
  return getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval: configuredApproval,
  });
}

export function getWorkOrderV2MaterialHardDeleteMutationRuntimeGuard(): WorkOrderV2CommandRuntimeGuard {
  const configuredApproval = process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "";
  if (!isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.MATERIAL_HARD_DELETE)) {
    return { ok: false, reason: "material-hard-delete-mutation-approval-missing" };
  }
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
