import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { Material, Outsourcing, WorkOrder } from "@/types/workorder";



function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(value: number) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return `${numeric.toLocaleString()}원`;
}

function formatQuantity(value: number, suffix?: string) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return suffix ? `${numeric.toLocaleString()} ${suffix}` : numeric.toLocaleString();
}

function formatDateLabel(value?: string | null) {
  const text = value?.trim();
  return text || "-";
}

function renderSummaryRow(items: Array<{ label: string; value: string }>) {
  return `
    <div class="summary-row">
      ${items
        .map(
          (item) => `
            <div class="summary-item">
              <div class="summary-label">${escapeHtml(item.label)}</div>
              <div class="summary-value">${escapeHtml(item.value)}</div>
            </div>`,
        )
        .join("")}
    </div>`;
}

function renderMaterialRows(materials: Material[]) {
  if (materials.length === 0) {
    return `<tr><td colspan="6" class="empty-cell">항목이 없습니다.</td></tr>`;
  }

  return materials
    .map(
      (material) => `
        <tr>
          <td>${escapeHtml(material.vendor || "-")}</td>
          <td class="align-left">${escapeHtml(material.name || "-")}</td>
          <td>${escapeHtml(formatQuantity(material.quantity))}</td>
          <td>${escapeHtml(material.unit || "-")}</td>
          <td>${escapeHtml(formatCurrency(material.unitCost))}</td>
          <td>${escapeHtml(formatCurrency(material.totalCost || material.quantity * material.unitCost))}</td>
        </tr>`,
    )
    .join("");
}

function renderOutsourcingRows(items: Outsourcing[]) {
  if (items.length === 0) {
    return `<tr><td colspan="5" class="empty-cell">항목이 없습니다.</td></tr>`;
  }

  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.vendor || "-")}</td>
          <td class="align-left">${escapeHtml(item.process || "-")}</td>
          <td>${escapeHtml(formatQuantity(item.quantity))}</td>
          <td>${escapeHtml(formatCurrency(item.unitCost))}</td>
          <td>${escapeHtml(formatCurrency(item.totalCost))}</td>
        </tr>`,
    )
    .join("");
}

function renderSectionTable({ title, head, body, footerLabel, footerValue }: { title: string; head: string; body: string; footerLabel: string; footerValue: string; }) {
  return `
    <section class="table-section">
      <div class="table-title">${escapeHtml(title)}</div>
      <table>
        <thead>${head}</thead>
        <tbody>${body}</tbody>
        <tfoot>
          <tr>
            <td colspan="${title === "외주 내역" ? 4 : 5}">${escapeHtml(footerLabel)}</td>
            <td>${escapeHtml(footerValue)}</td>
          </tr>
        </tfoot>
      </table>
    </section>`;
}


export function buildOrderRequestPrintHtml(workOrder: WorkOrder, options?: { requestNote?: string | null }) {
  const initialPreview = getOrderRequestDocumentPreview(workOrder, 0);

  const documentsHtml = initialPreview.documents.map((documentUnit, index) => {
    const preview = getOrderRequestDocumentPreview(workOrder, index);
    const currentPage = preview.currentPage;
    const firstSummaryItems = [
      { label: "품명", value: preview.displayTitle },
      { label: "공임", value: formatCurrency(currentPage.laborCost) },
      { label: "원가", value: formatCurrency(preview.currentDocumentAmount) },
      { label: "수량", value: formatQuantity(currentPage.quantity) },
    ];
    const secondSummaryItems = [
      { label: "원단합", value: formatCurrency(preview.fabricAmountTotal) },
      { label: "부자재합", value: formatCurrency(preview.subsidiaryAmountTotal) },
      { label: "외주합", value: formatCurrency(preview.outsourcingAmountTotal) },
      { label: "로스", value: formatCurrency(currentPage.lossCost) },
    ];

    return `
      <section class="print-page-shell">
        <article class="print-page">
          <div class="page-head">
            <div>
              <div class="meta-label">납기일</div>
              <div class="meta-value">${escapeHtml(formatDateLabel(currentPage.dueDate))}</div>
            </div>
            <div class="title-wrap">
              <div class="doc-title">작 업 지 시 서</div>
              <div class="factory-name">${escapeHtml(currentPage.factoryName || "공장 미지정")}</div>
              <div class="work-title">${escapeHtml(preview.displayTitle)}</div>
            </div>
            <div class="doc-index">${escapeHtml(documentUnit.label)} / ${documentUnit.total}</div>
          </div>
          ${renderSummaryRow(firstSummaryItems)}
          ${renderSummaryRow(secondSummaryItems)}
          <div class="hero-grid">
            <section class="hero-section">
              <div class="section-head">대표 이미지</div>
              <div class="hero-body">
                ${preview.representativeImage ? `<div class="image-frame"><img src="${escapeHtml(preview.representativeImage.url)}" alt="${escapeHtml(preview.representativeImage.name)}" /></div>` : `<div class="empty-hero">대표 이미지가 없습니다.</div>`}
              </div>
            </section>
            <section class="hero-section hero-side">
              <div class="section-head">요청사항</div>
              <div class="hero-side-body request-only-body">
                <div class="request-note">${escapeHtml(options?.requestNote?.trim() || preview.requestNote || "표시할 요청사항이 없습니다.")}</div>
              </div>
            </section>
          </div>
          ${renderSectionTable({ title: "원단 내역", head: `
                <tr>
                  <th style="width:19%">거래처</th>
                  <th style="width:27%">자재명</th>
                  <th style="width:12%">수량</th>
                  <th style="width:10%">단위</th>
                  <th style="width:16%">단가</th>
                  <th style="width:16%">금액</th>
                </tr>`, body: renderMaterialRows(preview.fabricMaterials), footerLabel: "원단 총합", footerValue: formatCurrency(preview.fabricAmountTotal) })}
          ${renderSectionTable({ title: "부자재 내역", head: `
                <tr>
                  <th style="width:19%">거래처</th>
                  <th style="width:27%">자재명</th>
                  <th style="width:12%">수량</th>
                  <th style="width:10%">단위</th>
                  <th style="width:16%">단가</th>
                  <th style="width:16%">금액</th>
                </tr>`, body: renderMaterialRows(preview.subsidiaryMaterials), footerLabel: "부자재 총합", footerValue: formatCurrency(preview.subsidiaryAmountTotal) })}
          ${renderSectionTable({ title: "외주 내역", head: `
                <tr>
                  <th style="width:24%">외주처</th>
                  <th style="width:30%">작업명</th>
                  <th style="width:12%">수량</th>
                  <th style="width:17%">단가</th>
                  <th style="width:17%">금액</th>
                </tr>`, body: renderOutsourcingRows(preview.outsourcingItems), footerLabel: "외주 총합", footerValue: formatCurrency(preview.outsourcingAmountTotal) })}
        </article>
      </section>`;
  }).join("");

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>발주서 PDF 출력</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,'Noto Sans KR',sans-serif;color:#1c1917;background:#fff;overflow:visible}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.print-page-shell{width:210mm;margin:0;padding:0;display:block;page-break-inside:avoid;break-inside:avoid;page-break-after:always;break-after:page}.print-page-shell:last-child{page-break-after:auto;break-after:auto}.print-page{width:210mm;height:297mm;margin:0;padding:8mm;background:#fff;border:0;overflow:hidden;display:block}.page-head{display:grid;grid-template-columns:30mm 1fr 28mm;align-items:start;gap:4mm;border:1px solid #78716c;padding:3.2mm}.meta-label{font-size:10px;font-weight:700;color:#78716c}.meta-value{margin-top:3px;font-size:12px;font-weight:700}.title-wrap{text-align:center}.doc-title{font-size:19px;font-weight:800;letter-spacing:.18em}.work-title{margin-top:2px;font-size:12px;font-weight:700}.factory-name{margin-top:2px;font-size:11px;font-weight:700;color:#78716c}.doc-index{text-align:right;font-size:10px;color:#78716c;font-weight:700;padding-top:1px}.summary-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #a8a29e;border-top:0}.summary-item{display:flex;gap:8px;align-items:center;min-height:10mm;padding:2.5mm 3.2mm;border-right:1px solid #e7e5e4}.summary-item:last-child{border-right:0}.summary-label{flex:0 0 auto;font-size:10px;font-weight:700;color:#78716c}.summary-value{flex:1 1 auto;text-align:right;font-size:12px;font-weight:700;word-break:break-word}.hero-grid{display:grid;grid-template-columns:1.12fr .88fr;border:1px solid #78716c;border-top:0}.hero-section{min-width:0;background:#fcfaf5}.hero-section:first-child{border-right:1px solid #78716c}.section-head{padding:2.4mm 3.2mm;background:#f5f5f4;border-bottom:1px solid #d6d3d1;font-size:11px;font-weight:700}.hero-body,.hero-side-body{padding:3mm;background:#fcfaf5}.image-frame{height:63mm;overflow:hidden;border:1px solid #d6d3d1;background:#f5f5f4;display:flex;align-items:center;justify-content:center}.image-frame img{width:100%;height:100%;object-fit:contain;background:#fff;display:block}.empty-hero{height:63mm;border:1px dashed #d6d3d1;background:#fff;color:#78716c;font-size:11px;display:flex;align-items:center;justify-content:center;text-align:center}.request-only-body{display:flex}.request-note{flex:1 1 auto;min-height:63mm;white-space:pre-wrap;border:1px solid #d6d3d1;background:#fff;padding:3mm;font-size:11px;line-height:1.55;word-break:break-word}.table-section{margin-top:3mm;border:1px solid #78716c}.table-title{padding:2.4mm 3.2mm;border-bottom:1px solid #78716c;background:#f5f5f4;font-size:11px;font-weight:700}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px}th,td{border-bottom:1px solid #e7e5e4;padding:2.2mm 2.4mm;text-align:center;vertical-align:middle}thead th{background:#fafaf9;color:#44403c;font-weight:700}tfoot td{background:#fafaf9;font-weight:700}.align-left{text-align:left;word-break:break-word}.empty-cell{padding:7mm 2.4mm;color:#78716c}@media screen{body{display:flex;flex-direction:column;align-items:center}}@media print{html,body{background:#fff;overflow:visible}.print-page-shell{margin:0}.print-page{margin:0}}</style></head><body>${documentsHtml}<script>(function(){var printStarted=false;var closeTimer=null;function safeCloseWindow(){if(closeTimer){clearTimeout(closeTimer)}closeTimer=setTimeout(function(){try{window.close()}catch(error){console.error('[order-request-print] window close failed',error)}},80)}function finalizePrint(){if(printStarted){return}printStarted=true;setTimeout(function(){try{window.focus();window.print()}catch(error){console.error('[order-request-print] print failed',error)}},120)}function waitForImages(){var images=Array.prototype.slice.call(document.images||[]);if(!images.length){return Promise.resolve()}return Promise.all(images.map(function(image){if(image.complete){return Promise.resolve()}return new Promise(function(resolve){var done=function(){image.removeEventListener('load',done);image.removeEventListener('error',done);resolve()};image.addEventListener('load',done,{once:true});image.addEventListener('error',done,{once:true});setTimeout(done,2000)})}))}function waitForFonts(){if(!document.fonts||!document.fonts.ready){return Promise.resolve()}return document.fonts.ready.catch(function(){return undefined})}Promise.all([waitForImages(),waitForFonts()]).catch(function(error){console.error('[order-request-print] resource wait failed',error)}).finally(function(){requestAnimationFrame(function(){requestAnimationFrame(function(){finalizePrint()})})});window.addEventListener('afterprint',safeCloseWindow,{once:true});window.addEventListener('pagehide',function(){if(closeTimer){clearTimeout(closeTimer)}});setTimeout(finalizePrint,2200)})();</script></body></html>`;
}
