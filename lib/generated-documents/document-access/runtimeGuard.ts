import "server-only";

import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";
import {
  isMakerQaCapabilityEnabled,
  MAKER_QA_APPROVAL,
  MAKER_QA_CAPABILITY,
} from "@/lib/external-qa/makerQaCapabilities.mjs";

export const WAFL_V2_ALPHA39_DOCUMENT_ACCESS_APPROVAL =
  "2.0.0-alpha.39-dev-test-document-access-runtime";
export const WAFL_V2_ALPHA42_EMBEDDED_QR_APPROVAL =
  "2.0.0-alpha.42-dev-test-realistic-issued-embedded-qr-runtime";
export const WAFL_V2_ALPHA64_DOCUMENT_ACCESS_APPROVAL =
  MAKER_QA_APPROVAL.ALPHA64_CURRENT;

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
  const currentMakerDocumentApproved = isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.DOCUMENT_R0);
  if (input?.requireMutationApproval
      && process.env.WAFL_V2_DOCUMENT_VIEWER_MUTATION_APPROVED !== expectedApproval
      && !currentMakerDocumentApproved) {
    return { ok: false as const, reason: "document-viewer-mutation-approval-missing" };
  }
  return { ok: true as const, fingerprint: readGuard.fingerprint };
}
