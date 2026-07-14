import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  selectRepresentativeAsset,
  sha256Hex,
  type WorkOrderIssuedPdfAssetDescriptor,
} from "@/lib/generated-documents/work-order-pdf/snapshot";

const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);
const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
const SAMPLE_ASSET_ID = "90000000-0000-4000-8000-000000000037";

export type ResolvedGeneratedDocumentAsset = {
  readonly descriptor: WorkOrderIssuedPdfAssetDescriptor;
  readonly dataUrl: string;
  readonly byteLength: number;
  readonly contentSha256: string;
};

export interface GeneratedDocumentAssetResolver {
  resolveRepresentativeImage(
    assets: readonly WorkOrderIssuedPdfAssetDescriptor[],
  ): Promise<ResolvedGeneratedDocumentAsset | null>;
}

async function readRepositorySampleAsset(): Promise<{
  readonly bytes: Buffer;
  readonly contentSha256: string;
}> {
  const bytes = await readFile(path.join(
    process.cwd(),
    "public/dev-samples/linen-round-dress-sketch.svg",
  ));
  return { bytes, contentSha256: sha256Hex(bytes) };
}

export async function createRepositorySampleAssetDescriptor(
  companyId: string,
): Promise<WorkOrderIssuedPdfAssetDescriptor> {
  const source = await readRepositorySampleAsset();
  return {
    assetType: "image",
    revisionAssetId: SAMPLE_ASSET_ID,
    companyId,
    filename: "linen-round-dress-sketch.svg",
    mimeType: "image/svg+xml",
    storageObjectKeySnapshot: null,
    displayOrder: 0,
    isRepresentative: true,
    includeInDocument: true,
    sourceSizeBytes: source.bytes.byteLength,
    sourceContentSha256: source.contentSha256,
  };
}

export class RepositorySampleGeneratedDocumentAssetResolver
implements GeneratedDocumentAssetResolver {
  async resolveRepresentativeImage(
    assets: readonly WorkOrderIssuedPdfAssetDescriptor[],
  ): Promise<ResolvedGeneratedDocumentAsset | null> {
    const descriptor = selectRepresentativeAsset(assets);
    if (!descriptor) return null;
    if (descriptor.revisionAssetId !== SAMPLE_ASSET_ID
      || descriptor.filename !== "linen-round-dress-sketch.svg") {
      throw new Error("PDF_SAMPLE_ASSET_NOT_ALLOWED");
    }
    if (!SUPPORTED_IMAGE_MIME_TYPES.has(descriptor.mimeType)) {
      throw new Error("PDF_ASSET_MIME_UNSUPPORTED");
    }

    const source = await readRepositorySampleAsset();
    if (source.bytes.byteLength <= 0 || source.bytes.byteLength > MAX_SOURCE_IMAGE_BYTES) {
      throw new Error("PDF_ASSET_SIZE_INVALID");
    }
    if (source.bytes.byteLength !== descriptor.sourceSizeBytes) {
      throw new Error("PDF_ASSET_SIZE_MISMATCH");
    }
    if (descriptor.sourceContentSha256
      && source.contentSha256 !== descriptor.sourceContentSha256) {
      throw new Error("PDF_ASSET_HASH_MISMATCH");
    }

    return {
      descriptor,
      dataUrl: `data:${descriptor.mimeType};base64,${source.bytes.toString("base64")}`,
      byteLength: source.bytes.byteLength,
      contentSha256: source.contentSha256,
    };
  }
}
