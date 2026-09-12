import type { GeneratedWorkOrderDocument } from "../../../domain/mobileContract";

export type CurrentRevisionDocumentState = {
  readonly documents: readonly GeneratedWorkOrderDocument[];
  readonly generated: GeneratedWorkOrderDocument | null;
  readonly pending: GeneratedWorkOrderDocument | null;
  readonly failed: GeneratedWorkOrderDocument | null;
  readonly revoked: GeneratedWorkOrderDocument | null;
  readonly deleted: GeneratedWorkOrderDocument | null;
  readonly state: "generated" | "pending" | "failed" | "revoked" | "deleted" | "none";
};

export type CurrentGeneratedArtifactHealth = "unknown" | "healthy" | "missing" | "corrupt" | "transient_error";

export type CurrentRevisionDocumentWorkbenchModel = CurrentRevisionDocumentState & {
  readonly artifactHealth: CurrentGeneratedArtifactHealth;
  readonly artifactUnavailable: boolean;
  readonly canView: boolean;
  readonly canSave: boolean;
  readonly canShare: boolean;
  readonly canRetry: boolean;
  readonly viewDocumentId: string | null;
  readonly saveDocumentId: string | null;
  readonly shareDocumentId: string | null;
  readonly viewerDocumentId: string | null;
  readonly tokenDocumentId: string | null;
  readonly viewTarget: GeneratedWorkOrderDocument | null;
  readonly saveTarget: GeneratedWorkOrderDocument | null;
  readonly shareTarget: GeneratedWorkOrderDocument | null;
  readonly viewerTarget: GeneratedWorkOrderDocument | null;
  readonly tokenTarget: GeneratedWorkOrderDocument | null;
  readonly retryTarget: GeneratedWorkOrderDocument | null;
};

/**
 * Resolves actionable document state for exactly one WorkOrder Revision.
 * The endpoint is newest-first, so filtering preserves its canonical order.
 */
export function resolveCurrentRevisionDocumentState(
  documents: readonly GeneratedWorkOrderDocument[],
  currentRevisionId: string,
): CurrentRevisionDocumentState {
  const currentRevisionDocuments = [...documents.filter((document) => document.revisionId === currentRevisionId)]
    .sort((left, right) => right.generationNumber - left.generationNumber || right.id.localeCompare(left.id));
  const current = currentRevisionDocuments[0] ?? null;
  const generated = current?.status === "generated" ? current : null;
  const pending = current?.status === "pending" ? current : null;
  const failed = current?.status === "failed" ? current : null;
  const revoked = current?.status === "revoked" ? current : null;
  const deleted = current?.status === "deleted" ? current : null;

  return {
    documents: currentRevisionDocuments,
    generated,
    pending,
    failed,
    revoked,
    deleted,
    state: generated ? "generated" : pending ? "pending" : failed ? "failed" : revoked ? "revoked" : deleted ? "deleted" : "none",
  };
}

/**
 * Binds every document action to the exact current-Revision projection.
 * The production Workbench and the DEV physical-QA harness share this owner.
 */
export function resolveCurrentRevisionDocumentWorkbenchModel(
  documents: readonly GeneratedWorkOrderDocument[],
  currentRevisionId: string,
  artifactHealth: CurrentGeneratedArtifactHealth = "healthy",
): CurrentRevisionDocumentWorkbenchModel {
  const state = resolveCurrentRevisionDocumentState(documents, currentRevisionId);
  const generated = state.generated;
  const artifactUnavailable = artifactHealth === "missing" || artifactHealth === "corrupt";
  const canUseGenerated = generated !== null && !artifactUnavailable && artifactHealth !== "unknown";

  return {
    ...state,
    artifactHealth,
    artifactUnavailable,
    canView: canUseGenerated,
    canSave: canUseGenerated,
    canShare: canUseGenerated,
    canRetry: (generated === null && state.failed !== null) || (generated !== null && artifactUnavailable),
    viewDocumentId: canUseGenerated ? generated.id : null,
    saveDocumentId: canUseGenerated ? generated.id : null,
    shareDocumentId: canUseGenerated ? generated.id : null,
    viewerDocumentId: canUseGenerated ? generated.id : null,
    tokenDocumentId: canUseGenerated ? generated.id : null,
    viewTarget: canUseGenerated ? generated : null,
    saveTarget: canUseGenerated ? generated : null,
    shareTarget: canUseGenerated ? generated : null,
    viewerTarget: canUseGenerated ? generated : null,
    tokenTarget: canUseGenerated ? generated : null,
    retryTarget: artifactUnavailable ? generated : generated === null ? state.failed : null,
  };
}
