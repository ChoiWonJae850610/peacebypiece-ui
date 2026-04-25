import type { AttachmentScope } from "@/types/workorder";

export type WorkOrderAttachmentUploadScope = Extract<AttachmentScope, "design" | "attachment">;

export const WORK_ORDER_ATTACHMENT_POLICY = {
  maxFilesPerWorkOrder: 20,
  maxFileSizeBytes: {
    design: 10 * 1024 * 1024,
    attachment: 10 * 1024 * 1024,
  },
  allowedMimeTypes: {
    design: ["image/jpeg", "image/png", "image/webp"],
    attachment: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  },
  allowedExtensions: {
    design: ["jpg", "jpeg", "png", "webp"],
    attachment: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
  messages: {
    maxFilesExceeded: "파일은 디자인과 첨부를 합쳐 최대 20개까지 등록할 수 있습니다.",
    invalidFileType: "허용되지 않는 파일 형식입니다. 디자인은 JPG/PNG/WEBP, 첨부는 JPG/PNG/WEBP/PDF만 등록할 수 있습니다.",
    fileTooLarge: "파일은 1개당 최대 10MB까지 등록할 수 있습니다.",
    primarySetToast: "대표 디자인 이미지가 변경되었습니다.",
    primarySetFailed: "대표 디자인 이미지 변경에 실패했습니다.",
    primaryBadge: "대표",
    primaryAction: "대표로",
    primaryTitle: "대표 디자인 이미지",
    primaryActionTitle: "대표 디자인 이미지로 설정",
  },
} as const;

export function normalizeAttachmentUploadScope(value: unknown): WorkOrderAttachmentUploadScope {
  return value === "design" ? "design" : "attachment";
}

export function getAttachmentFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex + 1) : "";
}

export function isAllowedAttachmentFileType(input: {
  scope: WorkOrderAttachmentUploadScope;
  fileName: string;
  contentType: string;
}): boolean {
  const contentType = input.contentType.trim().toLowerCase();
  const extension = getAttachmentFileExtension(input.fileName);
  const allowedMimeTypes = WORK_ORDER_ATTACHMENT_POLICY.allowedMimeTypes[input.scope] as readonly string[];
  const allowedExtensions = WORK_ORDER_ATTACHMENT_POLICY.allowedExtensions[input.scope] as readonly string[];

  return allowedMimeTypes.includes(contentType) && allowedExtensions.includes(extension);
}

export function validateAttachmentFile(input: {
  scope: WorkOrderAttachmentUploadScope;
  fileName: string;
  contentType: string;
  fileSize: number;
}): { ok: true } | { ok: false; message: string; error: string } {
  if (!isAllowedAttachmentFileType(input)) {
    return {
      ok: false,
      error: "ATTACHMENT_FILE_TYPE_NOT_ALLOWED",
      message: WORK_ORDER_ATTACHMENT_POLICY.messages.invalidFileType,
    };
  }

  if (input.fileSize > WORK_ORDER_ATTACHMENT_POLICY.maxFileSizeBytes[input.scope]) {
    return {
      ok: false,
      error: "ATTACHMENT_FILE_TOO_LARGE",
      message: WORK_ORDER_ATTACHMENT_POLICY.messages.fileTooLarge,
    };
  }

  return { ok: true };
}

export function validateAttachmentFileCount(input: {
  currentCount: number;
  incomingCount: number;
}): { ok: true } | { ok: false; message: string; error: string } {
  if (input.currentCount + input.incomingCount > WORK_ORDER_ATTACHMENT_POLICY.maxFilesPerWorkOrder) {
    return {
      ok: false,
      error: "ATTACHMENT_FILE_COUNT_EXCEEDED",
      message: WORK_ORDER_ATTACHMENT_POLICY.messages.maxFilesExceeded,
    };
  }

  return { ok: true };
}
