import "server-only";

import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { Material, Outsourcing, WorkOrder } from "@/types/workorder";

const PDF_LINE_LIMIT = 55;
const PAGE_WIDTH = 82;

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

function truncate(value: unknown, max: number): string {
  const text = toSafeText(value);
  if (text.length <= max) return text;
  if (max <= 1) return text.slice(0, max);
  return `${text.slice(0, max - 1)}…`;
}

function padEndDisplay(value: string, length: number): string {
  const text = value.slice(0, length);
  return text + " ".repeat(Math.max(0, length - text.length));
}

function divider(char = "─"): string {
  return char.repeat(PAGE_WIDTH);
}

function center(value: string, width = PAGE_WIDTH): string {
  const text = toSafeText(value);
  const left = Math.max(0, Math.floor((width - text.length) / 2));
  return `${" ".repeat(left)}${text}`;
}

function row(label: string, value: unknown, valueWidth = 27): string {
  return `${padEndDisplay(label, 8)} ${padEndDisplay(truncate(value, valueWidth), valueWidth)}`;
}

function twoColumn(leftLabel: string, leftValue: unknown, rightLabel: string, rightValue: unknown): string {
  return `${row(leftLabel, leftValue, 28)} │ ${row(rightLabel, rightValue, 28)}`;
}

function splitNoteLines(value: string, maxLines = 8): string[] {
  const normalized = String(value ?? "").trim();
  if (!normalized) return ["요청사항이 없습니다."];

  const lines: string[] = [];
  for (const rawLine of normalized.split(/\r?\n/)) {
    const text = rawLine.trim();
    if (!text) {
      lines.push("");
      continue;
    }
    for (let index = 0; index < text.length; index += 34) {
      lines.push(text.slice(index, index + 34));
    }
  }
  return lines.slice(0, maxLines);
}

function materialAmount(item: Material): number {
  return Number(item.totalCost || item.quantity * item.unitCost || 0);
}

function outsourcingAmount(item: Outsourcing): number {
  return Number(item.totalCost || item.quantity * item.unitCost || 0);
}

function pushMaterialTable(lines: string[], title: string, materials: Material[], footerTotal: number): void {
  lines.push("");
  lines.push(`■ ${title}`);
  lines.push("거래처             품목/원단명              수량        단가        금액");
  lines.push(divider("·"));

  if (materials.length === 0) {
    lines.push("등록된 항목이 없습니다.");
  } else {
    materials.slice(0, 8).forEach((item) => {
      lines.push(
        [
          padEndDisplay(truncate(item.vendor || "-", 16), 17),
          padEndDisplay(truncate(item.name || "-", 20), 21),
          padEndDisplay(truncate(formatQuantity(item.quantity, item.unit), 9), 10),
          padEndDisplay(truncate(formatMoney(item.unitCost), 10), 11),
          truncate(formatMoney(materialAmount(item)), 12),
        ].join(""),
      );
    });
  }

  lines.push(`${padEndDisplay("합계", 68)}${formatMoney(footerTotal)}`);
}

function pushOutsourcingTable(lines: string[], items: Outsourcing[], footerTotal: number): void {
  lines.push("");
  lines.push("■ 외주공정");
  lines.push("외주처             공정명                  수량        단가        금액");
  lines.push(divider("·"));

  if (items.length === 0) {
    lines.push("등록된 항목이 없습니다.");
  } else {
    items.slice(0, 8).forEach((item) => {
      lines.push(
        [
          padEndDisplay(truncate(item.vendor || "-", 16), 17),
          padEndDisplay(truncate(item.process || "-", 20), 21),
          padEndDisplay(truncate(formatQuantity(item.quantity), 9), 10),
          padEndDisplay(truncate(formatMoney(item.unitCost), 10), 11),
          truncate(formatMoney(outsourcingAmount(item)), 12),
        ].join(""),
      );
    });
  }

  lines.push(`${padEndDisplay("합계", 68)}${formatMoney(footerTotal)}`);
}

function buildOrderRequestPdfLines(workOrder: WorkOrder, requestNote?: string | null): string[] {
  const preview = getOrderRequestDocumentPreview(workOrder, 0);
  const currentPage = preview.currentPage;
  const noteLines = splitNoteLines(requestNote ?? preview.requestNote);
  const representativeImageName = preview.representativeImage?.name || "대표 이미지 없음";
  const lines: string[] = [];

  lines.push(center("발 주 서"));
  lines.push(center(preview.displayTitle));
  lines.push(divider());
  lines.push(twoColumn("납기일", currentPage.dueDate || "미지정", "공장", currentPage.factoryName || "공장 미지정"));
  lines.push(twoColumn("품목명", preview.displayTitle, "수량", formatQuantity(currentPage.quantity)));
  lines.push(twoColumn("공임", formatMoney(currentPage.laborCost), "로스", formatMoney(currentPage.lossCost)));
  lines.push(twoColumn("원단 합계", formatMoney(preview.fabricAmountTotal), "부자재 합계", formatMoney(preview.subsidiaryAmountTotal)));
  lines.push(twoColumn("외주 합계", formatMoney(preview.outsourcingAmountTotal), "문서금액", formatMoney(preview.currentDocumentAmount)));
  lines.push(divider());

  lines.push("■ 대표 이미지");
  lines.push(`파일명: ${truncate(representativeImageName, 68)}`);
  lines.push("※ 서버 PDF 1차에서는 대표 이미지 파일명을 표시합니다. 실제 이미지 삽입은 후속 단계에서 연결합니다.");

  lines.push("");
  lines.push("■ 발주 메모");
  noteLines.forEach((line) => lines.push(line ? truncate(line, 76) : ""));

  pushMaterialTable(lines, "원단", preview.fabricMaterials, preview.fabricAmountTotal);
  pushMaterialTable(lines, "부자재", preview.subsidiaryMaterials, preview.subsidiaryAmountTotal);
  pushOutsourcingTable(lines, preview.outsourcingItems, preview.outsourcingAmountTotal);

  lines.push("");
  lines.push(divider());
  lines.push("본 문서는 발주요청 시점의 작업지시서 데이터를 기준으로 자동 생성되었습니다.");

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
    "/F1 20 Tf",
    "64 792 Td",
    "<" + utf16Hex(lines[0] ?? "발 주 서") + "> Tj",
    "/F1 11 Tf",
  ];

  lines.slice(1).forEach((line) => {
    commands.push("0 -14 Td");
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
