export type PdfPageOrientation = "landscape" | "portrait" | "square-or-unknown";
export type PdfPageBox = { x: number; y: number; width: number; height: number };
export type PdfPageOrientationEvidence = {
  pageIndex: number;
  mediaBox: PdfPageBox;
  cropBox: PdfPageBox | null;
  trimBox: PdfPageBox | null;
  effectiveBoxSource: "cropBox" | "mediaBox";
  rotate: 0 | 90 | 180 | 270;
  effectiveWidth: number;
  effectiveHeight: number;
  classifiedOrientation: PdfPageOrientation;
  expectedOrientation: "landscape" | "portrait";
  match: boolean;
};

export function classifyPdfPageOrientation(width: number, height: number, tolerancePoints?: number): PdfPageOrientation;
export function inspectPdfPageOrientations(pdfBytes: Uint8Array): PdfPageOrientationEvidence[];
export function validatePdfPageOrientations(pages: readonly PdfPageOrientationEvidence[]): {
  valid: boolean;
  firstMismatchPageIndex: number | null;
  mismatchReason: string | null;
};
