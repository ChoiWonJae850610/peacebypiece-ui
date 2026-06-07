import { type CompanyFileType } from "@/lib/admin/settings/companyFileTypes";

export type CompanyFileUploadPolicy = {
  maxBytes: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  inputAccept: string;
  helperText: string;
  shortTypeLabel: string;
};

export const COMPANY_FILE_UPLOAD_POLICY: Record<CompanyFileType, CompanyFileUploadPolicy> = {
  representative_image: {
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    inputAccept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    helperText: "JPG, PNG, WEBP · 최대 5MB",
    shortTypeLabel: "이미지 파일",
  },
  business_registration: {
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
    inputAccept: "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf",
    helperText: "JPG, PNG, WEBP, PDF · 최대 10MB",
    shortTypeLabel: "문서 파일",
  },
} as const;

export function getCompanyFileUploadPolicy(fileType: CompanyFileType): CompanyFileUploadPolicy {
  return COMPANY_FILE_UPLOAD_POLICY[fileType];
}

export function getCompanyFileInputAccept(fileType: CompanyFileType): string {
  return getCompanyFileUploadPolicy(fileType).inputAccept;
}

export function getCompanyFileAllowedUploadText(fileType: CompanyFileType): string {
  return getCompanyFileUploadPolicy(fileType).helperText;
}

export function getCompanyFileKindLabel(input: { fileType: CompanyFileType; mimeType?: string | null }): string {
  const mimeType = String(input.mimeType ?? "").toLowerCase();
  if (mimeType.startsWith("image/")) return "이미지 파일";
  if (mimeType === "application/pdf") return "PDF 문서";
  return getCompanyFileUploadPolicy(input.fileType).shortTypeLabel;
}

export function getCompanyFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex + 1) : "";
}

export function isAllowedCompanyFileType(input: {
  fileType: CompanyFileType;
  fileName: string;
  mimeType: string;
}): boolean {
  const policy = getCompanyFileUploadPolicy(input.fileType);
  const mimeType = input.mimeType.trim().toLowerCase();
  const extension = getCompanyFileExtension(input.fileName);

  return policy.allowedMimeTypes.includes(mimeType) && policy.allowedExtensions.includes(extension);
}
