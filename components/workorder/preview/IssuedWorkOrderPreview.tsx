"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";
import styles from "./IssuedWorkOrderPreview.module.css";

type Envelope = { readonly ok: true; readonly data: WorkOrderIssuedPreviewReadModel } | { readonly ok: false; readonly error?: { readonly message?: string } };
const number = new Intl.NumberFormat("ko-KR");
const money = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });
const value = (input: string | null | undefined) => input?.trim() || "-";

function MaterialTable({ title, rows }: { title: string; rows: WorkOrderIssuedPreviewReadModel["materials"]["fabrics"] }) {
  if (rows.length === 0) return null;
  return <section className={styles.section}><h2>{title}</h2><div className={styles.tableWrap}><table><thead><tr><th>품명</th><th>색상/옵션</th><th>필요</th><th>여유</th><th>재고</th><th>발주</th><th>단가</th><th>금액</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td>{row.name}</td><td>{value(row.colorOption)}</td><td>{row.requiredQuantity} {row.unitCode}</td><td>{row.allowanceQuantity}</td><td>{row.inventoryUsageQuantity}</td><td>{row.orderQuantity}</td><td>{money.format(Number(row.unitPrice))}</td><td>{money.format(Number(row.amount))}</td></tr>)}</tbody></table></div></section>;
}

export default function IssuedWorkOrderPreview({ workOrderId, revisionId }: { readonly workOrderId: string; readonly revisionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<WorkOrderIssuedPreviewReadModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; fetch(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/revisions/${encodeURIComponent(revisionId)}/preview`, { cache: "no-store" }).then(async (response) => ({ response, body: await response.json() as Envelope })).then(({ response, body }) => { if (!active) return; if (!response.ok || !body.ok) setError(body.ok ? "Preview를 불러오지 못했습니다." : body.error?.message || "Preview를 불러오지 못했습니다."); else setData(body.data); }).catch(() => { if (active) setError("Preview를 불러오지 못했습니다."); }); return () => { active = false; }; }, [workOrderId, revisionId]);
  if (error) return <main className={styles.shell}><div className={styles.message}><FileText aria-hidden="true"/><strong>{error}</strong><button type="button" onClick={()=>router.back()}>돌아가기</button></div></main>;
  if (!data) return <main className={styles.shell}><div className={styles.message}>작업지시서를 불러오는 중입니다.</div></main>;
  const matrix = data.sizeColors;
  return <main className={styles.shell}>
    <nav className={styles.toolbar} aria-label="Preview 도구"><button type="button" onClick={()=>router.back()} title="돌아가기"><ArrowLeft aria-hidden="true"/><span>돌아가기</span></button><div><span>발행 Revision Preview</span><strong>{data.document.displayDocumentNumber}</strong></div><button type="button" onClick={()=>window.print()} title="인쇄"><Printer aria-hidden="true"/><span>인쇄</span></button></nav>
    <article className={styles.page} data-testid="issued-workorder-preview-a4">
      <header className={styles.documentHeader}><div><p>{data.document.title}</p><h1>{data.header.productName}</h1></div><dl><div><dt>문서번호</dt><dd>{data.document.displayDocumentNumber}</dd></div><div><dt>Revision</dt><dd>R{data.document.revisionNumber}</dd></div><div><dt>발행일</dt><dd>{new Intl.DateTimeFormat("ko-KR", { timeZone: data.layoutMetadata.businessTimezone, dateStyle: "medium" }).format(new Date(data.document.issuedAt))}</dd></div></dl></header>
      <section className={styles.summary}><div><span>제품 분류</span><strong>{value(data.header.productTypeCode)}</strong></div><div><span>시즌</span><strong>{value(data.header.seasonCode)}</strong></div><div><span>품목 코드</span><strong>{value(data.header.itemCode)}</strong></div><div><span>수량</span><strong>{number.format(data.header.totalQuantity)}</strong></div><div><span>납기</span><strong>{value(data.header.dueDate)}</strong></div><div><span>예상 금액</span><strong>{money.format(Number(data.amounts.estimatedTotal))}원</strong></div></section>
      {data.assets.length > 0 ? <section className={styles.section}><h2>이미지·첨부</h2><div className={styles.assets}>{data.assets.map((asset,index)=><div key={`${asset.assetType}-${index}`}><FileText aria-hidden="true"/><span>{asset.filename}</span>{asset.isRepresentative?<b>대표</b>:null}</div>)}</div></section> : null}
      <MaterialTable title="원단" rows={data.materials.fabrics}/><MaterialTable title="부자재" rows={data.materials.accessories}/>
      {matrix.colors.length && matrix.sizes.length ? <section className={styles.section}><h2>색상·사이즈 구성</h2><div className={styles.tableWrap}><table><thead><tr><th>색상</th>{matrix.sizes.map((size)=><th key={size.id}>{size.displayLabel}</th>)}</tr></thead><tbody>{matrix.colors.map((color)=><tr key={color.id}><td>{color.displayName}</td>{matrix.sizes.map((size)=><td key={size.id}>{matrix.quantityCells.find((cell)=>cell.colorId===color.id&&cell.sizeRowId===size.id)?.quantity ?? "-"}</td>)}</tr>)}</tbody></table></div></section>:null}
      {data.sizeSpecifications.sizes.length && data.sizeSpecifications.pomColumns.length ? <section className={styles.section}><h2>사이즈 스펙 ({data.sizeSpecifications.measurementUnit})</h2><div className={styles.tableWrap}><table><thead><tr><th>사이즈</th>{data.sizeSpecifications.pomColumns.map((pom)=><th key={pom.id}>{pom.displayName}</th>)}</tr></thead><tbody>{data.sizeSpecifications.sizes.map((size)=><tr key={size.id}><td>{size.displayLabel}</td>{data.sizeSpecifications.pomColumns.map((pom)=>{const cell=data.sizeSpecifications.cells.find((item)=>item.sizeRowId===size.id&&item.pomColumnId===pom.id);return <td key={pom.id}>{cell?.displayValue ?? cell?.decimalValue ?? "-"}</td>})}</tr>)}</tbody></table></div></section>:null}
      {data.processes.length ? <section className={styles.section}><h2>제작 공정</h2><div className={styles.processes}>{data.processes.map((process)=><div key={process.id}><b>{process.processName}</b><span>{value(process.partnerName)}</span><span>{process.quantity} {process.unitCode}</span><span>{value(process.dueDate)}</span></div>)}</div></section>:null}
      {data.header.memo ? <section className={styles.section}><h2>작업 메모</h2><p className={styles.memo}>{data.header.memo}</p></section>:null}
      <footer className={styles.footer}><span>발행 상태</span><strong>발행 완료 · R{data.document.revisionNumber}</strong><span>{data.document.displayDocumentNumber}</span></footer>
    </article>
  </main>;
}
