import type { WorkOrderImageUploadTarget } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { resolveMobileApiUrl } from "../apiTransport";

/**
 * Shared binary transport for image and attachment upload targets. The caller
 * owns acquisition and command semantics; this module only performs the
 * authenticated target PUT without changing bytes or version ownership.
 */
export async function putWorkOrderAssetBlob(target: WorkOrderImageUploadTarget, blob: Blob): Promise<void> {
  let response: Response;
  try {
    const uploadUrl = resolveMobileApiUrl(target.uploadUrl);
    if (!uploadUrl) throw new Error("UPLOAD_URL_INVALID");
    response = await fetch(uploadUrl, {
      method: target.method,
      headers: { ...target.headers },
      body: blob,
    });
  } catch {
    throw new MobileApiError({ code: "NETWORK_ERROR", message: "이미지 파일을 전송하지 못했습니다." });
  }
  if (!response.ok) {
    throw new MobileApiError({ code: "NETWORK_ERROR", message: `이미지 파일 전송에 실패했습니다. (${response.status})`, status: response.status });
  }
}

// Compatibility name retained for the existing mutation-controller facade.
export const putWorkOrderImageBlob = putWorkOrderAssetBlob;
