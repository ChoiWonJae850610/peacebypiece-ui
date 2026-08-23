// Calibrated to the print-readable 10.8px table grammar: a normal page may
// hold the three compact inventory sections, while a Finished Spec section
// that fits a fresh page moves there whole instead of clipping into footer.
export const ISSUED_PDF_CONTENT_PAGE_CAPACITY = 38;
export const ISSUED_PDF_SIZE_SPEC_CHROME_WEIGHT = 6;
export const ISSUED_PDF_SIZE_SPEC_ROW_WEIGHT = 2;

export type IssuedPdfPackableBlock = {
  readonly startsNewPage?: boolean;
  readonly weight: number;
};

export function packIssuedPdfBlocks<T extends IssuedPdfPackableBlock>(
  blocks: readonly T[],
  capacity = ISSUED_PDF_CONTENT_PAGE_CAPACITY,
): readonly (readonly T[])[] {
  const pages: T[][] = [];
  let page: T[] = [];
  let weight = 0;
  for (const block of blocks) {
    if (page.length && (block.startsNewPage || weight + block.weight > capacity)) {
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

export function issuedPdfSizeSpecWeight(rowCount: number): number {
  return ISSUED_PDF_SIZE_SPEC_CHROME_WEIGHT + Math.max(0, rowCount) * ISSUED_PDF_SIZE_SPEC_ROW_WEIGHT;
}

export function paginateIssuedPdfSizeSpecRows<T>(rows: readonly T[]): readonly (readonly T[])[] {
  if (rows.length === 0) return [];
  const maximumRowsPerPage = Math.floor(
    (ISSUED_PDF_CONTENT_PAGE_CAPACITY - ISSUED_PDF_SIZE_SPEC_CHROME_WEIGHT)
      / ISSUED_PDF_SIZE_SPEC_ROW_WEIGHT,
  );
  if (rows.length <= maximumRowsPerPage) return [rows];
  const pageCount = Math.ceil(rows.length / maximumRowsPerPage);
  const balancedRowsPerPage = Math.ceil(rows.length / pageCount);
  const pages: T[][] = [];
  for (let index = 0; index < rows.length; index += balancedRowsPerPage) {
    pages.push(rows.slice(index, index + balancedRowsPerPage));
  }
  return pages;
}
