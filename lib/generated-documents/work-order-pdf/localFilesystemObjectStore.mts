import { createHash } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  GeneratedDocumentObjectMetadata,
  GeneratedDocumentObjectStore,
} from "./objectStore.ts";

const CANONICAL_PDF_KEY = /^companies\/[^/]+\/workorders\/[^/]+\/pdf\/[^/]+\.pdf$/i;

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertCanonicalKey(key: string): string {
  const normalized = key.trim();
  if (!CANONICAL_PDF_KEY.test(normalized)
    || normalized.startsWith("/")
    || normalized.includes("\\")
    || normalized.includes("..")) {
    throw new Error("PDF_OBJECT_KEY_INVALID");
  }
  return normalized;
}

export class LocalFilesystemGeneratedDocumentObjectStore implements GeneratedDocumentObjectStore {
  readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolveKey(key: string): string {
    const normalized = assertCanonicalKey(key);
    const target = path.resolve(this.root, ...normalized.split("/"));
    if (!target.startsWith(`${this.root}${path.sep}`)) throw new Error("PDF_OBJECT_PATH_INVALID");
    return target;
  }

  async putPdf(input: GeneratedDocumentObjectMetadata & { readonly body: Buffer }) {
    const target = this.resolveKey(input.key);
    if (input.contentType !== "application/pdf") throw new Error("PDF_OBJECT_CONTENT_TYPE_INVALID");
    if (input.body.byteLength !== input.fileSizeBytes || sha256(input.body) !== input.contentSha256) {
      throw new Error("PDF_OBJECT_INTEGRITY_INVALID");
    }
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await writeFile(target, input.body, { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing = await readFile(target);
      if (existing.byteLength !== input.fileSizeBytes || sha256(existing) !== input.contentSha256) {
        throw new Error("PDF_OBJECT_OVERWRITE_FORBIDDEN");
      }
    }
    return {
      key: input.key,
      contentType: input.contentType,
      fileSizeBytes: input.fileSizeBytes,
      contentSha256: input.contentSha256,
    };
  }

  async headPdf(key: string): Promise<GeneratedDocumentObjectMetadata | null> {
    const target = this.resolveKey(key);
    try {
      const metadata = await stat(target);
      const body = await readFile(target);
      return {
        key,
        contentType: "application/pdf",
        fileSizeBytes: metadata.size,
        contentSha256: sha256(body),
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async getPdf(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolveKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async deletePdf(key: string): Promise<void> {
    try {
      await unlink(this.resolveKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
