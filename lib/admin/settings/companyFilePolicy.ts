import "server-only";

import { randomUUID } from "crypto";

import { COMPANY_FILE_TYPES, type CompanyFileType } from "@/lib/admin/settings/companyFileTypes";

export const COMPANY_FILE_STORAGE_DIRECTORIES: Record<CompanyFileType, "representative_image" | "business_registration"> = {
  representative_image: "representative_image",
  business_registration: "business_registration",
};

export const COMPANY_FILE_MAX_BYTES: Record<CompanyFileType, number> = {
  representative_image: 5 * 1024 * 1024,
  business_registration: 10 * 1024 * 1024,
};

export const COMPANY_FILE_ALLOWED_MIME_TYPES: Record<CompanyFileType, readonly string[]> = {
  representative_image: ["image/jpeg", "image/png", "image/webp"],
  business_registration: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

export const COMPANY_FILE_ERROR_CODES = {
  fileTypeRequired: "COMPANY_FILE_TYPE_REQUIRED",
  fileTypeUnsupported: "COMPANY_FILE_TYPE_UNSUPPORTED",
  mimeTypeUnsupported: "COMPANY_FILE_MIME_TYPE_UNSUPPORTED",
  fileSizeUnsupported: "COMPANY_FILE_SIZE_UNSUPPORTED",
  originalNameRequired: "COMPANY_FILE_ORIGINAL_NAME_REQUIRED",
  uploadNotConfigured: "COMPANY_FILE_UPLOAD_NOT_CONFIGURED",
  invalidStorageKey: "COMPANY_FILE_INVALID_STORAGE_KEY",
  presignFailed: "COMPANY_FILE_UPLOAD_PREPARE_FAILED",
  metadataSaveFailed: "COMPANY_FILE_METADATA_SAVE_FAILED",
} as const;

const EXTENSIONS_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const SAFE_EXTENSION_PATTERN = /^[a-z0-9]{1,12}$/i;

function sanitizeSegment(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9가-힣._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "item"
  );
}

function normalizeStorageKey(value: string): string {
  return value.replace(/^\/+/, "").trim();
}

export function normalizeCompanyFileMimeType(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function getExtension(input: { originalName: string; mimeType: string }): string {
  const normalizedMimeType = normalizeCompanyFileMimeType(input.mimeType);
  const extensionFromMimeType = EXTENSIONS_BY_MIME_TYPE[normalizedMimeType];
  if (extensionFromMimeType) return extensionFromMimeType;

  const [, extension = ""] = input.originalName.match(/\.([a-z0-9]+)$/i) ?? [];
  return SAFE_EXTENSION_PATTERN.test(extension) ? extension.toLowerCase() : "bin";
}

export function isCompanyFileType(value: string | null | undefined): value is CompanyFileType {
  return COMPANY_FILE_TYPES.some((fileType) => fileType === value);
}

export function isCompanyFileMimeTypeAllowed(input: {
  fileType: CompanyFileType;
  mimeType: string | null | undefined;
}): boolean {
  const normalizedMimeType = normalizeCompanyFileMimeType(input.mimeType);
  return COMPANY_FILE_ALLOWED_MIME_TYPES[input.fileType].includes(normalizedMimeType);
}

export function isCompanyFileSizeAllowed(input: {
  fileType: CompanyFileType;
  sizeBytes: number | null | undefined;
}): boolean {
  const sizeBytes = Number(input.sizeBytes ?? 0);
  return Number.isFinite(sizeBytes) && sizeBytes > 0 && sizeBytes <= COMPANY_FILE_MAX_BYTES[input.fileType];
}

export function createCompanyFileStorageKey(input: {
  companyId: string;
  fileType: CompanyFileType;
  originalName: string;
  mimeType: string;
  fileId?: string;
}): string {
  const companyId = sanitizeSegment(input.companyId);
  const directory = COMPANY_FILE_STORAGE_DIRECTORIES[input.fileType];
  const fileId = sanitizeSegment(input.fileId ?? randomUUID());
  const extension = getExtension({ originalName: input.originalName, mimeType: input.mimeType });

  return `companies/${companyId}/company-files/${directory}/${fileId}.${extension}`;
}

export function isSupportedCompanyFileStorageKey(key: string): boolean {
  const normalized = normalizeStorageKey(key);
  return /^companies\/[^/]+\/company-files\/(representative_image|business_registration)\/[^/]+\.(jpg|png|webp|pdf)$/i.test(normalized);
}

export function isCompanyFileStorageKeyForCompany(input: {
  key: string;
  companyId: string;
  fileType?: CompanyFileType;
}): boolean {
  const companyId = sanitizeSegment(input.companyId);
  const segments = normalizeStorageKey(input.key).split("/");
  const expectedDirectory = input.fileType ? COMPANY_FILE_STORAGE_DIRECTORIES[input.fileType] : null;

  return (
    segments.length === 5 &&
    segments[0] === "companies" &&
    segments[1] === companyId &&
    segments[2] === "company-files" &&
    (!expectedDirectory || segments[3] === expectedDirectory) &&
    segments[4].length > 0 &&
    isSupportedCompanyFileStorageKey(input.key)
  );
}

export function validateCompanyFileUploadInput(input: {
  fileType: string | null | undefined;
  originalName: string | null | undefined;
  mimeType: string | null | undefined;
  sizeBytes: number | string | null | undefined;
}): { ok: true; fileType: CompanyFileType; originalName: string; mimeType: string; sizeBytes: number } | { ok: false; error: string } {
  if (!input.fileType) return { ok: false, error: COMPANY_FILE_ERROR_CODES.fileTypeRequired };
  if (!isCompanyFileType(input.fileType)) {
    return { ok: false, error: COMPANY_FILE_ERROR_CODES.fileTypeUnsupported };
  }

  const originalName = String(input.originalName ?? "").trim();
  if (!originalName) return { ok: false, error: COMPANY_FILE_ERROR_CODES.originalNameRequired };

  const mimeType = normalizeCompanyFileMimeType(input.mimeType);
  if (!isCompanyFileMimeTypeAllowed({ fileType: input.fileType, mimeType })) {
    return { ok: false, error: COMPANY_FILE_ERROR_CODES.mimeTypeUnsupported };
  }

  const sizeBytes = Math.trunc(Number(input.sizeBytes ?? 0));
  if (!isCompanyFileSizeAllowed({ fileType: input.fileType, sizeBytes })) {
    return { ok: false, error: COMPANY_FILE_ERROR_CODES.fileSizeUnsupported };
  }

  return { ok: true, fileType: input.fileType, originalName, mimeType, sizeBytes };
}
