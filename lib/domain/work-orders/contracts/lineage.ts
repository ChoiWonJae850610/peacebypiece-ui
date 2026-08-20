export const WORK_ORDER_DERIVATION_KINDS = ["original", "reorder", "rework"] as const;
export type WorkOrderDerivationKind = (typeof WORK_ORDER_DERIVATION_KINDS)[number];

export const WORK_ORDER_CHARACTER_FILTERS = ["all", "production", "sample"] as const;
export type WorkOrderCharacterFilter = (typeof WORK_ORDER_CHARACTER_FILTERS)[number];

export const WORK_ORDER_LINEAGE_FILTERS = ["reorder", "rework"] as const;
export type WorkOrderLineageFilter = (typeof WORK_ORDER_LINEAGE_FILTERS)[number];

export function normalizeWorkOrderLineageFilters(filters: readonly WorkOrderLineageFilter[]): readonly WorkOrderLineageFilter[] {
  const selected = new Set(filters);
  return WORK_ORDER_LINEAGE_FILTERS.filter((filter) => selected.has(filter));
}

export function matchesWorkOrderIdentityFilters(
  identity: Pick<WorkOrderIdentityReadModel, "isSample" | "derivationKind" | "reorderRound">,
  character: WorkOrderCharacterFilter,
  lineage: readonly WorkOrderLineageFilter[],
): boolean {
  if (!isValidWorkOrderSampleLineage(identity)) return false;
  const characterMatches = character === "all"
    || (character === "production" && !identity.isSample)
    || (character === "sample" && identity.isSample);
  const normalizedLineage = normalizeWorkOrderLineageFilters(lineage);
  const lineageMatches = normalizedLineage.length === 0
    || (normalizedLineage.includes("reorder") && identity.reorderRound >= 1)
    || (normalizedLineage.includes("rework") && identity.derivationKind === "rework");
  return characterMatches && lineageMatches;
}

export type WorkOrderIdentityReadModel = {
  readonly isSample: boolean;
  readonly derivationKind: WorkOrderDerivationKind;
  readonly reorderRound: number;
  readonly sourceWorkOrderId: string | null;
  readonly sourceRevisionId: string | null;
  readonly seriesRootWorkOrderId: string | null;
};

export function isValidWorkOrderSampleLineage(
  identity: Pick<WorkOrderIdentityReadModel, "isSample" | "derivationKind" | "reorderRound">,
): boolean {
  return !identity.isSample || (identity.derivationKind !== "reorder" && identity.reorderRound === 0);
}

export function canSetWorkOrderSample(
  identity: Pick<WorkOrderIdentityReadModel, "derivationKind" | "reorderRound">,
): boolean {
  return identity.derivationKind !== "reorder" && identity.reorderRound === 0;
}

export function workOrderIdentityBadgeLabels(identity: Pick<WorkOrderIdentityReadModel, "isSample" | "derivationKind" | "reorderRound">): readonly string[] {
  if (!isValidWorkOrderSampleLineage(identity)) return [];
  return [
    identity.isSample ? "샘플" : null,
    identity.reorderRound > 0 ? `${identity.reorderRound}차 리오더` : null,
    identity.derivationKind === "rework" ? "재작업" : null,
  ].filter((label): label is string => label !== null);
}
