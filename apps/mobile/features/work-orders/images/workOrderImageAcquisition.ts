import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

import { isHeicLikeAcquiredImage } from "@/domain/workOrderHeicPolicy";

export type WorkOrderImageAcquisitionSource = "library" | "camera";

export type WorkOrderImageAcquisitionResult =
  | { readonly status: "selected"; readonly asset: ImagePicker.ImagePickerAsset }
  | { readonly status: "cancelled" }
  | { readonly status: "denied"; readonly message: string };

export async function acquireWorkOrderImage(
  source: WorkOrderImageAcquisitionSource,
): Promise<WorkOrderImageAcquisitionResult> {
  const permission = source === "camera"
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      status: "denied",
      message: permission.canAskAgain
        ? "권한을 허용해야 이미지를 선택할 수 있습니다."
        : "iPhone 설정에서 WAFL의 사진 또는 카메라 권한을 허용해 주세요.",
    };
  }

  const options: ImagePicker.ImagePickerOptions = {
    allowsEditing: false,
    allowsMultipleSelection: false,
    mediaTypes: ["images"],
    quality: 1,
    selectionLimit: 1,
    ...(source === "library" ? {
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    } : {}),
  };
  const result = source === "camera"
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return { status: "cancelled" };
  return { status: "selected", asset: result.assets[0] };
}

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function normalizedImageMimeType(asset: ImagePicker.ImagePickerAsset, blob: Blob): string {
  const candidates = [
    asset.mimeType,
    blob.type,
    asset.fileName?.match(/\.png$/i) ? "image/png" : null,
    asset.fileName?.match(/\.webp$/i) ? "image/webp" : null,
    asset.fileName?.match(/\.jpe?g$/i) ? "image/jpeg" : null,
    asset.uri.match(/\.png(?:$|\?)/i) ? "image/png" : null,
    asset.uri.match(/\.webp(?:$|\?)/i) ? "image/webp" : null,
    asset.uri.match(/\.jpe?g(?:$|\?)/i) ? "image/jpeg" : null,
  ];
  return candidates
    .map((candidate) => candidate?.trim().toLowerCase() ?? "")
    .find((candidate) => ALLOWED_IMAGE_MIME_TYPES.has(candidate)) ?? "";
}

export function normalizeAcquiredImageFile(asset: ImagePicker.ImagePickerAsset, blob: Blob) {
  const mimeType = normalizedImageMimeType(asset, blob);
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const candidate = asset.fileName?.trim() ?? "";
  const fileName = /\.(jpe?g|png|webp)$/i.test(candidate)
    ? candidate
    : `wafl-work-order-${Date.now()}.${extension}`;
  // The fetched Blob is the exact payload passed to the upload transport. Expo's
  // advisory asset.fileSize can describe the pre-export library asset on iOS.
  const size = blob.size;
  return { name: fileName, type: mimeType, size };
}

export async function prepareAcquiredImageForUpload(asset: ImagePicker.ImagePickerAsset, originalBlob: Blob) {
  const heic = isHeicLikeAcquiredImage({
    mimeType: asset.mimeType ?? originalBlob.type,
    fileName: asset.fileName,
    uri: asset.uri,
  });
  if (!heic) return { blob: originalBlob, file: normalizeAcquiredImageFile(asset, originalBlob), convertedFromHeic: false } as const;

  const converted = await manipulateAsync(asset.uri, [], { compress: 1, format: SaveFormat.JPEG });
  if (!(converted.width > 0) || !(converted.height > 0)) throw new Error("HEIC_JPEG_DIMENSIONS_INVALID");
  const response = await fetch(converted.uri);
  if (!response.ok) throw new Error("HEIC_JPEG_READ_FAILED");
  const blob = await response.blob();
  if (blob.size <= 0) throw new Error("HEIC_JPEG_BYTES_INVALID");
  const sourceName = asset.fileName?.trim().replace(/\.hei[cf]$/i, "") || `wafl-work-order-${Date.now()}`;
  return {
    blob,
    file: { name: `${sourceName}.jpg`, type: "image/jpeg", size: blob.size },
    convertedFromHeic: true,
  } as const;
}
