export const MATERIAL_REMOVAL_MODES = [
  "hard_delete",
  "history_preserving_remove",
  "not_allowed",
] as const;

export type MaterialRemovalMode = (typeof MATERIAL_REMOVAL_MODES)[number];

export function resolveMaterialRemovalMode(input: {
  readonly status: string;
  readonly lifecycle: "active" | "archived";
  readonly requestedAt: string | Date | null;
  readonly cancelledAt: string | Date | null;
  readonly completedAt: string | Date | null;
  readonly hasOrderHistory: boolean;
}): MaterialRemovalMode {
  if (input.lifecycle !== "active" || input.status !== "editing") return "not_allowed";
  if (input.requestedAt || input.cancelledAt || input.completedAt || input.hasOrderHistory) {
    return "history_preserving_remove";
  }
  return "hard_delete";
}
