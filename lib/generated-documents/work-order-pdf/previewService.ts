import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type { CompanyId, CompanyMemberId, CorrelationId, TenantMemberScope, WorkOrderId, WorkOrderRevisionId } from "@/lib/domain/work-orders/contracts";
import { getIssuedWorkOrderPreviewV2 } from "@/lib/domain/work-orders/read/previewRepository";
import {
  loadWorkOrderPdfAssetManifest,
  readWorkOrderPdfAsset,
} from "./generationService";
// @ts-expect-error Canonical renderer is an ESM .mts module loaded by the Node route runtime.
import { LocalChromiumIssuedWorkOrderPdfRenderer } from "./localChromiumRenderer.mts";
import { removeLocalIssuedPdfRenderInput, writeLocalIssuedPdfRenderInput } from "./localRenderInput";
import { createWorkOrderIssuedPdfSnapshot, hashWorkOrderIssuedPdfSnapshot, serializeWorkOrderIssuedPdfSnapshot } from "./snapshot";
import { WORK_ORDER_PDF_MAX_FILE_SIZE_BYTES } from "./constants";
import { WORK_ORDER_PDF_INLINE_IMAGE_MIME_TYPES } from "@/lib/workorder/persistence/imageAssetIntegrity.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUPPORTED_INLINE_IMAGE = new Set(WORK_ORDER_PDF_INLINE_IMAGE_MIME_TYPES);

export class WorkOrderPdfPreviewError extends Error {
  constructor(readonly code: "NOT_FOUND" | "FORBIDDEN" | "RENDER_FAILED", readonly status: number, message: string) {
    super(message);
    this.name = "WorkOrderPdfPreviewError";
  }
}

function tenantScope(input: { companyId: string; companyMemberId: string | null; correlationId: string }): TenantMemberScope {
  if (!input.companyMemberId) throw new WorkOrderPdfPreviewError("FORBIDDEN", 403, "활성 회사 멤버가 필요합니다.");
  return { mode: "tenant_member", companyId: input.companyId as CompanyId, companyMemberId: input.companyMemberId as CompanyMemberId, permissionCodes: ["workorder.read"], correlationId: input.correlationId as CorrelationId };
}

export async function renderDraftWorkOrderPdfPreview(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
  readonly workOrderId: string;
  readonly revisionId: string;
}): Promise<Buffer> {
  if (!UUID.test(input.workOrderId) || !UUID.test(input.revisionId)) throw new WorkOrderPdfPreviewError("NOT_FOUND", 404, "작업지시서를 찾을 수 없습니다.");
  const scope = tenantScope({ companyId: input.scope.companyId, companyMemberId: input.companyMemberId, correlationId: input.correlationId });
  const preview = await getIssuedWorkOrderPreviewV2({ scope, workOrderId: input.workOrderId as WorkOrderId, revisionId: input.revisionId as WorkOrderRevisionId, assignedCompanyMemberId: input.scope.visibility?.mode === "assigned" ? input.scope.visibility.companyMemberId : null, mode: "draft_preview" });
  if (!preview.data) throw new WorkOrderPdfPreviewError("NOT_FOUND", 404, "작성 중인 작업지시서를 찾을 수 없습니다.");
  const assets = await loadWorkOrderPdfAssetManifest(scope, input.revisionId);
  const snapshot = createWorkOrderIssuedPdfSnapshot({ companyId: input.scope.companyId, requestedWorkOrderId: input.workOrderId, requestedRevisionId: input.revisionId, documentType: "factory_instruction", preview: preview.data, assetManifest: assets, snapshotCreatedAt: new Date().toISOString() });
  const representative = assets.find((asset) => asset.assetType === "image" && asset.isRepresentative);
  const representativeImageDataUrl = representative ? await readWorkOrderPdfAsset(representative) : null;
  const includedAttachmentImages = await Promise.all(assets.filter((asset) => asset.assetType === "attachment" && asset.includeInDocument && SUPPORTED_INLINE_IMAGE.has(asset.mimeType)).map(async (asset) => ({ filename: asset.filename, dataUrl: await readWorkOrderPdfAsset(asset) })));
  const canonicalSnapshotJson = serializeWorkOrderIssuedPdfSnapshot(snapshot);
  const snapshotSha256 = hashWorkOrderIssuedPdfSnapshot(snapshot);
  const runToken = randomBytes(16).toString("hex");
  const objectKeyPlan = `companies/${input.scope.companyId}/workorders/${input.workOrderId}/pdf/preview-${runToken}.pdf`;
  try {
    await writeLocalIssuedPdfRenderInput(runToken, { snapshot, canonicalSnapshotJson, snapshotSha256, objectKeyPlan, representativeImageDataUrl, includedAttachmentImages });
    const renderOrigin = process.env.WAFL_PDF_RENDER_ORIGIN?.trim() || "http://127.0.0.1:3100";
    const rendered = await new LocalChromiumIssuedWorkOrderPdfRenderer().render({ snapshot, canonicalSnapshotJson, snapshotSha256, renderUrl: `${renderOrigin}/dev/workorder-pdf-render/${runToken}`, outputFileName: `${snapshot.documentIdentity.displayDocumentNumber}.pdf`, options: { printBackground: true, preferCssPageSize: true, maxFileSizeBytes: WORK_ORDER_PDF_MAX_FILE_SIZE_BYTES } });
    if (createHash("sha256").update(rendered.pdf).digest("hex") !== rendered.contentSha256) throw new Error("PDF_PREVIEW_HASH_INVALID");
    return rendered.pdf;
  } catch {
    throw new WorkOrderPdfPreviewError("RENDER_FAILED", 500, "PDF 미리보기를 만들지 못했습니다.");
  } finally {
    await removeLocalIssuedPdfRenderInput(runToken);
  }
}
