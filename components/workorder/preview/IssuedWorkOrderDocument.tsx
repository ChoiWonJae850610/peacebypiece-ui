import type { ReactNode } from "react";

import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";
import { formatProcessInstruction } from "./processInstruction";
import styles from "./IssuedWorkOrderPreview.module.css";

export type WorkOrderPreviewCoverFacts = {
  readonly productTypeLabel?: string;
  readonly factoryName?: string;
  readonly managerName?: string;
};

type PreviewProps = {
  readonly data: WorkOrderIssuedPreviewReadModel;
  readonly representativeImageSrc?: string;
  readonly quantityUnit?: string;
  readonly coverFacts?: WorkOrderPreviewCoverFacts;
};

type DocumentBlock = {
  readonly key: string;
  readonly weight: number;
  readonly content: ReactNode;
};

const number = new Intl.NumberFormat("ko-KR");
const value = (input: string | null | undefined) => input?.trim() || "-";
const unitValue = (quantity: string, unit: string) => `${quantity} ${unit}`;

export function formatRevisionLabel(revisionNumber: number): string {
  return `${revisionNumber}차`;
}

function formatDate(input: string | null | undefined, timeZone = "Asia/Seoul") {
  if (!input) return "-";
  const parts = new Intl.DateTimeFormat("ko-KR", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(input));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}.${part("month")}.${part("day")}`;
}

function chunk<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function packBlocks(blocks: readonly DocumentBlock[], capacity = 32): readonly (readonly DocumentBlock[])[] {
  const pages: DocumentBlock[][] = [];
  let page: DocumentBlock[] = [];
  let weight = 0;
  for (const block of blocks) {
    if (page.length && weight + block.weight > capacity) {
      pages.push(page);
      page = [];
      weight = 0;
    }
    page.push(block);
    weight += block.weight;
  }
  if (page.length) pages.push(page);
  return pages;
}

function SectionHeading({ title, continued = false }: { readonly title: string; readonly continued?: boolean }) {
  return <h2>{title}{continued ? " (계속)" : ""}</h2>;
}

function MaterialSection({ title, rows, continued }: { readonly title: string; readonly rows: WorkOrderIssuedPreviewReadModel["materials"]["fabrics"]; readonly continued: boolean }) {
  return (
    <section className={styles.documentSection}>
      <SectionHeading title={title} continued={continued} />
      <table>
        <thead><tr><th>품명</th><th>거래처</th><th>색상·옵션·규격</th><th>사용 부위</th><th>필요수량</th><th>여유수량</th><th>메모</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{value(row.partnerName)}</td><td>{value(row.colorOption)}</td><td>{value(row.usageArea)}</td><td className={styles.numeric}>{unitValue(row.requiredQuantity, row.unitCode)}</td><td className={styles.numeric}>{unitValue(row.allowanceQuantity, row.unitCode)}</td><td>{value(row.memo)}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function SizeColorSection({ data }: { readonly data: WorkOrderIssuedPreviewReadModel }) {
  const matrix = data.sizeColors;
  if (!matrix.colors.length || !matrix.sizes.length) return null;
  return (
    <section className={styles.documentSection}>
      <SectionHeading title="색상·사이즈 수량" />
      <div className={styles.tableWrap}><table><thead><tr><th>색상</th>{matrix.sizes.map((size) => <th key={size.id}>{size.displayLabel}</th>)}<th>합계</th></tr></thead><tbody>
        {matrix.colors.map((color) => {
          const cells = matrix.sizes.map((size) => matrix.quantityCells.find((cell) => cell.colorId === color.id && cell.sizeRowId === size.id));
          return <tr key={color.id}><td>{color.displayName}</td>{cells.map((cell, index) => <td className={styles.numeric} key={matrix.sizes[index].id}>{cell?.quantity ?? "-"}</td>)}<td className={styles.numeric}>{cells.reduce((sum, cell) => sum + Number(cell?.quantity ?? 0), 0)}</td></tr>;
        })}
        <tr><th>합계</th>{matrix.sizes.map((size) => <th className={styles.numeric} key={size.id}>{matrix.quantityCells.filter((cell) => cell.sizeRowId === size.id).reduce((sum, cell) => sum + Number(cell.quantity), 0)}</th>)}<th className={styles.numeric}>{matrix.matrixTotal}</th></tr>
      </tbody></table></div>
      <p className={matrix.totalsMatch ? styles.validationOk : styles.validationWarning}>발주수량 대조 · {matrix.matrixTotal} / {matrix.expectedTotal}</p>
    </section>
  );
}

function SizeSpecSection({ data, rows, continued }: { readonly data: WorkOrderIssuedPreviewReadModel; readonly rows: WorkOrderIssuedPreviewReadModel["sizeSpecifications"]["pomColumns"]; readonly continued: boolean }) {
  const spec = data.sizeSpecifications;
  return (
    <section className={styles.documentSection}>
      <SectionHeading title={`사이즈 스펙 (${spec.measurementUnit})`} continued={continued} />
      <div className={styles.tableWrap}><table><thead><tr><th>측정 부위</th>{spec.sizes.map((size) => <th key={size.id}>{size.displayLabel}</th>)}</tr></thead><tbody>
        {rows.map((pom) => <tr key={pom.id}><td>{pom.displayName}</td>{spec.sizes.map((size) => { const cell = spec.cells.find((item) => item.sizeRowId === size.id && item.pomColumnId === pom.id); return <td className={styles.numeric} key={size.id}>{cell?.displayValue ?? cell?.decimalValue ?? "-"}</td>; })}</tr>)}
      </tbody></table></div>
    </section>
  );
}

function ProcessSection({ data, rows, continued }: { readonly data: WorkOrderIssuedPreviewReadModel; readonly rows: WorkOrderIssuedPreviewReadModel["processes"]; readonly continued: boolean }) {
  const timeZone = data.layoutMetadata.businessTimezone;
  return (
    <section className={styles.documentSection}>
      <SectionHeading title="제작 공정·추가 공정" continued={continued} />
      <table className={styles.processTable}><colgroup><col /><col /><col /><col /><col /><col /></colgroup><thead><tr><th>순서</th><th>공정명</th><th>업체</th><th>수량</th><th>납기</th><th>작업 메모</th></tr></thead><tbody>
        {rows.map((process) => <tr key={process.id}><td>{process.displayOrder + 1}</td><td>{process.processName}</td><td>{value(process.partnerName)}</td><td className={styles.numeric}>{unitValue(process.quantity, process.unitCode)}</td><td>{formatDate(process.dueDate, timeZone)}</td><td>{value(formatProcessInstruction(process))}</td></tr>)}
      </tbody></table>
    </section>
  );
}

function buildBlocks(data: WorkOrderIssuedPreviewReadModel): readonly DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const addMaterials = (key: string, title: string, rows: WorkOrderIssuedPreviewReadModel["materials"]["fabrics"]) => {
    chunk(rows, 6).forEach((group, index) => blocks.push({ key: `${key}-${index}`, weight: 4 + group.length * 2, content: <MaterialSection title={title} rows={group} continued={index > 0} /> }));
  };
  addMaterials("fabric", "원단", data.materials.fabrics);
  addMaterials("accessory", "부자재", data.materials.accessories);
  if (data.sizeColors.colors.length && data.sizeColors.sizes.length) blocks.push({ key: "size-color", weight: 4 + data.sizeColors.colors.length * 2, content: <SizeColorSection data={data} /> });
  chunk(data.sizeSpecifications.pomColumns, 7).forEach((rows, index) => blocks.push({ key: `size-spec-${index}`, weight: 4 + rows.length * 2, content: <SizeSpecSection data={data} rows={rows} continued={index > 0} /> }));
  chunk(data.processes, 6).forEach((rows, index) => blocks.push({ key: `process-${index}`, weight: 4 + rows.length * 3, content: <ProcessSection data={data} rows={rows} continued={index > 0} /> }));
  return blocks;
}

function RepeatedHeading({ data, pageNumber }: { readonly data: WorkOrderIssuedPreviewReadModel; readonly pageNumber: number }) {
  return <header className={styles.repeatedHeading}><strong>{data.header.productName}</strong><span>작업지시서</span><small>{data.document.displayDocumentNumber} · {pageNumber}</small></header>;
}

export default function IssuedWorkOrderDocument({ data, representativeImageSrc, quantityUnit, coverFacts }: PreviewProps) {
  const timeZone = data.layoutMetadata.businessTimezone;
  const contentPages = packBlocks(buildBlocks(data));
  const memos = [data.header.factoryDeliveryMemo, data.header.memo].map((memo) => memo?.trim()).filter(Boolean) as string[];
  const quantity = quantityUnit ? `${number.format(data.header.totalQuantity)}${quantityUnit}` : number.format(data.header.totalQuantity);

  return (
    <article data-testid="issued-workorder-preview-a4" className={styles.document}>
      <section className={`${styles.page} ${styles.coverPage}`} data-page-orientation="landscape">
        <div className={styles.coverSketch}>
          <div className={styles.coverSectionLabel}>제품 스케치</div>
          {representativeImageSrc ? <div aria-label={`${data.header.productName} 제품 스케치`} className={styles.representativeImage} role="img" style={{ backgroundImage: `url(${representativeImageSrc})` }} /> : <div className={styles.sketchPlaceholder}><span>제품 스케치·대표 이미지</span><small>첨부 자료 {data.assets.filter((asset) => asset.includeInDocument).length}건</small></div>}
        </div>
        <div className={styles.coverInfo}>
          <header className={styles.documentHeader}><p>작업지시서</p><h1>{data.header.productName}</h1><small>{[data.header.seasonCode, data.header.itemCode].filter(Boolean).join(" · ")}</small></header>
          <dl className={styles.documentMeta}>
            <div><dt>문서번호</dt><dd>{data.document.displayDocumentNumber}</dd></div>
            <div><dt>개정차수</dt><dd>{formatRevisionLabel(data.document.revisionNumber)}</dd></div>
            <div><dt>발행일</dt><dd>{formatDate(data.document.issuedAt, timeZone)}</dd></div>
            <div><dt>납기일</dt><dd>{formatDate(data.header.dueDate, timeZone)}</dd></div>
            <div><dt>발주수량</dt><dd>{quantity}</dd></div>
            {(coverFacts?.productTypeLabel || data.header.productTypeCode) ? <div><dt>제품 구분</dt><dd>{coverFacts?.productTypeLabel || data.header.productTypeCode}</dd></div> : null}
            {coverFacts?.factoryName ? <div><dt>제작공장</dt><dd>{coverFacts.factoryName}</dd></div> : null}
            {coverFacts?.managerName ? <div><dt>담당자</dt><dd>{coverFacts.managerName}</dd></div> : null}
          </dl>
          {data.sizeColors.colors.length ? <section aria-label="제품 색상" className={styles.colorSummary}><span>색상</span><div>{data.sizeColors.colors.map((color) => <span className={styles.colorChip} key={color.id}><i style={{ backgroundColor: color.hexValue ?? "#d8d3ca" }} />{color.displayName}</span>)}</div></section> : null}
          <section className={styles.deliveryMemo}><h2>공장 전달 메모</h2>{memos.length ? memos.map((memo, index) => <p key={`${index}-${memo.slice(0, 12)}`}>{memo}</p>) : <p>-</p>}</section>
        </div>
      </section>
      {contentPages.map((blocks, pageIndex) => <section className={`${styles.page} ${styles.contentPage}`} data-page-orientation="portrait" key={`page-${pageIndex}`}><RepeatedHeading data={data} pageNumber={pageIndex + 2} />{blocks.map((block) => <div className={styles.block} key={block.key}>{block.content}</div>)}</section>)}
    </article>
  );
}
