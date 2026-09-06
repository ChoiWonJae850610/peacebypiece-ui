import { requestJson } from "@/lib/apiTransport";

export type WaflInputSheetGeometryEvidenceSurface =
  | "new-recipe"
  | "spec-save-new"
  | "quick-main"
  | "quick-address-direct"
  | "numeric-direct";

export type WaflInputSheetGeometryEvidence = Readonly<Record<string, unknown>> & {
  readonly captureId: string;
  readonly event: string;
  readonly sequence: number;
  readonly surface: WaflInputSheetGeometryEvidenceSurface;
};

let evidenceWriteQueue: Promise<void> = Promise.resolve();

export function isWaflInputSheetGeometryEvidenceEnabled() {
  return __DEV__ && process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true";
}

/**
 * DEV + external-QA-only, ordered, best-effort diagnostic transport.
 * It never participates in input, keyboard, sheet, or business mutation flow.
 */
export function persistWaflInputSheetGeometryEvidence(entry: WaflInputSheetGeometryEvidence) {
  if (!isWaflInputSheetGeometryEvidenceEnabled()) return;
  evidenceWriteQueue = evidenceWriteQueue
    .catch(() => undefined)
    .then(async () => {
      await requestJson<{ readonly ok: true }>("/api/dev/wafl-input-sheet-geometry-evidence", {
        body: { evidence: entry },
        method: "POST",
      });
    })
    .catch((error: unknown) => {
      console.info("[WAFL_INPUT_SHEET_GEOMETRY_EVIDENCE_PERSIST_FAILED]", {
        error: error instanceof Error ? error.name : "UNKNOWN",
        surface: entry.surface,
      });
    });
}
