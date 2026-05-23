import "server-only";

import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { Material, Outsourcing, WorkOrder } from "@/types/workorder";

const PDF_LINE_LIMIT = 46;

function toSafeText(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMoney(value: number | null | undefined): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return `${numeric.toLocaleString("ko-KR")}원`;
}

function formatQuantity(value: number | null | undefined, unit?: string | null): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return unit ? `${numeric.toLocaleString("ko-KR")} ${unit}` : numeric.toLocaleString("ko-KR");
}

function truncateLine(value: string, max = 74): string {
  const text = toSafeText(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function splitNoteLines(value: string): string[] {
  const normalized = String(value ?? "").trim();
  if (!normalized) return ["요청사항이 없습니다."];

  const lines: string[] = [];
  for (const rawLine of normalized.split(/\r?\n/)) {
    const text = rawLine.trim();
    if (!text) {
      lines.push("");
      continue;
    }
    for (let index = 0; index < text.length; index += 52) {
      lines.push(text.slice(index, index + 52));
    }
  }
  return lines.slice(0, 8);
}

function pushMaterialLines(lines: string[], title: string, materials: Material[], total: number): void {
  lines.push("");
  lines.push(`■ ${title} / 합계 ${formatMoney(total)}`);
  if (materials.length === 0) {
    lines.push("- 항목이 없습니다.");
    return;
  }

  materials.slice(0, 8).forEach((item, index) => {
    lines.push(
      truncateLine(
        `${index + 1}. ${item.vendor || "거래처 미지정"} / ${item.name || "자재명 미입력"} / ${formatQuantity(item.quantity, item.unit)} / ${formatMoney(item.totalCost || item.quantity * item.unitCost)}`,
      ),
    );
  });
}

function pushOutsourcingLines(lines: string[], items: Outsourcing[], total: number): void {
  lines.push("");
  lines.push(`■ 외주 내역 / 합계 ${formatMoney(total)}`);
  if (items.length === 0) {
    lines.push("- 항목이 없습니다.");
    return;
  }

  items.slice(0, 8).forEach((item, index) => {
    lines.push(
      truncateLine(
        `${index + 1}. ${item.vendor || "외주처 미지정"} / ${item.process || "작업명 미입력"} / ${formatQuantity(item.quantity)} / ${formatMoney(item.totalCost || item.quantity * item.unitCost)}`,
      ),
    );
  });
}

function buildOrderRequestPdfLines(workOrder: WorkOrder, requestNote?: string | null): string[] {
  const preview = getOrderRequestDocumentPreview(workOrder, 0);
  const currentPage = preview.currentPage;
  const noteLines = splitNoteLines(requestNote ?? preview.requestNote);
  const lines = [
    "발 주 서",
    `작업지시서: ${preview.displayTitle}`,
    `공장: ${currentPage.factoryName || "공장 미지정"}`,
    `납기일: ${currentPage.dueDate || "미지정"}`,
    `수량: ${formatQuantity(currentPage.quantity)}`,
    `공임: ${formatMoney(currentPage.laborCost)} / 로스: ${formatMoney(currentPage.lossCost)}`,
    `문서금액: ${formatMoney(preview.currentDocumentAmount)}`,
    "",
    "■ 요청사항",
    ...noteLines.map((line) => (line ? truncateLine(line, 58) : "")),
    "",
    `대표 이미지: ${preview.representativeImage ? preview.representativeImage.name : "대표 이미지 없음"}`,
  ];

  pushMaterialLines(lines, "원단 내역", preview.fabricMaterials, preview.fabricAmountTotal);
  pushMaterialLines(lines, "부자재 내역", preview.subsidiaryMaterials, preview.subsidiaryAmountTotal);
  pushOutsourcingLines(lines, preview.outsourcingItems, preview.outsourcingAmountTotal);

  lines.push("");
  lines.push("※ 0.15.94 서버 PDF 1차 출력입니다. 대표 이미지 삽입 및 모달형 A4 템플릿 고도화는 후속 버전에서 연결합니다.");

  return lines.slice(0, PDF_LINE_LIMIT);
}

function utf16Hex(value: string): string {
  return Buffer.from(`\ufeff${value}`, "utf16le").swap16().toString("hex").toUpperCase();
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createTextStream(lines: string[]): string {
  const commands = [
    "BT",
    "/F1 18 Tf",
    "72 780 Td",
    "<" + utf16Hex(lines[0] ?? "발 주 서") + "> Tj",
    "/F1 10 Tf",
  ];

  lines.slice(1).forEach((line) => {
    commands.push("0 -18 Td");
    commands.push("<" + utf16Hex(line) + "> Tj");
  });

  commands.push("ET");
  return commands.join("\n");
}

export function buildOrderRequestServerPdf(input: {
  workOrder: WorkOrder;
  requestNote?: string | null;
}): Buffer {
  const lines = buildOrderRequestPdfLines(input.workOrder, input.requestNote);
  const stream = createTextStream(lines);
  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [5 0 R] >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo 6 0 R /FontDescriptor 8 0 R >>\nendobj\n",
    "6 0 obj\n<< /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >>\nendobj\n",
    `7 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "8 0 obj\n<< /Type /FontDescriptor /FontName /HYGoThic-Medium /Flags 4 /FontBBox [0 -200 1000 900] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 700 /StemV 80 >>\nendobj\n",
  ];

  let output = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(output, "binary"));
    output += object;
  }

  const xrefOffset = Buffer.byteLength(output, "binary");
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(output, "binary");
}

export function createPdfFileNameHeaderValue(fileName: string): string {
  const fallback = pdfEscape(fileName.replace(/[^a-zA-Z0-9._-]+/g, "_") || "order-request.pdf");
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
