import type { AttachmentUploadTarget } from "@/lib/workorder/attachments/attachmentUploadApiClient";

const THUMBNAIL_SIZE = 360;
const THUMBNAIL_QUALITY = 0.82;

function isBrowserImageFile(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes((file.type || "").toLowerCase());
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ATTACHMENT_THUMBNAIL_IMAGE_LOAD_FAILED"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("ATTACHMENT_THUMBNAIL_CREATE_FAILED"));
    }, "image/webp", THUMBNAIL_QUALITY);
  });
}

export async function createAttachmentThumbnailFile(file: File, target: AttachmentUploadTarget): Promise<File | null> {
  if (!target.thumbnailStorageKey || !target.thumbnailUploadUrl || !isBrowserImageFile(file)) return null;

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, THUMBNAIL_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("ATTACHMENT_THUMBNAIL_CONTEXT_UNAVAILABLE");
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas);
  return new File([blob], `${target.storageKey.split("/").pop() || "thumbnail"}.webp`, { type: "image/webp" });
}
