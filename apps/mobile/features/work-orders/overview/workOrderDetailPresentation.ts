export type WorkOrderTabVisualState = "active" | "inactive" | "locked";

export function readOnlyBadgeLabel(canEdit: boolean): "읽기 전용" | null {
  return canEdit ? null : "읽기 전용";
}

export function resolveWorkOrderTabVisualState(input: {
  readonly selected: boolean;
  readonly locked: boolean;
}): WorkOrderTabVisualState {
  if (input.locked) return "locked";
  return input.selected ? "active" : "inactive";
}
