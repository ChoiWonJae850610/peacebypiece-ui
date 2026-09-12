import { createHash } from "node:crypto";

export type GeneratedDocumentArtifactHealth = "healthy" | "missing" | "corrupt" | "transient_error";

export type GeneratedDocumentArtifactMetadata = {
  readonly documentId: string;
  readonly objectKey: string | null;
  readonly fileSizeBytes: number | null;
  readonly contentSha256: string | null;
};

export function classifyGeneratedDocumentArtifact(input: {
  readonly metadata: GeneratedDocumentArtifactMetadata;
  readonly body: Buffer | null;
}): GeneratedDocumentArtifactHealth {
  if (!input.metadata.objectKey || input.metadata.fileSizeBytes === null || !input.metadata.contentSha256) return "corrupt";
  if (input.body === null) return "missing";
  const pdfHeader = input.body.subarray(0, 5).toString("ascii") === "%PDF-";
  const pdfEof = input.body.subarray(Math.max(0, input.body.byteLength - 2048)).includes(Buffer.from("%%EOF", "ascii"));
  if (input.body.byteLength !== input.metadata.fileSizeBytes
    || createHash("sha256").update(input.body).digest("hex") !== input.metadata.contentSha256
    || !pdfHeader
    || !pdfEof) return "corrupt";
  return "healthy";
}
