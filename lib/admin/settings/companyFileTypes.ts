export const COMPANY_FILE_TYPES = [
  "representative_image",
  "business_registration",
] as const;

export type CompanyFileType = (typeof COMPANY_FILE_TYPES)[number];

export const COMPANY_FILE_REVIEW_STATUSES = [
  "not_required",
  "pending_review",
  "approved",
  "rejected",
] as const;

export type CompanyFileReviewStatus = (typeof COMPANY_FILE_REVIEW_STATUSES)[number];

export type CompanyFileMetadata = {
  id: string;
  companyId: string;
  fileType: CompanyFileType;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  reviewStatus: CompanyFileReviewStatus;
  uploadedByUserId?: string | null;
  reviewedBySystemUserId?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  replacedByFileId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
};

export type CreateCompanyFileMetadataInput = {
  companyId: string;
  fileType: CompanyFileType;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number | string;
  uploadedByUserId?: string | null;
};
