import type { ReactNode } from "react";
import { CalendarDays, CircleDollarSign, createLucideIcon, Factory, FileText, Hash, Image as ImageIcon, Layers3, Package, Palette, Ruler, Shirt, Spool, WalletCards, type LucideIcon } from "lucide-react";

/* eslint-disable @next/next/no-img-element -- PDF readiness requires the native HTMLImageElement contract. */

import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";
import { decodeWorkOrderCategory, workOrderProductClassificationSummary } from "@/lib/domain/work-orders/catalog/workOrderCategoryPolicy";
import { formatMeasurementFromCm } from "@/lib/domain/work-orders/measurement/measurementPolicy";
import { ISSUED_PDF_CONTENT_PAGE_CAPACITY, issuedPdfSizeSpecWeight, packIssuedPdfBlocks, paginateIssuedPdfAttachmentImages, paginateIssuedPdfSizeSpecRows } from "@/lib/generated-documents/work-order-pdf/paginationPolicy";
import { formatIssuedPdfWon, resolveIssuedPdfCostPresentation } from "@/lib/generated-documents/work-order-pdf/costPresentation";
import { formatIssuedDocumentQuantity, resolveIssuedPdfFactoryQuantity } from "@/lib/generated-documents/work-order-pdf/quantityFormatter";
import { resolveIssuedPdfProcessPresentation } from "@/lib/generated-documents/work-order-pdf/processPresentation";
import { formatProcessInstruction } from "./processInstruction";
import styles from "./IssuedWorkOrderPreview.module.css";

export type WorkOrderPreviewCoverFacts = { readonly productTypeLabel?: string; readonly factoryName?: string; readonly managerName?: string };
type PreviewProps = {
  readonly data: WorkOrderIssuedPreviewReadModel;
  readonly representativeImageSrc?: string;
  readonly representativeImageLabel?: string;
  readonly quantityUnit?: string;
  readonly coverFacts?: WorkOrderPreviewCoverFacts;
  readonly includedAttachmentImages?: readonly { readonly filename: string; readonly dataUrl: string }[];
};
type DocumentBlock = { readonly key: string; readonly weight: number; readonly content: ReactNode; readonly startsNewPage?: boolean };
type MaterialKind = "fabric" | "accessory";
type FinishedSpecUnit = "cm" | "inch";

const AccessoryButtonIcon = createLucideIcon("WaflFourHoleButton", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "button" }],
  ["circle", { cx: "9", cy: "9", r: "1.2", key: "hole-1" }],
  ["circle", { cx: "15", cy: "9", r: "1.2", key: "hole-2" }],
  ["circle", { cx: "9", cy: "15", r: "1.2", key: "hole-3" }],
  ["circle", { cx: "15", cy: "15", r: "1.2", key: "hole-4" }],
]);

const PDF_SEMANTIC_ICONS = {
  fabric: Spool,
  accessory: AccessoryButtonIcon,
  color: Palette,
  size: Ruler,
  process: Layers3,
} as const;

const number = new Intl.NumberFormat("ko-KR");
const value = (input: string | null | undefined) => input?.trim() || "-";
const unitValue = (quantity: string, unit: string) => `${formatIssuedDocumentQuantity(quantity)} ${unit}`;
const PRODUCT_TYPE_LABELS: Readonly<Record<string, string>> = {
  "apparel.top": "상의", "apparel.bottom": "하의", "apparel.outer": "아우터", "apparel.onepiece_set": "원피스·세트",
  "underwear.innerwear": "언더웨어·이너웨어", "underwear.sleepwear": "슬립웨어",
};

export function formatProductTypeLabel(input: string | null | undefined): string | null { const code = input?.trim(); return code ? PRODUCT_TYPE_LABELS[code] ?? code : null; }
export function formatProductClassification(input: { readonly productTypeCode: string | null; readonly itemCode: string | null }): string | null { return workOrderProductClassificationSummary(input); }
export function formatRevisionLabel(revisionNumber: number): string { return `${revisionNumber}차`; }

function formatDate(input: string | null | undefined, timeZone = "Asia/Seoul") {
  if (!input) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input.replaceAll("-", ".");
  const parts = new Intl.DateTimeFormat("ko-KR", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(input));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}.${part("month")}.${part("day")}`;
}

function textRowWeight(values: readonly (string | null | undefined)[], base = 2) {
  const longest = values.reduce((max, item) => Math.max(max, item?.trim().length ?? 0), 0);
  return base + Math.min(4, Math.max(0, Math.ceil(longest / 42) - 1));
}

function paginateWeightedRows<T>(rows: readonly T[], rowWeight: (row: T) => number, chromeWeight = 5, maximumRowsPerPage = Number.POSITIVE_INFINITY) {
  if (rows.length === 0) return [] as readonly (readonly T[])[];
  const total = chromeWeight + rows.reduce((sum, row) => sum + rowWeight(row), 0);
  if (total <= ISSUED_PDF_CONTENT_PAGE_CAPACITY && rows.length <= maximumRowsPerPage) return [rows];
  const rowCapacity = ISSUED_PDF_CONTENT_PAGE_CAPACITY - chromeWeight;
  const pages: T[][] = [];
  let page: T[] = [];
  let weight = 0;
  for (const row of rows) {
    const nextWeight = Math.min(rowCapacity, rowWeight(row));
    if (page.length && (weight + nextWeight > rowCapacity || page.length >= maximumRowsPerPage)) { pages.push(page); page = []; weight = 0; }
    page.push(row); weight += nextWeight;
  }
  if (page.length) pages.push(page);
  return pages;
}

function SectionHeading({ numberLabel, title, continued = false, Icon = FileText }: { readonly numberLabel: string; readonly title: string; readonly continued?: boolean; readonly Icon?: LucideIcon }) {
  return <div className={styles.sectionHeading}><span className={styles.sectionNumber}>{numberLabel}</span><Icon aria-hidden="true" size={20} strokeWidth={1.8} /><h2>{title}{continued ? " (계속)" : ""}</h2></div>;
}

function MaterialSection({ materialKind, title, rows, continued }: { readonly materialKind: MaterialKind; readonly title: string; readonly rows: WorkOrderIssuedPreviewReadModel["materials"]["fabrics"]; readonly continued: boolean }) {
  const Icon = PDF_SEMANTIC_ICONS[materialKind];
  return <section className={styles.documentSection}><SectionHeading Icon={Icon} numberLabel={materialKind === "fabric" ? "01" : "02"} title={title} continued={continued} /><table className={styles.materialTable}>
    <thead><tr><th>품명</th><th>거래처</th><th>색상·옵션·규격</th><th>사용 부위</th><th>수량</th><th>메모</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.id}><td className={`${styles.strongCell} ${styles.textCell}`}>{row.name}</td><td className={styles.textCell}>{value(row.partnerName)}</td><td>{value(row.colorOption)}</td><td>{value(row.usageArea)}</td><td className={styles.numeric}>{unitValue(resolveIssuedPdfFactoryQuantity(row), row.unitCode)}</td><td className={styles.textCell}>{value(row.memo)}</td></tr>)}</tbody>
  </table></section>;
}

function SizeColorSection({ data, colors, continued, final }: { readonly data: WorkOrderIssuedPreviewReadModel; readonly colors: WorkOrderIssuedPreviewReadModel["sizeColors"]["colors"]; readonly continued: boolean; readonly final: boolean }) {
  const matrix = data.sizeColors;
  return <section className={styles.documentSection}><SectionHeading Icon={Palette} numberLabel="03" title="색상·사이즈 수량" continued={continued} /><div className={styles.tableWrap}><table>
    <thead><tr><th>색상</th>{matrix.sizes.map((size) => <th key={size.id}>{size.displayLabel}</th>)}<th>합계</th></tr></thead><tbody>
      {colors.map((color) => { const cells = matrix.sizes.map((size) => matrix.quantityCells.find((cell) => cell.colorId === color.id && cell.sizeRowId === size.id)); return <tr key={color.id}><td className={styles.strongCell}>{color.displayName}</td>{cells.map((cell, index) => <td className={styles.numeric} key={matrix.sizes[index].id}>{cell?.quantity ?? "-"}</td>)}<td className={styles.numeric}>{cells.reduce((sum, cell) => sum + Number(cell?.quantity ?? 0), 0)}</td></tr>; })}
      {final ? <tr className={styles.totalRow}><th>합계</th>{matrix.sizes.map((size) => <th className={styles.numeric} key={size.id}>{matrix.quantityCells.filter((cell) => cell.sizeRowId === size.id).reduce((sum, cell) => sum + Number(cell.quantity), 0)}</th>)}<th className={styles.numeric}>{matrix.matrixTotal}</th></tr> : null}
    </tbody></table></div>{final ? <p className={matrix.totalsMatch ? styles.validationOk : styles.validationWarning}>발주수량 대조 · {matrix.matrixTotal} / {matrix.expectedTotal}</p> : null}</section>;
}

function formatSizeSpecCell(
  cell: WorkOrderIssuedPreviewReadModel["sizeSpecifications"]["cells"][number] | undefined,
  unit: FinishedSpecUnit,
): string {
  if (cell?.decimalValue === null || cell?.decimalValue === undefined) return "-";
  const centimeters = Number(cell.decimalValue);
  return formatMeasurementFromCm(centimeters, unit) || "-";
}

function SizeSpecSection({ data, rows, continued, unit }: { readonly data: WorkOrderIssuedPreviewReadModel; readonly rows: WorkOrderIssuedPreviewReadModel["sizeSpecifications"]["pomColumns"]; readonly continued: boolean; readonly unit: FinishedSpecUnit }) {
  const spec = data.sizeSpecifications;
  return <section className={styles.documentSection}><SectionHeading Icon={Ruler} numberLabel="04" title={`완성 스펙 (${unit})`} continued={continued} /><div className={styles.tableWrap}><table>
    <thead><tr><th>스펙 항목</th>{spec.sizes.map((size) => <th key={size.id}>{size.displayLabel}</th>)}</tr></thead><tbody>
      {rows.map((pom) => <tr key={pom.id}><td className={styles.strongCell}>{pom.displayName}</td>{spec.sizes.map((size) => { const cell = spec.cells.find((item) => item.sizeRowId === size.id && item.pomColumnId === pom.id); return <td className={styles.numeric} key={size.id}>{formatSizeSpecCell(cell, unit)}</td>; })}</tr>)}
    </tbody></table></div></section>;
}

function ProcessSection({ data, rows, continued }: { readonly data: WorkOrderIssuedPreviewReadModel; readonly rows: WorkOrderIssuedPreviewReadModel["processes"]; readonly continued: boolean }) {
  const timeZone = data.layoutMetadata.businessTimezone;
  return <section className={styles.documentSection}><SectionHeading Icon={Factory} numberLabel="05" title="추가 공정" continued={continued} /><table className={styles.processTable}><colgroup><col /><col /><col /><col /><col /><col /></colgroup>
    <thead><tr><th>순서</th><th>공정명</th><th>업체</th><th>수량</th><th>납기</th><th>작업 메모</th></tr></thead><tbody>
      {rows.map((process) => <tr key={process.id}><td>{process.displayOrder + 1}</td><td className={styles.strongCell}>{process.processName}</td><td>{value(process.partnerName)}</td><td className={styles.numeric}>{unitValue(process.quantity, process.unitCode)}</td><td>{formatDate(process.dueDate, timeZone)}</td><td className={styles.textCell}>{value(formatProcessInstruction(process))}</td></tr>)}
    </tbody></table></section>;
}

function IncludedAttachmentGrid({ images, continued }: { readonly images: readonly { readonly filename: string; readonly dataUrl: string }[]; readonly continued: boolean }) {
  return <section className={styles.documentSection}><SectionHeading Icon={ImageIcon} numberLabel="06" title="선택 첨부 이미지" continued={continued} /><div className={styles.attachmentGrid}>
    {images.map((image) => <figure key={image.filename}><img alt={image.filename} className={styles.includedAttachmentImage} src={image.dataUrl} /><figcaption>{image.filename}</figcaption></figure>)}
  </div></section>;
}

function buildBlocks(data: WorkOrderIssuedPreviewReadModel, includedAttachmentImages: PreviewProps["includedAttachmentImages"]): readonly DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const addMaterials = (key: MaterialKind, title: string, rows: WorkOrderIssuedPreviewReadModel["materials"]["fabrics"]) => {
    const pages = paginateWeightedRows(rows, (row) => textRowWeight([row.name, row.partnerName, row.colorOption, row.usageArea, row.memo]), 5, 7);
    const oversized = pages.length > 1;
    pages.forEach((group, index) => blocks.push({ key: `${key}-${index}`, weight: 5 + group.reduce((sum, row) => sum + textRowWeight([row.name, row.partnerName, row.colorOption, row.usageArea, row.memo]), 0), startsNewPage: oversized && index === 0, content: <MaterialSection materialKind={key} title={title} rows={group} continued={index > 0} /> }));
  };
  addMaterials("fabric", "원단", data.materials.fabrics);
  addMaterials("accessory", "부자재", data.materials.accessories);

  if (data.sizeColors.colors.length && data.sizeColors.sizes.length) {
    const pages = paginateWeightedRows(data.sizeColors.colors, () => 2, 7); const oversized = pages.length > 1;
    pages.forEach((colors, index) => blocks.push({ key: `size-color-${index}`, weight: 7 + colors.length * 2, startsNewPage: oversized && index === 0, content: <SizeColorSection colors={colors} continued={index > 0} data={data} final={index === pages.length - 1} /> }));
  }

  const sizeSpecPages = paginateIssuedPdfSizeSpecRows(data.sizeSpecifications.pomColumns);
  for (const unit of ["cm", "inch"] as const) {
    sizeSpecPages.forEach((rows, index) => blocks.push({
      key: `size-spec-${unit}-${index}`,
      weight: issuedPdfSizeSpecWeight(rows.length),
      startsNewPage: index === 0,
      content: <SizeSpecSection data={data} rows={rows} continued={index > 0} unit={unit} />,
    }));
  }

  const { additionalProcesses } = resolveIssuedPdfProcessPresentation(data.processes);
  const processPages = paginateWeightedRows(additionalProcesses, (row) => textRowWeight([row.processName, row.partnerName, formatProcessInstruction(row)], 3)); const processOversized = processPages.length > 1;
  processPages.forEach((rows, index) => blocks.push({ key: `process-${index}`, weight: 5 + rows.reduce((sum, row) => sum + textRowWeight([row.processName, row.partnerName, formatProcessInstruction(row)], 3), 0), startsNewPage: processOversized && index === 0, content: <ProcessSection data={data} rows={rows} continued={index > 0} /> }));

  const images = includedAttachmentImages ?? [];
  paginateIssuedPdfAttachmentImages(images).forEach((pageImages, index) => blocks.push({
    key: `attachment-images-${index}`,
    weight: ISSUED_PDF_CONTENT_PAGE_CAPACITY,
    startsNewPage: true,
    content: <IncludedAttachmentGrid continued={index > 0} images={pageImages} />,
  }));
  return blocks;
}

function RepeatedHeading({ data }: { readonly data: WorkOrderIssuedPreviewReadModel }) { return <header className={styles.repeatedHeading}><div className={styles.repeatedHeadingBrand}><span className={styles.wordmark}>WAFL</span><strong>{data.header.productName}</strong></div><div className={styles.repeatedHeadingDocument}><span>작업지시서</span><small>{data.document.displayDocumentNumber}</small></div></header>; }
function DocumentFooter({ data, pageNumber, totalPages }: { readonly data: WorkOrderIssuedPreviewReadModel; readonly pageNumber: number; readonly totalPages: number }) { return <footer aria-label={`페이지 ${pageNumber} / ${totalPages}`} className={styles.pageNumberFooter} data-testid="workorder-page-number"><span>{data.document.displayDocumentNumber}</span><span>{formatDate(data.document.issuedAt, data.layoutMetadata.businessTimezone)}</span><span className={styles.footerPage}><strong>{pageNumber} / {totalPages}</strong><b>WAFL</b></span></footer>; }
function CoverFact({ Icon, label, children, wide = false }: { readonly Icon: LucideIcon; readonly label: string; readonly children: ReactNode; readonly wide?: boolean }) { return <div className={`${styles.coverFact} ${wide ? styles.coverFactWide : ""}`}><Icon aria-hidden="true" size={23} strokeWidth={1.8} /><div><dt>{label}</dt><dd>{children}</dd></div></div>; }
function identityLabels(data: WorkOrderIssuedPreviewReadModel) {
  const identity = data.header.identity;
  if (!identity) return ["본생산"];
  if (identity.reorderRound > 0) return [`${identity.reorderRound}차 리오더`];
  const labels = [identity.isSample ? "샘플" : "본생산"];
  if (identity.derivationKind === "rework") labels.push("재작업");
  return labels;
}

export default function IssuedWorkOrderDocument({ data, representativeImageSrc, representativeImageLabel, quantityUnit, coverFacts, includedAttachmentImages }: PreviewProps) {
  const timeZone = data.layoutMetadata.businessTimezone;
  const contentPages = packIssuedPdfBlocks(buildBlocks(data, includedAttachmentImages), ISSUED_PDF_CONTENT_PAGE_CAPACITY);
  const totalPages = contentPages.length + 1;
  const quantity = quantityUnit ? `${number.format(data.header.totalQuantity)}${quantityUnit}` : `${number.format(data.header.totalQuantity)}개`;
  const category = decodeWorkOrderCategory({ productTypeCode: data.header.productTypeCode, itemCode: data.header.itemCode, seasonCode: data.header.seasonCode });
  const productTypeLabel = coverFacts?.productTypeLabel ?? formatProductClassification({ productTypeCode: data.header.productTypeCode, itemCode: data.header.itemCode });
  const { basicProcessPartnerName, additionalProcesses } = resolveIssuedPdfProcessPresentation(data.processes);
  const costPresentation = resolveIssuedPdfCostPresentation({ processes: data.processes });
  const summary = [
    { label: "원단", value: data.materials.fabrics.length, suffix: "종", secondary: data.materials.fabrics[0]?.name ?? "-", Icon: PDF_SEMANTIC_ICONS.fabric },
    { label: "부자재", value: data.materials.accessories.length, suffix: "종", secondary: data.materials.accessories[0]?.name ?? "-", Icon: PDF_SEMANTIC_ICONS.accessory },
    { label: "색상", value: data.sizeColors.colors.length, suffix: "색", secondary: data.sizeColors.colors.slice(0, 2).map((item) => item.displayName).join(", ") || "-", Icon: PDF_SEMANTIC_ICONS.color },
    { label: "사이즈", value: data.sizeColors.sizes.length, suffix: "개", secondary: data.sizeColors.sizes.length > 1 ? `${data.sizeColors.sizes[0].displayLabel} ~ ${data.sizeColors.sizes.at(-1)?.displayLabel}` : data.sizeColors.sizes[0]?.displayLabel ?? "-", Icon: PDF_SEMANTIC_ICONS.size },
    { label: "추가 공정", value: additionalProcesses.length, suffix: "개", secondary: additionalProcesses[0]?.processName ?? "-", Icon: PDF_SEMANTIC_ICONS.process },
  ];

  return <article className={styles.document} data-testid="issued-workorder-preview-a4">
    <section className={`${styles.page} ${styles.coverPage}`} data-page-orientation="portrait">
      <div className={styles.coverBrand}><span className={styles.wordmark}>WAFL</span><span className={styles.coverDocumentType}>작업지시서</span></div>
      <div className={styles.coverProductHeading}><h1>{data.header.productName}</h1><p>{[category.seasonCode, category.targetAudience, category.categoryMajor, category.categoryDetail].filter(Boolean).join(" · ") || productTypeLabel || "제품 정보"}</p><div className={styles.coverMetaRow}><small>{data.document.displayDocumentNumber}</small><div className={styles.identityBadges}>{identityLabels(data).map((label) => <span key={label}>{label}</span>)}</div></div></div>
      <div className={styles.coverMain}>
        <div className={styles.coverImageFrame}>{representativeImageSrc ? <img alt={representativeImageLabel ?? `${data.header.productName} 대표 이미지`} className={styles.representativeImage} data-wafl-representative-image="true" src={representativeImageSrc} /> : <div className={styles.sketchPlaceholder}><Shirt aria-hidden="true" size={44} strokeWidth={1.2} /><span>대표 이미지</span></div>}</div>
        <dl className={styles.coverFactGrid}>
          <CoverFact Icon={Factory} label="기본 공정 업체">{basicProcessPartnerName}</CoverFact><CoverFact Icon={CalendarDays} label="납기일">{formatDate(data.header.dueDate, timeZone)}</CoverFact>
          <CoverFact Icon={Package} label="총 수량">{quantity}</CoverFact><CoverFact Icon={CircleDollarSign} label="장당 공임비">{formatIssuedPdfWon(costPresentation.basicProcessUnitPrice)}</CoverFact>
          <CoverFact Icon={CalendarDays} label="시즌">{value(category.seasonCode)}</CoverFact><CoverFact Icon={Shirt} label="대상">{value(category.targetAudience)}</CoverFact>
          <CoverFact Icon={Layers3} label="대분류">{value(category.categoryMajor)}</CoverFact><CoverFact Icon={Shirt} label="세부품목">{value(category.categoryDetail)}</CoverFact>
          <CoverFact Icon={Hash} label="문서 번호">{data.document.displayDocumentNumber}</CoverFact><CoverFact Icon={WalletCards} label="총 공임비">{formatIssuedPdfWon(costPresentation.basicProcessLaborAmount)}</CoverFact>
        </dl>
      </div>
      <section className={styles.deliveryMemo}><div><Factory aria-hidden="true" size={22} /><h2>공장 전달 메모</h2></div><p>{value(data.header.factoryDeliveryMemo)}</p></section>
      <div aria-label="문서 구성 요약" className={styles.coverSummary}>{summary.map(({ label, value: count, suffix, secondary, Icon }) => <div key={label}><Icon aria-hidden="true" size={22} /><span>{label}</span><strong>{count}{suffix}</strong><small>{secondary}</small></div>)}</div>
      <DocumentFooter data={data} pageNumber={1} totalPages={totalPages} />
    </section>
    {contentPages.map((blocks, pageIndex) => <section className={`${styles.page} ${styles.contentPage}`} data-page-orientation="portrait" key={`page-${pageIndex}`}><RepeatedHeading data={data} />{blocks.map((block) => <div className={styles.block} key={block.key}>{block.content}</div>)}<DocumentFooter data={data} pageNumber={pageIndex + 2} totalPages={totalPages} /></section>)}
  </article>;
}
