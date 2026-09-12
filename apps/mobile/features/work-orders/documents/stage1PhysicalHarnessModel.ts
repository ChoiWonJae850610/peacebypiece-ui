import type {
  DocumentAccessTokenSummary,
  GeneratedWorkOrderDocument,
} from "../../../domain/mobileContract";
import {
  resolveCurrentRevisionDocumentWorkbenchModel,
  type CurrentRevisionDocumentWorkbenchModel,
} from "./currentRevisionDocumentState";

export type A79Stage1HarnessState = "none" | "pending" | "failed" | "generated";

export type A79Stage1HarnessToken = {
  readonly documentId: string;
  readonly token: DocumentAccessTokenSummary;
};

export type A79Stage1HarnessScenario = {
  readonly currentRevisionId: "rev-b-current";
  readonly documents: readonly GeneratedWorkOrderDocument[];
  readonly allTokens: readonly A79Stage1HarnessToken[];
  readonly currentTokens: readonly DocumentAccessTokenSummary[];
  readonly model: CurrentRevisionDocumentWorkbenchModel;
};

export function isA79Stage1PhysicalHarnessEnabled(input: {
  readonly dev: boolean;
  readonly externalQa: string | undefined;
}): boolean {
  return input.dev && input.externalQa?.trim().toLowerCase() === "true";
}

function document(
  id: string,
  revisionId: string,
  status: GeneratedWorkOrderDocument["status"],
  generationNumber: number,
): GeneratedWorkOrderDocument {
  const generated = status === "generated";
  return {
    id,
    revisionId,
    documentType: "factory_instruction",
    generationNumber,
    displayDocumentNumber: id,
    status,
    fileSizeBytes: generated ? 128_000 : null,
    generatedAt: generated ? "2026-09-12T00:00:00.000Z" : null,
    accessTokenAvailable: generated,
    inlineUrl: generated ? `/dev-only/a79/${id}` : null,
    downloadUrl: generated ? `/dev-only/a79/${id}?download=1` : null,
  };
}

function token(tokenId: string): DocumentAccessTokenSummary {
  return {
    tokenId,
    tokenPurpose: "manual_share",
    createdAt: "2026-09-12T00:00:00.000Z",
    expiresAt: "2026-09-15T00:00:00.000Z",
    revokedAt: null,
    lastAccessedAt: null,
    accessCount: 0,
    status: "active",
  };
}

export function resolveA79Stage1PhysicalHarnessScenario(
  state: A79Stage1HarnessState,
  environment: { readonly dev: boolean; readonly externalQa: string | undefined },
): A79Stage1HarnessScenario | null {
  if (!isA79Stage1PhysicalHarnessEnabled(environment)) return null;

  const currentRevisionId = "rev-b-current" as const;
  const historical = document("doc-a-generated", "rev-a-historical", "generated", 1);
  const current = state === "none"
    ? null
    : document(`doc-b-${state}`, currentRevisionId, state, 2);
  const documents = current ? [current, historical] : [historical];
  const allTokens: readonly A79Stage1HarnessToken[] = [
    { documentId: historical.id, token: token("token-a-historical") },
    ...(state === "generated"
      ? [{ documentId: "doc-b-generated", token: token("token-b-current") }]
      : []),
  ];
  const model = resolveCurrentRevisionDocumentWorkbenchModel(documents, currentRevisionId);

  return {
    currentRevisionId,
    documents,
    allTokens,
    currentTokens: model.tokenDocumentId
      ? allTokens.filter((item) => item.documentId === model.tokenDocumentId).map((item) => item.token)
      : [],
    model,
  };
}
