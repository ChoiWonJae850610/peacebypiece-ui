import type { MaterialType } from "@/domain/mobileContract";

export type WorkOrderVisibleSection = "overview" | "media" | "sizes" | "materials" | "production" | "output";
export type WorkOrderSectionIntent = WorkOrderVisibleSection | MaterialType;

export type ResolvedWorkOrderSectionIntent = {
  readonly section: WorkOrderVisibleSection;
  readonly materialFocus: MaterialType | null;
};

/** Keeps historical fabric/accessory navigation intents compatible with the combined presentation tab. */
export function resolveWorkOrderSectionIntent(intent: WorkOrderSectionIntent): ResolvedWorkOrderSectionIntent {
  if (intent === "fabric" || intent === "accessory") return { section: "materials", materialFocus: intent };
  return { section: intent, materialFocus: null };
}
