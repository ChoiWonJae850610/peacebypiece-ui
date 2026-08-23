import type { ReadinessIssue } from "@/lib/domain/work-orders/contracts/readiness";
import { resolveWorkOrderDocumentItemSegment } from "./documentNumberSegmentPolicy.mjs";

export type WorkOrderIssueReadinessFacts = {
  readonly productName: string | null;
  readonly productTypeCode: string | null;
  readonly seasonCode: string | null;
  readonly itemCode: string | null;
  readonly dueDate: string | null;
  readonly companyDocumentCode: string | null;
  readonly workOrderTotal: number;
  readonly revisionTotal: number;
  readonly matrixTotal: number;
  readonly representativeImageCount: number;
  readonly fabricCount: number;
  readonly accessoryCount: number;
  readonly materialOptionalDetailIncompleteCount?: number;
  readonly includedAttachmentCount: number;
  readonly basicProcessCount: number;
  readonly basicProcessStatus: "ready" | "in_progress" | "completed" | null;
};

const blocker = (code: ReadinessIssue["code"], message: string, fieldPath?: string): ReadinessIssue => ({
  code,
  message,
  ...(fieldPath ? { fieldPath } : {}),
});

function present(value: string | null): boolean {
  return Boolean(value?.trim());
}

export function evaluateWorkOrderIssueReadiness(facts: WorkOrderIssueReadinessFacts): {
  readonly canIssue: boolean;
  readonly issues: readonly ReadinessIssue[];
  readonly hardBlockers: readonly ReadinessIssue[];
  readonly warnings: readonly ReadinessIssue[];
} {
  const hardBlockers: ReadinessIssue[] = [];
  if (!present(facts.productName)) hardBlockers.push(blocker("PRODUCT_NAME_REQUIRED", "제품명이 필요합니다.", "productName"));
  if (!present(facts.productTypeCode)) hardBlockers.push(blocker("PRODUCT_TYPE_REQUIRED", "제품 종류가 필요합니다.", "productTypeCode"));
  if (!present(facts.seasonCode)) hardBlockers.push(blocker("SEASON_REQUIRED", "시즌이 필요합니다.", "seasonCode"));
  if (!resolveWorkOrderDocumentItemSegment(facts)) hardBlockers.push(blocker("ITEM_REQUIRED", "세부 품목이 필요합니다.", "itemCode"));
  if (!facts.dueDate) hardBlockers.push(blocker("DUE_DATE_REQUIRED", "납기일이 필요합니다.", "dueDate"));
  if (!present(facts.companyDocumentCode)) hardBlockers.push(blocker("COMPANY_DOCUMENT_CODE_REQUIRED", "회사 문서 코드가 필요합니다."));
  if (facts.representativeImageCount < 1) hardBlockers.push(blocker("REPRESENTATIVE_IMAGE_REQUIRED", "대표 이미지가 필요합니다."));
  if (facts.matrixTotal < 1) hardBlockers.push(blocker("TOTAL_QUANTITY_REQUIRED", "입력된 생산 수량이 필요합니다."));
  if (facts.workOrderTotal !== facts.matrixTotal || facts.revisionTotal !== facts.matrixTotal) {
    hardBlockers.push(blocker("QUANTITY_TOTAL_MISMATCH", "수량표와 작업지시서 합계를 다시 확인해 주세요."));
  }
  if (facts.basicProcessCount < 1) {
    hardBlockers.push(blocker("BASIC_PROCESS_REQUIRED", "기본 공정을 추가해 주세요.", "processes"));
  } else if (facts.basicProcessStatus === "ready" || facts.basicProcessStatus === null) {
    hardBlockers.push(blocker("BASIC_PROCESS_ORDER_REQUIRED", "기본 공정 발주요청을 완료해 주세요.", "processes"));
  }

  const warnings: ReadinessIssue[] = [];
  if (facts.fabricCount < 1) warnings.push(blocker("MATERIAL_MISSING_WARNING", "원단이 등록되지 않았습니다. 필요한 경우 발행 후에도 확인해 주세요."));
  if (facts.accessoryCount < 1) warnings.push(blocker("ACCESSORY_MISSING_WARNING", "부자재가 등록되지 않았습니다. 필요한 경우 발행 후에도 확인해 주세요."));
  if ((facts.materialOptionalDetailIncompleteCount ?? 0) > 0) warnings.push(blocker("MATERIAL_OPTIONAL_DETAIL_WARNING", "원부자재의 선택 정보를 나중에 확인해 주세요."));
  if (facts.includedAttachmentCount < 1) warnings.push(blocker("NO_INCLUDED_ATTACHMENT", "문서에 포함할 첨부파일이 없습니다."));
  return { canIssue: hardBlockers.length === 0, issues: [...hardBlockers, ...warnings], hardBlockers, warnings };
}
