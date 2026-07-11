import type { EntityVersion, IsoDateTime } from "@/lib/domain/work-orders/contracts/primitives";

export const READINESS_HARD_BLOCKER_CODES = [
  "REPRESENTATIVE_IMAGE_REQUIRED",
  "TOTAL_QUANTITY_REQUIRED",
  "QUANTITY_TOTAL_MISMATCH",
  "MATERIAL_REQUIRED",
  "ACCESSORY_STATE_REQUIRED",
  "DUE_DATE_REQUIRED",
  "PARTNER_REQUIRED",
] as const;

export type ReadinessHardBlockerCode = (typeof READINESS_HARD_BLOCKER_CODES)[number];

export const READINESS_WARNING_CODES = [
  "ACCESSORY_CONFIRM_LATER",
  "QUANTITY_MEMO_FALLBACK",
  "NO_INCLUDED_ATTACHMENT",
  "PROCESS_PARTNER_UNASSIGNED",
] as const;

export type ReadinessWarningCode = (typeof READINESS_WARNING_CODES)[number];

export type ReadinessIssue = {
  readonly code: ReadinessHardBlockerCode | ReadinessWarningCode;
  readonly message: string;
  readonly fieldPath?: string;
};

export type ReadinessReadModel = {
  readonly canIssue: boolean;
  readonly hardBlockers: readonly ReadinessIssue[];
  readonly warnings: readonly ReadinessIssue[];
  readonly checkedAt: IsoDateTime;
  readonly basedOnVersion: EntityVersion;
  readonly source: "server_canonical" | "client_preview";
};
