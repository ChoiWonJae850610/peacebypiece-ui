export const FILE_KIND = {
  document: "document",
  design: "design",
  other: "other",
} as const;

export type FileKindCode = (typeof FILE_KIND)[keyof typeof FILE_KIND];

export const FILE_KIND_LABELS_KO: Record<FileKindCode, string> = {
  [FILE_KIND.document]: "문서",
  [FILE_KIND.design]: "디자인",
  [FILE_KIND.other]: "기타",
};

const DESIGN_FILE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "heic",
  "heif",
  "ai",
  "psd",
]);

const DOCUMENT_FILE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "hwp",
]);

const LEGACY_FILE_KIND_LABELS: Record<string, FileKindCode> = {
  디자인: FILE_KIND.design,
  이미지: FILE_KIND.design,
  문서: FILE_KIND.document,
  파일: FILE_KIND.document,
  기타: FILE_KIND.other,
};

function getFileExtension(fileName?: string | null): string {
  const normalized = String(fileName ?? "").trim().toLowerCase();
  if (!normalized.includes(".")) return "";
  return normalized.split(".").pop() ?? "";
}

export function normalizeFileKind(input: {
  fileType?: string | null | undefined;
  fileName?: string | null | undefined;
  mimeType?: string | null | undefined;
}): FileKindCode {
  const rawFileType = String(input.fileType ?? "").trim();
  const normalizedFileType = rawFileType.toLowerCase();
  const extension = getFileExtension(input.fileName);
  const mimeType = String(input.mimeType ?? "").toLowerCase();

  const legacyKind = LEGACY_FILE_KIND_LABELS[rawFileType];
  if (legacyKind) return legacyKind;

  if (
    normalizedFileType === FILE_KIND.design ||
    normalizedFileType === "image" ||
    normalizedFileType === "img" ||
    mimeType.startsWith("image/") ||
    DESIGN_FILE_EXTENSIONS.has(extension)
  ) {
    return FILE_KIND.design;
  }

  if (
    normalizedFileType === FILE_KIND.document ||
    normalizedFileType === "file" ||
    mimeType.includes("pdf") ||
    DOCUMENT_FILE_EXTENSIONS.has(extension)
  ) {
    return FILE_KIND.document;
  }

  return FILE_KIND.document;
}

export function getFileKindLabelKo(kind: FileKindCode): string {
  return FILE_KIND_LABELS_KO[kind];
}
