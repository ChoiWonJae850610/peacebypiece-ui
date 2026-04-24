import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getR2Config, type R2Config } from "@/lib/storage/r2/r2Config";

export type R2ObjectPutInput = {
  key: string;
  body: Buffer | Uint8Array | ArrayBuffer;
  contentType?: string | null;
};

export type R2ObjectGetOutput = {
  body: ArrayBuffer;
  contentType: string | null;
  contentLength: string | null;
};

function requireR2Config(): R2Config {
  const config = getR2Config();
  if (!config) throw new Error("R2 storage is not configured.");
  return config;
}

function normalizeEndpoint(endpoint: string): string {
  const value = endpoint.trim();
  if (!value || value.includes("<") || value.includes(">")) {
    throw new Error("Invalid R2 endpoint. Remove placeholder brackets from R2_ENDPOINT.");
  }

  const url = new URL(value.replace(/\/+$/, ""));
  if (url.pathname && url.pathname !== "/") {
    throw new Error("Invalid R2 endpoint. Use account endpoint only, not a bucket or object URL.");
  }

  return url.toString().replace(/\/+$/, "");
}

function cleanStorageKey(key: string): string {
  const value = key.replace(/^\/+/, "").trim();
  if (!value || value.includes("<") || value.includes(">")) {
    throw new Error("Invalid R2 storage key.");
  }
  return value;
}

function toBodyBuffer(body: Buffer | Uint8Array | ArrayBuffer): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
}

function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

async function arrayBufferFromBody(body: unknown): Promise<ArrayBuffer> {
  if (body instanceof Uint8Array) {
    return copyBytesToArrayBuffer(body);
  }

  if (body && typeof body === "object" && "transformToByteArray" in body) {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return copyBytesToArrayBuffer(bytes);
  }

  if (body && typeof body === "object" && "arrayBuffer" in body) {
    return (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
  }

  throw new Error("Unsupported R2 response body.");
}

function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: normalizeEndpoint(config.endpoint),
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function putR2Object(input: R2ObjectPutInput): Promise<void> {
  const config = requireR2Config();
  const key = cleanStorageKey(input.key);
  const body = toBodyBuffer(input.body);
  const contentType = input.contentType ?? "application/octet-stream";
  const client = createR2Client(config);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (error) {
    console.error("[R2_UPLOAD_ERROR]", {
      bucketName: config.bucketName,
      key,
      endpoint: normalizeEndpoint(config.endpoint),
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getR2Object(key: string): Promise<R2ObjectGetOutput> {
  const config = requireR2Config();
  const cleanKey = cleanStorageKey(key);
  const client = createR2Client(config);

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: cleanKey,
      }),
    );

    return {
      body: await arrayBufferFromBody(response.Body),
      contentType: response.ContentType ?? null,
      contentLength: response.ContentLength == null ? null : String(response.ContentLength),
    };
  } catch (error) {
    console.error("[R2_DOWNLOAD_ERROR]", {
      bucketName: config.bucketName,
      key: cleanKey,
      endpoint: normalizeEndpoint(config.endpoint),
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function createAttachmentFileProxyUrl(storageKey: string): string {
  return `/api/workorders/attachments/file?key=${encodeURIComponent(storageKey)}`;
}
