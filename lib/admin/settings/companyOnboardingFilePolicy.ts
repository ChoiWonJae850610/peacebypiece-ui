import "server-only";

import { randomUUID } from "crypto";

import type { CompanyOnboardingFileType } from "@/lib/admin/settings/companyTypes";

export const COMPANY_ONBOARDING_FILE_TYPES = ["logo", "business_license"] as const satisfies readonly CompanyOnboardingFileType[];

export const COMPANY_ONBOARDING_FILE_STORAGE_DIRECTORIES: Record<CompanyOnboardingFileType, "logo" | "business-license"> = {
  logo: "logo",
  business_license: "business-license",
};

export const COMPANY_ONBOARDING_FILE_MAX_BYTES: Record<CompanyOnboardingFileType, number> = {
  logo: 5 * 1024 * 1024,
  business_license: 10 * 1024 * 1024,
};

export const COMPANY_ONBOARDING_FILE_ALLOWED_MIME_TYPES: Record<CompanyOnboardingFileType, readonly string[]> = {
  logo: ["image/jpeg", "image/png", "image/webp"],
  business_license: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
};

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

function normalizeMimeType(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function getExtension(input: { originalName: string; mimeType: string }): string {
  const normalizedMimeType = normalizeMimeType(input.mimeType);
  const extensionFromMimeType = EXTENSIONS_BY_MIME_TYPE[normalizedMimeType];
  if (extensionFromMimeType) return extensionFromMimeType;

  const [, extension = ""] = input.originalName.match(/\.([a-z0-9]+)$/i) ?? [];
  return SAFE_EXTENSION_PATTERN.test(extension) ? extension.toLowerCase() : "bin";
}

export function isCompanyOnboardingFileType(value: string | null | undefined): value is CompanyOnboardingFileType {
  return COMPANY_ONBOARDING_FILE_TYPES.some((fileType) => fileType === value);
}

export function isCompanyOnboardingFileMimeTypeAllowed(input: {
  fileType: CompanyOnboardingFileType;
  mimeType: string | null | undefined;
}): boolean {
  const normalizedMimeType = normalizeMimeType(input.mimeType);
  return COMPANY_ONBOARDING_FILE_ALLOWED_MIME_TYPES[input.fileType].includes(normalizedMimeType);
}

export function isCompanyOnboardingFileSizeAllowed(input: {
  fileType: CompanyOnboardingFileType;
  sizeBytes: number | null | undefined;
}): boolean {
  const sizeBytes = Number(input.sizeBytes ?? 0);
  return Number.isFinite(sizeBytes) && sizeBytes > 0 && sizeBytes <= COMPANY_ONBOARDING_FILE_MAX_BYTES[input.fileType];
}

export function createCompanyOnboardingFileStorageKey(input: {
  companyId: string;
  fileType: CompanyOnboardingFileType;
  originalName: string;
  mimeType: string;
  fileId?: string;
}): string {
  const companyId = sanitizeSegment(input.companyId);
  const directory = COMPANY_ONBOARDING_FILE_STORAGE_DIRECTORIES[input.fileType];
  const fileId = sanitizeSegment(input.fileId ?? randomUUID());
  const extension = getExtension({ originalName: input.originalName, mimeType: input.mimeType });

  return `companies/${companyId}/onboarding/${directory}/${fileId}.${extension}`;
}
