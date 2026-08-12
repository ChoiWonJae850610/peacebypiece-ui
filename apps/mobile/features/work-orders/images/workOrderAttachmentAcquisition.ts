import * as DocumentPicker from "expo-document-picker";

import {
  attachmentFilenameRoundTripsJson,
  normalizeAttachmentFilenameForTransport,
} from "@/domain/attachmentFilenamePolicy";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type WorkOrderAttachmentAcquisitionResult =
  | {
      readonly status: "selected";
      readonly asset: {
        readonly uri: string;
        readonly name: string;
        readonly mimeType: string;
        readonly size: number;
      };
    }
  | { readonly status: "cancelled" }
  | { readonly status: "invalid"; readonly message: string };

export async function acquireWorkOrderAttachment(): Promise<WorkOrderAttachmentAcquisitionResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...ALLOWED_MIME_TYPES],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return { status: "cancelled" };
  const asset = result.assets[0];
  const name = normalizeAttachmentFilenameForTransport(asset.name);
  const mimeType = asset.mimeType?.toLowerCase() ?? "";
  const size = asset.size ?? 0;
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return { status: "invalid", message: "JPG, PNG, WEBP, PDF 파일만 첨부할 수 있습니다." };
  }
  if (!Number.isSafeInteger(size) || size <= 0 || size > 10 * 1024 * 1024) {
    return { status: "invalid", message: "첨부파일은 1개당 10MB 이하만 등록할 수 있습니다." };
  }
  if (!name || !attachmentFilenameRoundTripsJson(name)) {
    return { status: "invalid", message: "첨부파일의 한글 파일명을 읽지 못했습니다. 파일명을 확인해 주세요." };
  }
  return {
    status: "selected",
    asset: {
      uri: asset.uri,
      name,
      mimeType,
      size,
    },
  };
}
