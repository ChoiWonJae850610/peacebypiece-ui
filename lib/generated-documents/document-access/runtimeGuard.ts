import "server-only";

import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

export const WAFL_V2_ALPHA39_DOCUMENT_ACCESS_APPROVAL =
  "2.0.0-alpha.39-dev-test-document-access-runtime";

export function getDocumentAccessRuntimeGuard(input?: { readonly requireMutationApproval?: boolean }) {
  if (process.env.WAFL_V2_DOCUMENT_VIEWER_ENABLED !== "1") {
    return { ok: false as const, reason: "document-viewer-disabled" };
  }
  const readGuard = getWorkOrderV2ReadRuntimeGuard();
  if (!readGuard.ok) return readGuard;
  if (input?.requireMutationApproval
      && process.env.WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED !== WAFL_V2_ALPHA39_DOCUMENT_ACCESS_APPROVAL) {
    return { ok: false as const, reason: "document-viewer-mutation-approval-missing" };
  }
  return { ok: true as const, fingerprint: readGuard.fingerprint };
}
