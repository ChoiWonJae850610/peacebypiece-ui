export const SIZE_COLOR_MAIN_PREVIEW_LIMIT = 5;
export const SIZE_SPEC_MAIN_PREVIEW_LIMIT = 5;

export type BoundedPreview<T> = {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly truncated: boolean;
};

export function createBoundedPreview<T>(items: readonly T[], limit: number): BoundedPreview<T> {
  const boundedLimit = Math.max(0, Math.floor(limit));
  return {
    items: items.slice(0, boundedLimit),
    totalCount: items.length,
    truncated: items.length > boundedLimit,
  };
}

export function needsMatrixFullView(_sizeCount: number, colorCount: number) {
  return colorCount > SIZE_COLOR_MAIN_PREVIEW_LIMIT;
}

export function needsSpecFullView(_sizeCount: number, pomCount: number) {
  return pomCount > SIZE_SPEC_MAIN_PREVIEW_LIMIT;
}
