export const COMPANY_EXPORT_STATUSES = [
  "requested",
  "building",
  "ready",
  "failed",
  "expired",
  "cleanup_pending",
  "cleaned",
] as const;

export const COMPANY_EXPORT_DOWNLOAD_TTL_DAYS = 7;
export const COMPANY_EXPORT_PART_SIZE_BYTES = 500 * 1024 * 1024;

export type CompanyExportStatus = (typeof COMPANY_EXPORT_STATUSES)[number];

export function getCompanyExportExpiresAt(readyAt: Date): Date {
  const expiresAt = new Date(readyAt);
  expiresAt.setDate(expiresAt.getDate() + COMPANY_EXPORT_DOWNLOAD_TTL_DAYS);
  return expiresAt;
}

export function createCompanyExportManifest(input: {
  companyId: string;
  jobId: string;
  objectKeys: readonly string[];
}) {
  return {
    companyId: input.companyId,
    jobId: input.jobId,
    snapshotBoundary: "company_owned_data",
    splitZipSupported: true,
    partSizeBytes: COMPANY_EXPORT_PART_SIZE_BYTES,
    objectKeys: [...input.objectKeys],
    exposesRawR2Url: false,
    consumesAllowanceOnlyAfterReady: true,
    finalTerminationExportOutsidePlanAllowance: true,
  };
}

export function isCompanyExportActionAllowedWhileOverQuota(action: string): boolean {
  return action === "company_wide_export" || action === "download_existing_export";
}
