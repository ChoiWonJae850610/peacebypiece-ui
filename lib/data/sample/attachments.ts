import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getFixtureI18n } from "@/lib/data/mock/fixtureI18n";
import type { Attachment } from "@/types/workorder";

function buildSvgDataUrl(label: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><text x="400" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="${fg}">${label}</text><text x="400" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${fg}" opacity="0.8">WAFL Attachment Preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createSampleAttachments(workOrderId: string, count: number, locale: Locale = DEFAULT_LOCALE): Attachment[] {
  const fixture = getFixtureI18n(locale);
  const base: Attachment[] = [
    { id: `${workOrderId}-att-image-1`, type: "image", name: "front-sample.jpg", url: buildSvgDataUrl("FRONT SAMPLE", "#E7EEF8", "#26415F"), ownerId: "user-designer", ownerName: fixture.sampleAttachments.designer },
    { id: `${workOrderId}-att-pdf-1`, type: "pdf", name: "workorder-sheet.pdf", url: buildSvgDataUrl("PDF", "#FDECEC", "#991B1B"), ownerId: "user-admin", ownerName: fixture.sampleAttachments.admin },
    { id: `${workOrderId}-att-image-2`, type: "image", name: "detail-note.jpg", url: buildSvgDataUrl("DETAIL NOTE", "#EEF7E9", "#31572C"), ownerId: "user-designer", ownerName: fixture.sampleAttachments.designer },
    { id: `${workOrderId}-att-image-3`, type: "image", name: "color-chip.jpg", url: buildSvgDataUrl("COLOR CHIP", "#FFF4DF", "#9A6700"), ownerId: "user-inspection", ownerName: fixture.sampleAttachments.inspector },
    { id: `${workOrderId}-att-pdf-2`, type: "pdf", name: "spec-sheet.pdf", url: buildSvgDataUrl("SPEC PDF", "#F4EAFE", "#6D28D9"), ownerId: "user-admin", ownerName: fixture.sampleAttachments.admin },
    { id: `${workOrderId}-att-image-4`, type: "image", name: "back-view.jpg", url: buildSvgDataUrl("BACK VIEW", "#E9F8F8", "#155E75"), ownerId: "user-inspection", ownerName: fixture.sampleAttachments.inspector },
  ];
  return base.slice(0, count);
}
