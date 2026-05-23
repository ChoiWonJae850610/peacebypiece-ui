import "server-only";

import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { Material, Outsourcing, WorkOrder } from "@/types/workorder";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const TOP_Y = 794;
const BOTTOM_Y = 44;

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

function materialAmount(item: Material): number {
  return Number(item.totalCost || item.quantity * item.unitCost || 0);
}

function outsourcingAmount(item: Outsourcing): number {
  return Number(item.totalCost || item.quantity * item.unitCost || 0);
}

function truncate(value: unknown, max: number): string {
  const text = toSafeText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function wrapText(value: unknown, maxChars: number, maxLines: number): string[] {
  const normalized = String(value ?? "").trim();
  if (!normalized) return ["-"];

  const lines: string[] = [];
  for (const rawLine of normalized.split(/\r?\n/)) {
    const text = rawLine.trim();
    if (!text) {
      lines.push("");
      continue;
    }
    for (let index = 0; index < text.length; index += maxChars) {
      lines.push(text.slice(index, index + maxChars));
    }
  }
  return lines.slice(0, maxLines);
}

function utf16Hex(value: string): string {
  return Buffer.from(`\ufeff${value}`, "utf16le").swap16().toString("hex").toUpperCase();
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

type PdfDrawContext = {
  commands: string[];
};

function setStroke(ctx: PdfDrawContext, gray = 0.38, width = 0.7) {
  ctx.commands.push(`${gray} G`);
  ctx.commands.push(`${width} w`);
}

function setFill(ctx: PdfDrawContext, gray = 0.96) {
  ctx.commands.push(`${gray} g`);
}

function rect(ctx: PdfDrawContext, x: number, y: number, width: number, height: number, mode: "S" | "f" = "S") {
  ctx.commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${mode}`);
}

function line(ctx: PdfDrawContext, x1: number, y1: number, x2: number, y2: number) {
  ctx.commands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
}

function text(ctx: PdfDrawContext, value: unknown, x: number, y: number, size = 9, options?: { bold?: boolean }) {
  const safe = toSafeText(value);
  if (!safe) return;
  const fontSize = options?.bold ? size + 0.2 : size;
  ctx.commands.push("BT");
  ctx.commands.push(`/F1 ${fontSize.toFixed(1)} Tf`);
  ctx.commands.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
  ctx.commands.push(`<${utf16Hex(safe)}> Tj`);
  ctx.commands.push("ET");
}

function textCentered(ctx: PdfDrawContext, value: unknown, centerX: number, y: number, size = 9, maxChars = 40) {
  const safe = truncate(value, maxChars);
  const estimatedWidth = safe.length * size * 0.52;
  text(ctx, safe, centerX - estimatedWidth / 2, y, size, { bold: true });
}

function drawLabeledValue(ctx: PdfDrawContext, label: string, value: unknown, x: number, y: number, width: number) {
  text(ctx, label, x, y, 8, { bold: true });
  text(ctx, truncate(value, Math.max(8, Math.floor(width / 7))), x + 42, y, 9, { bold: true });
}

function drawSummaryRow(
  ctx: PdfDrawContext,
  y: number,
  items: Array<{ label: string; value: string }>,
): number {
  const rowHeight = 27;
  const cellWidth = CONTENT_WIDTH / items.length;
  setStroke(ctx, 0.58, 0.55);
  rect(ctx, MARGIN_X, y - rowHeight, CONTENT_WIDTH, rowHeight);
  items.forEach((item, index) => {
    const x = MARGIN_X + cellWidth * index;
    if (index > 0) line(ctx, x, y - rowHeight, x, y);
    text(ctx, item.label, x + 8, y - 17, 7.4, { bold: true });
    text(ctx, truncate(item.value, 18), x + cellWidth - 82, y - 17, 8.2, { bold: true });
  });
  return y - rowHeight;
}

function drawTable(
  ctx: PdfDrawContext,
  input: {
    title: string;
    y: number;
    columns: Array<{ label: string; width: number }>;
    rows: string[][];
    footerLabel: string;
    footerValue: string;
    maxRows?: number;
  },
): number {
  const headerHeight = 22;
  const rowHeight = 20;
  const footerHeight = 22;
  const rows = input.rows.slice(0, input.maxRows ?? 5);
  const bodyRows = rows.length > 0 ? rows : [["등록된 항목이 없습니다."]];
  const bodyHeight = bodyRows.length * rowHeight;
  const totalHeight = headerHeight * 2 + bodyHeight + footerHeight;
  const x = MARGIN_X;
  let y = input.y;

  setStroke(ctx, 0.48, 0.55);
  rect(ctx, x, y - totalHeight, CONTENT_WIDTH, totalHeight);
  setFill(ctx, 0.95);
  rect(ctx, x, y - headerHeight, CONTENT_WIDTH, headerHeight, "f");
  setStroke(ctx, 0.48, 0.55);
  rect(ctx, x, y - headerHeight, CONTENT_WIDTH, headerHeight);
  text(ctx, input.title, x + 8, y - 14, 9, { bold: true });
  y -= headerHeight;

  setFill(ctx, 0.98);
  rect(ctx, x, y - headerHeight, CONTENT_WIDTH, headerHeight, "f");
  setStroke(ctx, 0.68, 0.45);
  rect(ctx, x, y - headerHeight, CONTENT_WIDTH, headerHeight);

  let currentX = x;
  input.columns.forEach((column, index) => {
    if (index > 0) line(ctx, currentX, y - headerHeight, currentX, y);
    textCentered(ctx, column.label, currentX + column.width / 2, y - 14, 7.6, 12);
    currentX += column.width;
  });
  y -= headerHeight;

  if (rows.length === 0) {
    textCentered(ctx, "등록된 항목이 없습니다.", x + CONTENT_WIDTH / 2, y - 13, 8, 30);
    y -= rowHeight;
  } else {
    bodyRows.forEach((rowValues) => {
      line(ctx, x, y - rowHeight, x + CONTENT_WIDTH, y - rowHeight);
      let cellX = x;
      input.columns.forEach((column, index) => {
        if (index > 0) line(ctx, cellX, y - rowHeight, cellX, y);
        const value = rowValues[index] ?? "-";
        textCentered(ctx, value, cellX + column.width / 2, y - 13, 7.2, Math.max(6, Math.floor(column.width / 5.4)));
        cellX += column.width;
      });
      y -= rowHeight;
    });
  }

  setFill(ctx, 0.98);
  rect(ctx, x, y - footerHeight, CONTENT_WIDTH, footerHeight, "f");
  setStroke(ctx, 0.58, 0.5);
  rect(ctx, x, y - footerHeight, CONTENT_WIDTH, footerHeight);
  textCentered(ctx, input.footerLabel, x + CONTENT_WIDTH * 0.55, y - 14, 8, 20);
  text(ctx, input.footerValue, x + CONTENT_WIDTH - 88, y - 14, 8.2, { bold: true });

  return y - footerHeight - 11;
}

function materialRows(materials: Material[]): string[][] {
  return materials.map((material) => [
    material.vendor || "-",
    material.name || "-",
    formatQuantity(material.quantity),
    material.unit || "-",
    formatMoney(material.unitCost),
    formatMoney(materialAmount(material)),
  ]);
}

function outsourcingRows(items: Outsourcing[]): string[][] {
  return items.map((item) => [
    item.vendor || "-",
    item.process || "-",
    formatQuantity(item.quantity),
    formatMoney(item.unitCost),
    formatMoney(outsourcingAmount(item)),
  ]);
}

function createOrderRequestPdfStream(workOrder: WorkOrder, requestNote?: string | null): string {
  const preview = getOrderRequestDocumentPreview(workOrder, 0);
  const currentPage = preview.currentPage;
  const documentUnit = preview.currentDocument;
  const representativeImage = preview.representativeImage;
  const requestNoteLines = wrapText(requestNote ?? preview.requestNote, 31, 9);
  const ctx: PdfDrawContext = { commands: [] };

  setStroke(ctx, 0.42, 0.7);

  let y = TOP_Y;
  const headerHeight = 58;
  rect(ctx, MARGIN_X, y - headerHeight, CONTENT_WIDTH, headerHeight);
  drawLabeledValue(ctx, "납기일", currentPage.dueDate || "미지정", MARGIN_X + 10, y - 21, 120);
  textCentered(ctx, "작 업 지 시 서", PAGE_WIDTH / 2, y - 23, 17, 18);
  textCentered(ctx, currentPage.factoryName || "공장 미지정", PAGE_WIDTH / 2 + 92, y - 25, 8, 12);
  textCentered(ctx, preview.displayTitle, PAGE_WIDTH / 2, y - 45, 11, 36);
  text(ctx, `${documentUnit.label} / ${documentUnit.total}`, MARGIN_X + CONTENT_WIDTH - 54, y - 18, 7.6, { bold: true });
  y -= headerHeight;

  y = drawSummaryRow(ctx, y, [
    { label: "품명", value: preview.displayTitle },
    { label: "공임", value: formatMoney(currentPage.laborCost) },
    { label: "금액", value: formatMoney(preview.currentDocumentAmount) },
    { label: "수량", value: formatQuantity(currentPage.quantity) },
  ]);
  y = drawSummaryRow(ctx, y, [
    { label: "원단합", value: formatMoney(preview.fabricAmountTotal) },
    { label: "부자재합", value: formatMoney(preview.subsidiaryAmountTotal) },
    { label: "외주합", value: formatMoney(preview.outsourcingAmountTotal) },
    { label: "로스", value: formatMoney(currentPage.lossCost) },
  ]);

  const heroHeight = 162;
  const leftWidth = 260;
  const rightWidth = CONTENT_WIDTH - leftWidth;
  rect(ctx, MARGIN_X, y - heroHeight, CONTENT_WIDTH, heroHeight);
  line(ctx, MARGIN_X + leftWidth, y, MARGIN_X + leftWidth, y - heroHeight);
  setFill(ctx, 0.95);
  rect(ctx, MARGIN_X, y - 24, leftWidth, 24, "f");
  rect(ctx, MARGIN_X + leftWidth, y - 24, rightWidth, 24, "f");
  setStroke(ctx, 0.58, 0.5);
  line(ctx, MARGIN_X, y - 24, MARGIN_X + CONTENT_WIDTH, y - 24);
  text(ctx, "대표 이미지", MARGIN_X + 9, y - 16, 8.5, { bold: true });
  text(ctx, "요청사항", MARGIN_X + leftWidth + 9, y - 16, 8.5, { bold: true });

  const imageBoxX = MARGIN_X + 10;
  const imageBoxY = y - heroHeight + 10;
  const imageBoxW = leftWidth - 20;
  const imageBoxH = heroHeight - 44;
  rect(ctx, imageBoxX, imageBoxY, imageBoxW, imageBoxH);
  if (representativeImage) {
    textCentered(ctx, truncate(representativeImage.name, 28), imageBoxX + imageBoxW / 2, imageBoxY + imageBoxH / 2 + 5, 8, 28);
    textCentered(ctx, "※ 실제 이미지 삽입은 후속 단계에서 연결", imageBoxX + imageBoxW / 2, imageBoxY + imageBoxH / 2 - 12, 7, 32);
  } else {
    textCentered(ctx, "대표 이미지가 없습니다.", imageBoxX + imageBoxW / 2, imageBoxY + imageBoxH / 2, 8, 28);
  }

  const noteX = MARGIN_X + leftWidth + 10;
  const noteY = y - 40;
  rect(ctx, noteX, y - heroHeight + 10, rightWidth - 20, imageBoxH);
  requestNoteLines.forEach((lineValue, index) => {
    text(ctx, lineValue || " ", noteX + 8, noteY - index * 13, 8.2);
  });
  y -= heroHeight + 13;

  const materialColumns = [
    { label: "거래처", width: 88 },
    { label: "자재명", width: 132 },
    { label: "수량", width: 62 },
    { label: "단위", width: 54 },
    { label: "단가", width: 84 },
    { label: "금액", width: CONTENT_WIDTH - 88 - 132 - 62 - 54 - 84 },
  ];
  y = drawTable(ctx, {
    title: "원단 내역",
    y,
    columns: materialColumns,
    rows: materialRows(preview.fabricMaterials),
    footerLabel: "원단 총합",
    footerValue: formatMoney(preview.fabricAmountTotal),
    maxRows: 4,
  });
  y = drawTable(ctx, {
    title: "부자재 내역",
    y,
    columns: materialColumns,
    rows: materialRows(preview.subsidiaryMaterials),
    footerLabel: "부자재 총합",
    footerValue: formatMoney(preview.subsidiaryAmountTotal),
    maxRows: 3,
  });

  const outsourcingColumns = [
    { label: "외주처", width: 112 },
    { label: "작업명", width: 160 },
    { label: "수량", width: 70 },
    { label: "단가", width: 84 },
    { label: "금액", width: CONTENT_WIDTH - 112 - 160 - 70 - 84 },
  ];
  drawTable(ctx, {
    title: "외주 내역",
    y,
    columns: outsourcingColumns,
    rows: outsourcingRows(preview.outsourcingItems),
    footerLabel: "외주 총합",
    footerValue: formatMoney(preview.outsourcingAmountTotal),
    maxRows: 3,
  });

  return ctx.commands.join("\n");
}

export function buildOrderRequestServerPdf(input: {
  workOrder: WorkOrder;
  requestNote?: string | null;
}): Buffer {
  const stream = createOrderRequestPdfStream(input.workOrder, input.requestNote);
  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>\nendobj\n`,
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
