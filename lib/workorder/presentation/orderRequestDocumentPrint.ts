import { getOrderRequestDocumentPreview } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { Attachment, Material, Outsourcing, WorkOrder } from "@/types/workorder";

type OrderRequestRenderedAttachmentPage = {
  attachmentId: string;
  attachmentName: string;
  attachmentType: Attachment["type"];
  pageIndex: number;
  totalPages: number;
  imageUrl: string;
};

type OrderRequestPrintAttachmentRender = {
  attachmentId: string;
  attachmentName: string;
  attachmentType: Attachment["type"];
  pages: OrderRequestRenderedAttachmentPage[];
};

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

function getAttachmentTypeBadge(attachment: { type?: Attachment["type"]; attachmentType?: Attachment["type"] }) {
  return (attachment.attachmentType ?? attachment.type) === "image" ? "이미지" : "PDF";
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

function renderSectionTable({
  title,
  head,
  body,
  footerLabel,
  footerValue,
}: {
  title: string;
  head: string;
  body: string;
  footerLabel: string;
  footerValue: string;
}) {
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

function renderAttachmentPages(renderedAttachments: OrderRequestPrintAttachmentRender[]) {
  if (renderedAttachments.length === 0) {
    return "";
  }

  return renderedAttachments
    .flatMap((attachment, attachmentIndex) =>
      attachment.pages.map((page) => {
        const attachmentNumber = attachmentIndex + 1;
        const headerHtml = `
          <div class="appendix-head">
            <div class="appendix-meta">
              <div class="meta-label">첨부 문서</div>
              <div class="meta-value">${attachmentNumber}/${renderedAttachments.length}</div>
            </div>
            <div class="appendix-title-wrap">
              <div class="appendix-title">첨 부 파 일</div>
              <div class="appendix-name">${escapeHtml(attachment.attachmentName || `첨부파일 ${attachmentNumber}`)}</div>
              <div class="appendix-page-index">페이지 ${page.pageIndex}/${page.totalPages}</div>
            </div>
            <div class="appendix-type-badge">${escapeHtml(getAttachmentTypeBadge(attachment))}</div>
          </div>`;

        return `
          <article class="print-page appendix-page">
            ${headerHtml}
            <div class="appendix-body appendix-image-body">
              <div class="appendix-viewer image-viewer">
                <img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(attachment.attachmentName || `첨부파일 ${attachmentNumber}`)} ${page.pageIndex}" />
              </div>
            </div>
          </article>`;
      }),
    )
    .join("");
}

function getCanvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("PDF 캔버스 컨텍스트를 생성할 수 없습니다.");
  }
  return context;
}

async function readAttachmentBytes(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`첨부파일을 불러오지 못했습니다. (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

let pdfJsLoadPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfJs() {
  if (!pdfJsLoadPromise) {
    pdfJsLoadPromise = import("pdfjs-dist").then((pdfjs) => {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
      }
      return pdfjs;
    });
  }

  return pdfJsLoadPromise;
}

async function renderPdfAttachmentPages(attachment: Attachment): Promise<OrderRequestRenderedAttachmentPage[]> {
  const pdfjs = await loadPdfJs();
  const bytes = await readAttachmentBytes(attachment.url);
  const loadingTask = pdfjs.getDocument({ data: bytes });

  try {
    const pdf = await loadingTask.promise;
    const renderedPages: OrderRequestRenderedAttachmentPage[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const maxWidth = 1200;
      const scale = Math.min(2, Math.max(1.2, maxWidth / Math.max(baseViewport.width, 1)));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = getCanvasContext(canvas);

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      renderedPages.push({
        attachmentId: attachment.id,
        attachmentName: attachment.name,
        attachmentType: attachment.type,
        pageIndex: pageNumber,
        totalPages: pdf.numPages,
        imageUrl: canvas.toDataURL("image/png"),
      });

      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }

    return renderedPages;
  } finally {
    await loadingTask.destroy();
  }
}

async function renderImageAttachmentPages(attachment: Attachment): Promise<OrderRequestRenderedAttachmentPage[]> {
  return [
    {
      attachmentId: attachment.id,
      attachmentName: attachment.name,
      attachmentType: attachment.type,
      pageIndex: 1,
      totalPages: 1,
      imageUrl: attachment.url,
    },
  ];
}

export async function buildOrderRequestPrintAttachments(attachments: Attachment[]) {
  const renderedAttachments: OrderRequestPrintAttachmentRender[] = [];

  for (const attachment of attachments) {
    const pages = attachment.type === "pdf" ? await renderPdfAttachmentPages(attachment) : await renderImageAttachmentPages(attachment);

    renderedAttachments.push({
      attachmentId: attachment.id,
      attachmentName: attachment.name,
      attachmentType: attachment.type,
      pages,
    });
  }

  return renderedAttachments;
}

export function buildOrderRequestPrintHtml(
  workOrder: WorkOrder,
  renderedAttachments: OrderRequestPrintAttachmentRender[] = [],
) {
  const initialPreview = getOrderRequestDocumentPreview(workOrder, 0);

  const documentsHtml = initialPreview.documents
    .map((documentUnit, index) => {
      const preview = getOrderRequestDocumentPreview(workOrder, index);
      const currentPage = preview.currentPage;
      const attachmentSummaryLines = preview.visibleAttachments.map((attachment) => ({
        id: attachment.id,
        typeLabel: getAttachmentTypeBadge({ attachmentType: attachment.type }),
        scopeLabel: attachment.scope === "memo" ? "메모" : "첨부",
        name: attachment.name,
      }));

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
                ${
                  preview.representativeImage
                    ? `<div class="image-frame"><img src="${escapeHtml(preview.representativeImage.url)}" alt="${escapeHtml(preview.representativeImage.name)}" /></div>`
                    : `<div class="empty-hero">대표 이미지가 없습니다.</div>`
                }
              </div>
            </section>
            <section class="hero-section hero-side">
              <div class="section-head">첨부파일 / 요청사항</div>
              <div class="hero-side-body">
                <div class="subsection">
                  <div class="subsection-head">첨부파일 목록</div>
                  ${
                    attachmentSummaryLines.length > 0
                      ? `<div class="attachment-list">
                          ${attachmentSummaryLines
                            .map(
                              (attachment, attachmentIndex) => `
                                <div class="attachment-item">
                                  <span class="attachment-index">${attachmentIndex + 1}.</span>
                                  <span class="attachment-badge">${escapeHtml(attachment.typeLabel)}</span>
                                  <span class="attachment-name"><strong>${escapeHtml(attachment.scopeLabel)}</strong> ${escapeHtml(attachment.name)}</span>
                                </div>`,
                            )
                            .join("")}
                        </div>`
                      : `<div class="empty-inline">표시할 첨부파일이 없습니다.</div>`
                  }
                </div>
                <div class="subsection request-note-wrap">
                  <div class="subsection-head">요청사항</div>
                  <div class="request-note">${escapeHtml(preview.requestNote || "표시할 요청사항이 없습니다.")}</div>
                </div>
              </div>
            </section>
          </div>

          ${renderSectionTable({
            title: "원단 내역",
            head: `
              <tr>
                <th style="width:19%">거래처</th>
                <th style="width:27%">자재명</th>
                <th style="width:12%">수량</th>
                <th style="width:10%">단위</th>
                <th style="width:16%">단가</th>
                <th style="width:16%">금액</th>
              </tr>`,
            body: renderMaterialRows(preview.fabricMaterials),
            footerLabel: "원단 총합",
            footerValue: formatCurrency(preview.fabricAmountTotal),
          })}

          ${renderSectionTable({
            title: "부자재 내역",
            head: `
              <tr>
                <th style="width:19%">거래처</th>
                <th style="width:27%">자재명</th>
                <th style="width:12%">수량</th>
                <th style="width:10%">단위</th>
                <th style="width:16%">단가</th>
                <th style="width:16%">금액</th>
              </tr>`,
            body: renderMaterialRows(preview.subsidiaryMaterials),
            footerLabel: "부자재 총합",
            footerValue: formatCurrency(preview.subsidiaryAmountTotal),
          })}

          ${renderSectionTable({
            title: "외주 내역",
            head: `
              <tr>
                <th style="width:24%">외주처</th>
                <th style="width:30%">작업명</th>
                <th style="width:12%">수량</th>
                <th style="width:17%">단가</th>
                <th style="width:17%">금액</th>
              </tr>`,
            body: renderOutsourcingRows(preview.outsourcingItems),
            footerLabel: "외주 총합",
            footerValue: formatCurrency(preview.outsourcingAmountTotal),
          })}
        </article>`;
    })
    .join("");

  const attachmentAppendixHtml = renderAttachmentPages(renderedAttachments);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>발주서 PDF 출력</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: Arial, 'Noto Sans KR', sans-serif; color: #1c1917; }
    body { background: #f5f2eb; }
    .print-page { width: 190mm; min-height: 277mm; margin: 0 auto 8mm; background: #fff; border: 1px solid #78716c; page-break-after: always; break-after: page; }
    .print-page:last-child { page-break-after: auto; break-after: auto; margin-bottom: 0; }
    .page-head, .appendix-head { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: start; padding: 16px 18px; border-bottom: 1px solid #78716c; }
    .meta-label { font-size: 11px; font-weight: 700; color: #78716c; }
    .meta-value { margin-top: 6px; font-size: 13px; font-weight: 700; }
    .title-wrap, .appendix-title-wrap { text-align: center; }
    .doc-title, .appendix-title { font-size: 24px; font-weight: 900; letter-spacing: 0.28em; }
    .factory-name { margin-top: 4px; font-size: 12px; font-weight: 700; color: #78716c; }
    .work-title, .appendix-name { margin-top: 8px; font-size: 18px; font-weight: 700; }
    .appendix-page-index { margin-top: 6px; font-size: 11px; font-weight: 700; color: #78716c; }
    .doc-index { text-align: right; font-size: 11px; color: #78716c; font-weight: 700; padding-top: 2px; }
    .appendix-type-badge { justify-self: end; align-self: center; border: 1px solid #d6d3d1; background: #fafaf9; color: #57534e; padding: 3px 8px; font-size: 11px; font-weight: 700; }
    .summary-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; border-bottom: 1px solid #a8a29e; }
    .summary-item { display: flex; gap: 10px; align-items: center; min-height: 38px; padding: 10px 14px; border-right: 1px solid #e7e5e4; }
    .summary-item:last-child { border-right: 0; }
    .summary-label { flex: 0 0 auto; font-size: 11px; font-weight: 700; color: #78716c; }
    .summary-value { flex: 1 1 auto; text-align: right; font-size: 14px; font-weight: 700; word-break: break-word; }
    .hero-grid { display: grid; grid-template-columns: 1.28fr 0.92fr; border-bottom: 1px solid #78716c; }
    .hero-section { min-width: 0; }
    .hero-section:first-child { border-right: 1px solid #78716c; }
    .section-head { padding: 8px 12px; background: #f5f5f4; border-bottom: 1px solid #d6d3d1; font-size: 13px; font-weight: 700; }
    .hero-body { padding: 14px; background: #fcfaf5; }
    .image-frame { height: 112mm; overflow: hidden; border: 1px solid #d6d3d1; background: #f5f5f4; display: flex; align-items: center; justify-content: center; }
    .image-frame img { max-width: 100%; max-height: 100%; object-fit: contain; background: #fff; }
    .empty-hero, .empty-inline { border: 1px dashed #d6d3d1; background: #fff; color: #78716c; font-size: 12px; display: flex; align-items: center; justify-content: center; text-align: center; }
    .empty-hero { height: 112mm; }
    .hero-side-body { display: grid; grid-template-rows: 1.12fr 0.88fr; min-height: 120mm; background: #fcfaf5; }
    .subsection { padding: 12px 14px; }
    .subsection + .subsection { border-top: 1px solid #e7e5e4; }
    .subsection-head { margin-bottom: 8px; font-size: 11px; font-weight: 800; letter-spacing: .02em; color: #44403c; }
    .attachment-list { display: grid; gap: 8px; }
    .attachment-item { display: grid; grid-template-columns: auto auto 1fr; gap: 8px; align-items: start; min-height: 38px; border: 1px solid #e7e5e4; background: #fff; padding: 8px 10px; font-size: 12px; }
    .attachment-index { color: #78716c; }
    .attachment-badge { display: inline-block; border: 1px solid #d6d3d1; background: #fafaf9; color: #57534e; padding: 2px 6px; font-size: 10px; font-weight: 700; }
    .attachment-name { word-break: break-all; }
    .request-note-wrap { min-height: 0; }
    .request-note { min-height: 46mm; white-space: pre-wrap; border: 1px solid #d6d3d1; background: #fff; padding: 10px 12px; font-size: 12px; line-height: 1.65; }
    .table-section { margin: 12px; border: 1px solid #78716c; break-inside: avoid-page; }
    .table-title { padding: 8px 12px; border-bottom: 1px solid #78716c; background: #f5f5f4; font-size: 13px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
    th, td { border-bottom: 1px solid #e7e5e4; padding: 8px 10px; text-align: center; vertical-align: middle; }
    thead th { background: #fafaf9; color: #44403c; font-weight: 700; }
    tfoot td { background: #fafaf9; font-weight: 700; }
    .align-left { text-align: left; word-break: break-word; }
    .empty-cell { padding: 24px 10px; color: #78716c; }
    .appendix-page { display: flex; flex-direction: column; }
    .appendix-body { flex: 1 1 auto; padding: 14px; background: #fcfaf5; }
    .appendix-viewer { height: 100%; border: 1px solid #d6d3d1; background: #fff; overflow: hidden; }
    .appendix-image-body { min-height: 228mm; }
    .image-viewer { display: flex; align-items: center; justify-content: center; }
    .image-viewer img { max-width: 100%; max-height: 100%; object-fit: contain; }
    @media print {
      body { background: #fff; }
      .print-page { margin: 0 auto; }
    }
  </style>
</head>
<body>
${documentsHtml}
${attachmentAppendixHtml}
<script>
  (function () {
    var printStarted = false;
    var closeTimer = null;

    function safeCloseWindow() {
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
      closeTimer = setTimeout(function () {
        try {
          window.close();
        } catch (error) {
          console.error('[order-request-print] window close failed', error);
        }
      }, 80);
    }

    function finalizePrint() {
      if (printStarted) {
        return;
      }
      printStarted = true;
      setTimeout(function () {
        try {
          window.focus();
          window.print();
        } catch (error) {
          console.error('[order-request-print] print failed', error);
        }
      }, 120);
    }

    function waitForImages() {
      var images = Array.prototype.slice.call(document.images || []);
      if (!images.length) {
        return Promise.resolve();
      }

      return Promise.all(images.map(function (image) {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise(function (resolve) {
          var done = function () {
            image.removeEventListener('load', done);
            image.removeEventListener('error', done);
            resolve();
          };

          image.addEventListener('load', done, { once: true });
          image.addEventListener('error', done, { once: true });

          setTimeout(done, 1500);
        });
      }));
    }

    waitForImages()
      .catch(function (error) {
        console.error('[order-request-print] resource wait failed', error);
      })
      .finally(function () {
        finalizePrint();
      });

    window.addEventListener('afterprint', safeCloseWindow, { once: true });
    window.addEventListener('pagehide', function () {
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
    });

    setTimeout(finalizePrint, 2200);
  })();
</script>
</body>
</html>`;
}
