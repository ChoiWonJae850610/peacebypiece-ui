import { MobileApiError } from "@/domain/mobileContract";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import ReactNativeBlobUtil, { type FetchBlobResponse } from "react-native-blob-util";

const DOCUMENT_VIEWER_DOWNLOAD_TIMEOUT_MS = 60_000;
const DOCUMENT_PDF_MAX_BYTES = 30 * 1024 * 1024;

export type AuthenticatedDocumentPdfFile = {
  readonly path: string;
  readonly sizeBytes: number;
  readonly dispose: () => Promise<void>;
};

export type AuthenticatedDocumentPdfSaveFile = AuthenticatedDocumentPdfFile & {
  readonly filename: string;
  readonly sha256: string;
};

function responseHeader(response: FetchBlobResponse, name: string): string {
  const headers = response.info().headers ?? {};
  const match = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  return match ? String(headers[match] ?? "") : "";
}

async function verifyPdfFile(path: string, sizeBytes: number): Promise<void> {
  if (sizeBytes < 5 || sizeBytes > DOCUMENT_PDF_MAX_BYTES) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "PDF 파일 크기가 올바르지 않습니다." });
  }
  const base64 = String(await ReactNativeBlobUtil.fs.readFile(path, "base64"));
  if (!base64.startsWith("JVBERi0")) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "PDF 파일 형식이 올바르지 않습니다." });
  }
}

function safePdfFilename(displayDocumentNumber: string): string {
  const stem = displayDocumentNumber.trim().replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+|\.+$/g, "") || "WAFL-work-instruction";
  return `${stem}.pdf`;
}

export async function downloadAuthenticatedDocumentPdf(input: {
  readonly documentId: string;
  readonly inlineUrl: string;
}): Promise<AuthenticatedDocumentPdfFile> {
  const expectedPath = `/api/v2/work-orders/documents/${encodeURIComponent(input.documentId)}/file?disposition=inline`;
  if (input.inlineUrl !== expectedPath) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "문서 경로가 올바르지 않습니다." });
  }
  const url = resolveMobileApiUrl(input.inlineUrl);
  if (!url) throw new MobileApiError({ code: "API_ORIGIN_INVALID", message: "문서 경로가 올바르지 않습니다." });

  let response: FetchBlobResponse | null = null;
  try {
    response = await ReactNativeBlobUtil.config({
      appendExt: "pdf",
      fileCache: true,
      timeout: DOCUMENT_VIEWER_DOWNLOAD_TIMEOUT_MS,
    }).fetch("GET", url, {
      Accept: "application/pdf",
      "Cache-Control": "no-store",
    });
    const info = response.info();
    const contentType = responseHeader(response, "content-type").toLowerCase();
    const path = response.path();
    const stat = path ? await ReactNativeBlobUtil.fs.stat(path) : null;
    if (info.status !== 200 || !contentType.includes("application/pdf") || !stat || stat.size < 5) {
      response.flush();
      throw new MobileApiError({ code: info.status === 401 ? "AUTH_REQUIRED" : "MALFORMED_RESPONSE", message: "PDF를 불러오지 못했습니다.", status: info.status });
    }
    await verifyPdfFile(path, stat.size);
    let disposed = false;
    return {
      path,
      sizeBytes: stat.size,
      dispose: async () => {
        if (disposed) return;
        disposed = true;
        try { response?.flush(); } catch { /* cache cleanup is best-effort */ }
      },
    };
  } catch (error) {
    try { response?.flush(); } catch { /* cache cleanup is best-effort */ }
    if (error instanceof MobileApiError) throw error;
    throw new MobileApiError({ code: "NETWORK_ERROR", message: "PDF를 불러오지 못했습니다." });
  }
}

export async function prepareAuthenticatedDocumentPdfForSave(input: {
  readonly displayDocumentNumber: string;
  readonly documentId: string;
  readonly inlineUrl: string;
}): Promise<AuthenticatedDocumentPdfSaveFile> {
  const downloaded = await downloadAuthenticatedDocumentPdf(input);
  const filename = safePdfFilename(input.displayDocumentNumber);
  const destination = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/wafl-save-${Date.now()}-${filename}`;
  try {
    await ReactNativeBlobUtil.fs.cp(downloaded.path, destination);
    const [sourceHash, destinationHash, stat] = await Promise.all([
      ReactNativeBlobUtil.fs.hash(downloaded.path, "sha256"),
      ReactNativeBlobUtil.fs.hash(destination, "sha256"),
      ReactNativeBlobUtil.fs.stat(destination),
    ]);
    if (sourceHash !== destinationHash || stat.size !== downloaded.sizeBytes) {
      throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "저장할 PDF 파일을 확인하지 못했습니다." });
    }
    await verifyPdfFile(destination, stat.size);
    let disposed = false;
    return {
      filename,
      path: destination,
      sha256: destinationHash,
      sizeBytes: stat.size,
      dispose: async () => {
        if (disposed) return;
        disposed = true;
        try {
          if (await ReactNativeBlobUtil.fs.exists(destination)) await ReactNativeBlobUtil.fs.unlink(destination);
        } catch { /* temporary save-file cleanup is best-effort */ }
      },
    };
  } catch (error) {
    try {
      if (await ReactNativeBlobUtil.fs.exists(destination)) await ReactNativeBlobUtil.fs.unlink(destination);
    } catch { /* cleanup after a failed copy is best-effort */ }
    if (error instanceof MobileApiError) throw error;
    throw new MobileApiError({ code: "NETWORK_ERROR", message: "저장할 PDF 파일을 준비하지 못했습니다." });
  } finally {
    await downloaded.dispose();
  }
}
