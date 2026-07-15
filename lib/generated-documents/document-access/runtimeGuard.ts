import "server-only";

import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

export const WAFL_V2_ALPHA39_DOCUMENT_ACCESS_APPROVAL =
  "2.0.0-alpha.39-dev-test-document-access-runtime";
export const WAFL_V2_ALPHA42_EMBEDDED_QR_APPROVAL =
  "2.0.0-alpha.42-dev-test-realistic-issued-embedded-qr-runtime";

export function getDocumentAccessRuntimeGuard(input?: {
  readonly requireMutationApproval?: boolean;
  readonly mutationPurpose?: "manual_share" | "embedded_qr";
}) {
  if (process.env.WAFL_V2_DOCUMENT_VIEWER_ENABLED !== "1") {
    return { ok: false as const, reason: "document-viewer-disabled" };
  }
  const readGuard = getWorkOrderV2ReadRuntimeGuard();
  if (!readGuard.ok) return readGuard;
  const expectedApproval = input?.mutationPurpose === "embedded_qr"
    ? WAFL_V2_ALPHA42_EMBEDDED_QR_APPROVAL
    : WAFL_V2_ALPHA39_DOCUMENT_ACCESS_APPROVAL;
  if (input?.requireMutationApproval
      && process.env.WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED !== expectedApproval) {
    return { ok: false as const, reason: "document-viewer-mutation-approval-missing" };
  }
  return { ok: true as const, fingerprint: readGuard.fingerprint };
}
