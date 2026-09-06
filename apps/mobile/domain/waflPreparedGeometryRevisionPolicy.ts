export type WaflPreparedGeometryChange =
  | "bodyCoordinate"
  | "footerMeasurement"
  | "headerMeasurement"
  | "intrinsicBodyMeasurement"
  | "runtimeKeyboardInset"
  | "runtimeScrollMetrics"
  | "semanticRegistry"
  | "windowLayout";

const STRUCTURAL_CHANGES = new Set<WaflPreparedGeometryChange>([
  "bodyCoordinate",
  "footerMeasurement",
  "headerMeasurement",
  "intrinsicBodyMeasurement",
  "semanticRegistry",
  "windowLayout",
]);

export function resolveWaflPreparedGeometryRevision(current: number, change: WaflPreparedGeometryChange) {
  return STRUCTURAL_CHANGES.has(change) ? current + 1 : current;
}

export function resolveWaflPreparedGeometryRecaptureDecision(input: {
  readonly currentGeometryRevision: number;
  readonly currentRegistryRevision: number;
  readonly dismissing: boolean;
  readonly keyboardMode: "default" | "directInput";
  readonly openGeneration: number;
  readonly openReady: boolean;
  readonly rendered: boolean;
  readonly snapshot: {
    readonly generation: number;
    readonly geometryRevision: number;
    readonly registryRevision: number;
  } | null;
  readonly visible: boolean;
}) {
  const eligible = input.keyboardMode === "directInput"
    && input.visible
    && input.rendered
    && input.openReady
    && !input.dismissing
    && input.openGeneration > 0;
  const current = input.snapshot !== null
    && input.snapshot.generation === input.openGeneration
    && input.snapshot.geometryRevision === input.currentGeometryRevision
    && input.snapshot.registryRevision === input.currentRegistryRevision;
  return {
    bodyMutation: 0,
    capture: eligible && !current,
    reason: !eligible ? "INELIGIBLE" : current ? "CURRENT" : "STRUCTURAL_REFRESH",
    rootMutation: 0,
  } as const;
}
