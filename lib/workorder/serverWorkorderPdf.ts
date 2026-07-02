import "server-only";

import { buildOrderRequestServerPdf } from "@/lib/workorder/serverOrderRequestPdf";
import type { WorkOrderSizeSpec, WorkOrderPdfKind } from "@/lib/workorder/sizeSpec/types";
import type { WorkOrder } from "@/types/workorder";

function safeText(value: unknown): string {
  return String(value ?? "")
    .replace(/[<&>"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" }[char] ?? char))
    .trim();
}

function valueFor(spec: WorkOrderSizeSpec, sizeCode: string, pomCode: string) {
  return spec.values.find((value) => value.sizeCode === sizeCode && value.pomCode === pomCode)?.displayValue || "-";
}

export function getWorkorderPdfMissingItems(input: {
  workOrder: WorkOrder;
  sizeSpec: WorkOrderSizeSpec;
}): string[] {
  const missing: string[] = [];
  if (!input.workOrder.title?.trim()) missing.push("작업지시서명");
  if (!input.workOrder.dueDate?.trim()) missing.push("납기일");
  if (input.sizeSpec.sizes.length === 0) missing.push("사이즈 세트");
  if (input.sizeSpec.poms.length === 0) missing.push("POM 항목");
  if (input.sizeSpec.values.length === 0) missing.push("치수 값");
  return missing;
}

export function buildWorkorderPdfHtml(input: {
  workOrder: WorkOrder;
  companyName?: string | null;
  sizeSpec: WorkOrderSizeSpec;
  kind: WorkOrderPdfKind;
  missingItems: string[];
}) {
  const watermark = input.kind === "incomplete" ? "INCOMPLETE" : "FINAL";
  const statusLabel = input.kind === "incomplete" ? "미완성 작업지시서" : "최종 작업지시서";
  const missingList = input.missingItems.length > 0
    ? input.missingItems.map((item) => `<li>${safeText(item)}</li>`).join("")
    : "<li>없음</li>";
  const sizeHeaders = input.sizeSpec.sizes.map((size) => `<th>${safeText(size.displayLabel)}</th>`).join("");
  const rows = input.sizeSpec.poms.map((pom) => {
    const cells = input.sizeSpec.sizes
      .map((size) => `<td>${safeText(valueFor(input.sizeSpec, size.code, pom.code))}</td>`)
      .join("");
    return `<tr><th><strong>${safeText(pom.displayName)}</strong><span>${safeText(pom.measurementType)}</span><small>${safeText(pom.instruction ?? "")}</small></th>${cells}</tr>`;
  }).join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${safeText(input.workOrder.title)} ${statusLabel}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: Arial, sans-serif; color: #17212f; }
    .watermark { position: fixed; top: 42%; left: 8%; transform: rotate(-22deg); font-size: 72px; color: rgba(180, 40, 40, 0.11); font-weight: 800; letter-spacing: 0.12em; }
    header { border-bottom: 2px solid #17212f; padding-bottom: 12px; margin-bottom: 18px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    .badge { display: inline-block; border: 1px solid #17212f; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; margin: 16px 0; font-size: 13px; }
    .label { color: #5c6775; font-weight: 700; }
    .missing { border: 1px solid #e3b6b6; background: #fff6f6; padding: 10px 14px; margin: 14px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    th, td { border: 1px solid #cbd4df; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #f3f6fa; }
    th span, th small { display: block; color: #667085; font-weight: 400; margin-top: 2px; }
    footer { position: fixed; bottom: 8mm; left: 16mm; right: 16mm; color: #667085; font-size: 10px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="watermark">${watermark}</div>
  <header>
    <span class="badge">${statusLabel}</span>
    <h1>${safeText(input.workOrder.title)}</h1>
    <p>이 문서는 supplier order-request PDF와 분리된 작업지시서 PDF입니다.</p>
  </header>
  <section class="meta">
    <div><span class="label">회사</span><br/>${safeText(input.companyName || "-")}</div>
    <div><span class="label">담당자</span><br/>${safeText(input.workOrder.manager)}</div>
    <div><span class="label">납기일</span><br/>${safeText(input.workOrder.dueDate || "-")}</div>
    <div><span class="label">치수 단위</span><br/>${safeText(input.sizeSpec.measurementUnit)}</div>
    <div><span class="label">사이즈 세트</span><br/>${safeText(input.sizeSpec.sizeSetCode || "-")}</div>
    <div><span class="label">상태</span><br/>${safeText(input.workOrder.workflowState)}</div>
  </section>
  <section class="missing">
    <strong>누락 항목</strong>
    <ul>${missingList}</ul>
  </section>
  <section>
    <h2>Size specification</h2>
    <table>
      <thead><tr><th>POM</th>${sizeHeaders}</tr></thead>
      <tbody>${rows || "<tr><td colspan=\"2\">치수표가 없습니다.</td></tr>"}</tbody>
    </table>
  </section>
  <footer><span>WAFL workorder PDF</span><span>${statusLabel}</span></footer>
</body>
</html>`;
}

export function buildWorkorderFallbackPdf(input: {
  workOrder: WorkOrder;
  kind: WorkOrderPdfKind;
  missingItems: string[];
}) {
  const requestNote = [
    input.kind === "final" ? "FINAL WORKORDER PDF" : "INCOMPLETE WORKORDER PDF",
    input.missingItems.length > 0 ? `Missing: ${input.missingItems.join(", ")}` : "Missing: none",
  ].join("\n");

  return buildOrderRequestServerPdf({
    workOrder: input.workOrder,
    requestNote,
  });
}
