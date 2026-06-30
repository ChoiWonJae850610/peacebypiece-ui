export const SIGNUP_APPLICATION_FILE_STORAGE_ROOT = "signup-applications" as const;
export const SIGNUP_APPLICATION_CERTIFICATE_DIRECTORY = "business-registration" as const;
export const SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE = "business_registration" as const;
export const SIGNUP_APPLICATION_CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;

export const SIGNUP_APPLICATION_CERTIFICATE_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
] as const;

export type SignupApplicationCertificateMimeType =
  (typeof SIGNUP_APPLICATION_CERTIFICATE_ALLOWED_MIME_TYPES)[number];

export const SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES = {
  sessionRequired: "SIGNUP_APPLICANT_SESSION_REQUIRED",
  applicationIdRequired: "SIGNUP_APPLICATION_ID_REQUIRED",
  applicationNotFound: "SIGNUP_APPLICATION_NOT_FOUND",
  uploadNotAllowed: "SIGNUP_CERTIFICATE_UPLOAD_NOT_ALLOWED",
  fileRequired: "SIGNUP_CERTIFICATE_FILE_REQUIRED",
  mimeTypeUnsupported: "SIGNUP_CERTIFICATE_MIME_TYPE_UNSUPPORTED",
  extensionUnsupported: "SIGNUP_CERTIFICATE_EXTENSION_UNSUPPORTED",
  fileSignatureUnsupported: "SIGNUP_CERTIFICATE_SIGNATURE_UNSUPPORTED",
  fileSizeUnsupported: "SIGNUP_CERTIFICATE_SIZE_UNSUPPORTED",
  uploadNotConfigured: "SIGNUP_CERTIFICATE_UPLOAD_NOT_CONFIGURED",
  uploadFailed: "SIGNUP_CERTIFICATE_UPLOAD_FAILED",
  metadataSaveFailed: "SIGNUP_CERTIFICATE_METADATA_SAVE_FAILED",
  fileNotFound: "SIGNUP_CERTIFICATE_NOT_FOUND",
  deleteFailed: "SIGNUP_CERTIFICATE_DELETE_FAILED",
  viewFailed: "SIGNUP_CERTIFICATE_VIEW_FAILED",
} as const;

export type SignupApplicationCertificateStorageInput = {
  applicationId: string;
  fileId: string;
  extension: "pdf" | "png" | "jpg";
};

export type SignupApplicationCertificateApprovalLink = {
  applicationFileId: string;
  companyFileId: string;
  linkedBySystemUserId: string;
  linkedAt: Date;
};

const MIME_TYPE_BY_EXTENSION: Record<string, SignupApplicationCertificateMimeType> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
};

const UNSAFE_ORIGINAL_NAME_PATTERN = /[\u0000\\/]/;

export function buildSignupApplicationCertificateStorageKey(
  input: SignupApplicationCertificateStorageInput,
): string {
  assertStorageSegment(input.applicationId, "applicationId");
  assertStorageSegment(input.fileId, "fileId");

  return [
    SIGNUP_APPLICATION_FILE_STORAGE_ROOT,
    input.applicationId,
    SIGNUP_APPLICATION_CERTIFICATE_DIRECTORY,
    `${input.fileId}.${input.extension}`,
  ].join("/");
}

export function normalizeSignupApplicationCertificateMimeType(
  value: string | null | undefined,
): string {
  return String(value ?? "").trim().toLowerCase();
}

export function sanitizeSignupApplicationCertificateOriginalName(value: string | null | undefined): string {
  return (
    String(value ?? "")
      .trim()
      .replace(/[\u0000\\/]+/g, "-")
      .replace(/\s+/g, " ")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 180) || "business-registration"
  );
}

export function getSignupApplicationCertificateExtension(input: {
  originalName: string;
  mimeType: SignupApplicationCertificateMimeType;
}): "png" | "jpg" | "pdf" {
  if (UNSAFE_ORIGINAL_NAME_PATTERN.test(input.originalName) || /\.\s*$/.test(input.originalName)) {
    throw new Error(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.extensionUnsupported);
  }
  const [, extension = ""] = input.originalName.match(/\.([a-z0-9]+)$/i) ?? [];
  const normalizedExtension = extension.toLowerCase();
  const extensionMimeType = MIME_TYPE_BY_EXTENSION[normalizedExtension];
  if (!extensionMimeType || extensionMimeType !== input.mimeType) {
    throw new Error(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.extensionUnsupported);
  }
  return normalizedExtension === "jpeg" ? "jpg" : normalizedExtension as "png" | "jpg" | "pdf";
}

export function isSignupApplicationCertificateMimeTypeAllowed(
  value: string | null | undefined,
): value is SignupApplicationCertificateMimeType {
  return (SIGNUP_APPLICATION_CERTIFICATE_ALLOWED_MIME_TYPES as readonly string[])
    .includes(normalizeSignupApplicationCertificateMimeType(value));
}

export function isSignupApplicationCertificateSizeAllowed(sizeBytes: number | null | undefined): boolean {
  const size = Math.trunc(Number(sizeBytes ?? 0));
  return Number.isFinite(size) && size > 0 && size <= SIGNUP_APPLICATION_CERTIFICATE_MAX_BYTES;
}

export function isSignupApplicationCertificateStorageKeyConsistentWithMime(input: {
  storageKey: string;
  mimeType: string | null | undefined;
}): boolean {
  const normalizedMimeType = normalizeSignupApplicationCertificateMimeType(input.mimeType);
  const [, extension = ""] = input.storageKey.match(/\.([a-z0-9]+)$/i) ?? [];
  const extensionMimeType = MIME_TYPE_BY_EXTENSION[extension.toLowerCase()];
  return Boolean(extensionMimeType && extensionMimeType === normalizedMimeType);
}

export function validateSignupApplicationCertificateBytes(input: {
  bytes: Uint8Array;
  mimeType: SignupApplicationCertificateMimeType;
}): boolean {
  const bytes = input.bytes;
  if (input.mimeType === "image/png") {
    return (
      bytes.length >= 8
      && bytes[0] === 0x89
      && bytes[1] === 0x50
      && bytes[2] === 0x4e
      && bytes[3] === 0x47
      && bytes[4] === 0x0d
      && bytes[5] === 0x0a
      && bytes[6] === 0x1a
      && bytes[7] === 0x0a
    );
  }
  if (input.mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (input.mimeType === "application/pdf") {
    return bytes.length >= 5
      && bytes[0] === 0x25
      && bytes[1] === 0x50
      && bytes[2] === 0x44
      && bytes[3] === 0x46
      && bytes[4] === 0x2d;
  }
  return false;
}

export function isSignupApplicationCertificateStorageKey(input: {
  storageKey: string;
  applicationId: string;
  fileId?: string;
}): boolean {
  const escapedApplicationId = escapeRegExp(input.applicationId);
  const escapedFileId = input.fileId ? escapeRegExp(input.fileId) : "[^/]+";
  const pattern = new RegExp(
    `^${SIGNUP_APPLICATION_FILE_STORAGE_ROOT}/${escapedApplicationId}/${SIGNUP_APPLICATION_CERTIFICATE_DIRECTORY}/${escapedFileId}\\.(pdf|png|jpg|jpeg)$`,
    "i",
  );

  return pattern.test(input.storageKey);
}

export function isSupportedSignupApplicationCertificateStorageKey(storageKey: string): boolean {
  const normalized = storageKey.replace(/^\/+/, "").trim();
  return new RegExp(
    `^${SIGNUP_APPLICATION_FILE_STORAGE_ROOT}/[A-Za-z0-9][A-Za-z0-9_-]{1,127}/${SIGNUP_APPLICATION_CERTIFICATE_DIRECTORY}/[A-Za-z0-9][A-Za-z0-9_-]{1,127}\\.(pdf|png|jpg|jpeg)$`,
    "i",
  ).test(normalized);
}

export function assertSignupApplicationCertificateStorageKey(input: {
  storageKey: string;
  applicationId: string;
  fileId?: string;
}): void {
  if (!isSignupApplicationCertificateStorageKey(input)) {
    throw new Error("Invalid signup application certificate storage key.");
  }
}

export function isWaflProvidedCertificateDownloadAllowed(): false {
  return false;
}

export function isSignupApplicationCertificateCleanupKey(input: {
  storageKey: string;
  applicationId: string;
}): boolean {
  return isSignupApplicationCertificateStorageKey(input);
}

function assertStorageSegment(value: string, name: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,127}$/.test(value)) {
    throw new Error(`Invalid signup application certificate ${name}.`);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
