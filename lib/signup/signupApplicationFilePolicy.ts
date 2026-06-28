export const SIGNUP_APPLICATION_FILE_STORAGE_ROOT = "signup-applications" as const;
export const SIGNUP_APPLICATION_CERTIFICATE_DIRECTORY = "business-registration" as const;
export const SIGNUP_APPLICATION_CERTIFICATE_FILE_TYPE = "business_registration" as const;

export type SignupApplicationCertificateStorageInput = {
  applicationId: string;
  fileId: string;
  extension: "pdf" | "png" | "jpg" | "jpeg";
};

export type SignupApplicationCertificateApprovalLink = {
  applicationFileId: string;
  companyFileId: string;
  linkedBySystemUserId: string;
  linkedAt: Date;
};

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
