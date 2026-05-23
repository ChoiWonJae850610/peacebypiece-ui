import "server-only";

import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { Material, Outsourcing, WorkOrder } from "@/types/workorder";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value: number | null | undefined): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0원";
  return `${numeric.toLocaleString("ko-KR")}원`;
}

function formatQuantity(value: number | null | undefined, unit?: string | null): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return `${numeric.toLocaleString("ko-KR")}${unit ? ` ${unit}` : ""}`;
}

function materialAmount(item: Material): number {
  return Number(item.totalCost || item.quantity * item.unitCost || 0);
}

function outsourcingAmount(item: Outsourcing): number {
  return Number(item.totalCost || item.quantity * item.unitCost || 0);
}

function rowsOrEmpty(rows: string, colSpan: number): string {
  return rows || `<tr><td class="empty" colspan="${colSpan}">등록된 항목이 없습니다.</td></tr>`;
}

function materialRows(items: Material[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.vendor || "-")}</td>
          <td>${escapeHtml(item.name || "-")}</td>
          <td class="num">${escapeHtml(formatQuantity(item.quantity))}</td>
          <td>${escapeHtml(item.unit || "-")}</td>
          <td class="num">${escapeHtml(formatMoney(item.unitCost))}</td>
          <td class="num">${escapeHtml(formatMoney(materialAmount(item)))}</td>
        </tr>`,
    )
    .join("");
}

function outsourcingRows(items: Outsourcing[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.vendor || "-")}</td>
          <td>${escapeHtml(item.process || "-")}</td>
          <td class="num">${escapeHtml(formatQuantity(item.quantity))}</td>
          <td class="num">${escapeHtml(formatMoney(item.unitCost))}</td>
          <td class="num">${escapeHtml(formatMoney(outsourcingAmount(item)))}</td>
        </tr>`,
    )
    .join("");
}

export function buildOrderRequestHtmlDocument(input: {
  workOrder: WorkOrder;
  requestNote?: string | null;
}): string {
  const preview = getOrderRequestDocumentPreview(input.workOrder, 0);
  const currentPage = preview.currentPage;
  const representativeImage = preview.representativeImage;
  const requestNote = input.requestNote ?? preview.requestNote ?? "";
  const fabricRows = rowsOrEmpty(materialRows(preview.fabricMaterials), 6);
  const subsidiaryRows = rowsOrEmpty(materialRows(preview.subsidiaryMaterials), 6);
  const outsourceRows = rowsOrEmpty(outsourcingRows(preview.outsourcingItems), 5);

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(preview.displayTitle)} 발주서</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: "Pretendard", "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
      font-size: 10px;
      line-height: 1.45;
      background: #fff;
    }
    .document { width: 100%; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #b7b7b7; padding: 6px 8px; vertical-align: middle; word-break: keep-all; overflow-wrap: anywhere; }
    th { background: #f3f4f6; font-weight: 700; }
    .header { border: 1px solid #9ca3af; margin-bottom: 8px; }
    .title-row { display: grid; grid-template-columns: 1fr 2fr 1fr; align-items: center; border-bottom: 1px solid #9ca3af; min-height: 52px; }
    .title-cell { padding: 8px 12px; }
    .title { text-align: center; font-size: 22px; font-weight: 800; letter-spacing: 0.45em; }
    .subtitle { text-align: center; margin-top: 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; }
    .doc-index { text-align: right; font-size: 9px; color: #374151; }
    .summary td { height: 28px; }
    .label { color: #374151; font-weight: 700; background: #f9fafb; width: 11%; }
    .value { font-weight: 700; text-align: right; }
    .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0 10px; }
    .box { border: 1px solid #b7b7b7; min-height: 188px; }
    .box-title { border-bottom: 1px solid #b7b7b7; background: #f3f4f6; padding: 7px 10px; font-weight: 800; }
    .image-box { height: 156px; display: flex; align-items: center; justify-content: center; text-align: center; color: #6b7280; padding: 12px; }
    .note-box { min-height: 156px; padding: 12px; white-space: pre-wrap; }
    .section { margin-top: 8px; }
    .section-title { border: 1px solid #b7b7b7; border-bottom: 0; background: #f3f4f6; padding: 7px 10px; font-weight: 800; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .center { text-align: center; }
    .empty { height: 34px; text-align: center; color: #6b7280; }
    .total-row td { background: #fafafa; font-weight: 800; }
    .footer { margin-top: 10px; border-top: 1px solid #9ca3af; padding-top: 8px; font-size: 9px; color: #374151; }
  </style>
</head>
<body>
  <main class="document">
    <section class="header">
      <div class="title-row">
        <div class="title-cell">
          <strong>납기일</strong><br />${escapeHtml(currentPage.dueDate || "미지정")}
        </div>
        <div class="title-cell">
          <div class="title">작업지시서</div>
          <div class="subtitle">${escapeHtml(preview.displayTitle)}</div>
        </div>
        <div class="title-cell doc-index">문서 ${escapeHtml(preview.currentDocument.label)} / ${escapeHtml(preview.currentDocument.total)}</div>
      </div>
      <table class="summary">
        <tr>
          <td class="label">품명</td><td>${escapeHtml(preview.displayTitle)}</td>
          <td class="label">공임</td><td class="value">${escapeHtml(formatMoney(currentPage.laborCost))}</td>
          <td class="label">금액</td><td class="value">${escapeHtml(formatMoney(preview.currentDocumentAmount))}</td>
          <td class="label">수량</td><td class="value">${escapeHtml(formatQuantity(currentPage.quantity))}</td>
        </tr>
        <tr>
          <td class="label">원단합</td><td class="value">${escapeHtml(formatMoney(preview.fabricAmountTotal))}</td>
          <td class="label">부자재합</td><td class="value">${escapeHtml(formatMoney(preview.subsidiaryAmountTotal))}</td>
          <td class="label">외주합</td><td class="value">${escapeHtml(formatMoney(preview.outsourcingAmountTotal))}</td>
          <td class="label">로스</td><td class="value">${escapeHtml(formatMoney(currentPage.lossCost))}</td>
        </tr>
      </table>
    </section>

    <section class="hero">
      <div class="box">
        <div class="box-title">대표 이미지</div>
        <div class="image-box">
          ${representativeImage ? `${escapeHtml(representativeImage.name)}<br />이미지 삽입은 PDF Generator 단계에서 처리합니다.` : "대표 이미지가 없습니다."}
        </div>
      </div>
      <div class="box">
        <div class="box-title">요청사항</div>
        <div class="note-box">${escapeHtml(requestNote || "-")}</div>
      </div>
    </section>

    <section class="section">
      <div class="section-title">원단 내역</div>
      <table>
        <thead><tr><th>거래처</th><th>자재명</th><th>수량</th><th>단위</th><th>단가</th><th>금액</th></tr></thead>
        <tbody>${fabricRows}<tr class="total-row"><td colspan="5" class="center">원단 총합</td><td class="num">${escapeHtml(formatMoney(preview.fabricAmountTotal))}</td></tr></tbody>
      </table>
    </section>

    <section class="section">
      <div class="section-title">부자재 내역</div>
      <table>
        <thead><tr><th>거래처</th><th>자재명</th><th>수량</th><th>단위</th><th>단가</th><th>금액</th></tr></thead>
        <tbody>${subsidiaryRows}<tr class="total-row"><td colspan="5" class="center">부자재 총합</td><td class="num">${escapeHtml(formatMoney(preview.subsidiaryAmountTotal))}</td></tr></tbody>
      </table>
    </section>

    <section class="section">
      <div class="section-title">외주 내역</div>
      <table>
        <thead><tr><th>외주처</th><th>작업명</th><th>수량</th><th>단가</th><th>금액</th></tr></thead>
        <tbody>${outsourceRows}<tr class="total-row"><td colspan="4" class="center">외주 총합</td><td class="num">${escapeHtml(formatMoney(preview.outsourcingAmountTotal))}</td></tr></tbody>
      </table>
    </section>

    <footer class="footer">이 문서는 발주요청 시점의 작업지시서 데이터를 기준으로 자동 생성됩니다.</footer>
  </main>
</body>
</html>`;
}
