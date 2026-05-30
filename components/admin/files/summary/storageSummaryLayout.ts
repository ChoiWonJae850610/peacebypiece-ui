export type StorageSummaryLayoutMode = "narrow" | "medium" | "wide";

export const STORAGE_SUMMARY_WIDE_MIN_WIDTH = 1120;
export const STORAGE_SUMMARY_MEDIUM_MIN_WIDTH = 720;

export function getStorageSummaryLayoutMode(width: number): StorageSummaryLayoutMode {
  if (width >= STORAGE_SUMMARY_WIDE_MIN_WIDTH) return "wide";
  if (width >= STORAGE_SUMMARY_MEDIUM_MIN_WIDTH) return "medium";
  return "narrow";
}

export function getStorageSummaryGridStyle(layoutMode: StorageSummaryLayoutMode) {
  if (layoutMode === "wide") {
    return {
      gridTemplateColumns:
        "minmax(230px,0.78fr) minmax(260px,0.88fr) minmax(340px,1.12fr)",
    };
  }

  if (layoutMode === "medium") {
    return {
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
    };
  }

  return {
    gridTemplateColumns: "minmax(0,1fr)",
  };
}

export function getFileTypeCardGridStyle(layoutMode: StorageSummaryLayoutMode) {
  if (layoutMode === "medium") {
    return { gridColumn: "1 / -1" };
  }

  return undefined;
}
