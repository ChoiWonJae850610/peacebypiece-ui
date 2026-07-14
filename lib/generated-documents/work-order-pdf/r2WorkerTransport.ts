import "server-only";

import { createHash } from "node:crypto";

import {
  createR2WorkerFileUrl,
  createR2WorkerUploadUrl,
} from "@/lib/storage/r2/r2WorkerUpload";
import { isCanonicalWorkOrderPdfStorageKey } from "@/lib/workorder/pdf/workOrderPdfPolicy";
import type {
  GeneratedDocumentObjectMetadata,
  GeneratedDocumentR2Transport,
} from "./objectStore";

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertKey(key: string): string {
  if (!isCanonicalWorkOrderPdfStorageKey(key)) throw new Error("PDF_R2_KEY_INVALID");
  return key;
}

async function readPdfResponse(response: Response): Promise<Buffer> {
  if (!response.ok) {
    await response.text().catch(() => "");
    throw new Error(`PDF_R2_GET_FAILED_${response.status}`);
  }
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/pdf") throw new Error("PDF_R2_CONTENT_TYPE_INVALID");
  return Buffer.from(await response.arrayBuffer());
}

export class R2WorkerGeneratedDocumentTransport implements GeneratedDocumentR2Transport {
  async put(input: GeneratedDocumentObjectMetadata & { readonly body: Buffer }): Promise<void> {
    const key = assertKey(input.key);
    if (input.contentType !== "application/pdf"
      || input.body.byteLength !== input.fileSizeBytes
      || sha256(input.body) !== input.contentSha256) {
      throw new Error("PDF_R2_PUT_INPUT_INVALID");
    }
    const request = createR2WorkerUploadUrl({ key, contentType: "application/pdf" });
    const response = await fetch(request.url, {
      method: request.method,
      headers: { ...request.headers, "Content-Length": String(input.body.byteLength) },
      body: new Uint8Array(input.body),
    });
    if (!response.ok) {
      await response.text().catch(() => "");
      throw new Error(`PDF_R2_PUT_FAILED_${response.status}`);
    }
  }

  async head(key: string): Promise<GeneratedDocumentObjectMetadata | null> {
    const body = await this.get(key);
    if (!body) return null;
    return {
      key,
      contentType: "application/pdf",
      fileSizeBytes: body.byteLength,
      contentSha256: sha256(body),
    };
  }

  async get(key: string): Promise<Buffer | null> {
    const request = createR2WorkerFileUrl({ key: assertKey(key) });
    const response = await fetch(request.url, { method: request.method });
    if (response.status === 404) return null;
    return readPdfResponse(response);
  }

  delete(): Promise<void> {
    return Promise.reject(new Error("PDF_R2_DELETE_DISABLED_ALPHA38"));
  }
}
