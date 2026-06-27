import { createHmac, createHash } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// ================================
// [R2 Client]
// ================================

type GetR2ObjectInput =
  | string
  | {
      key: string;
    };

type R2ObjectResult = {
  body: Buffer;
  contentType: string;
  contentLength: number;
};

export type PutR2ObjectInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string | null;
};

export type CreateR2PresignedPutUrlInput = {
  key: string;
  contentType?: string | null;
  expiresInSeconds?: number;
};

export type R2PresignedPutUrlResult = {
  key: string;
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresInSeconds: number;
};

let cachedClient: S3Client | null = null;

function normalizeEndpoint(endpoint: string): string {
  const value = endpoint.trim().replace(/\/+$/, "");

  if (!value || value.includes("<") || value.includes(">")) {
    throw new Error("R2_INVALID_ENDPOINT");
  }

  if (!value.startsWith("https://")) {
    throw new Error("R2_INVALID_ENDPOINT");
  }

  return value;
}

function cleanStorageKey(key: string): string {
  const value = key.replace(/^\/+/, "").trim();

  if (!value || value.includes("<") || value.includes(">")) {
    throw new Error("R2_INVALID_STORAGE_KEY");
  }

  return value;
}

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("R2_NOT_CONFIGURED");
  }

  return {
    endpoint: normalizeEndpoint(endpoint),
    accessKeyId,
    secretAccessKey,
    bucketName,
  };
}

function createR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const config = getR2Config();

  cachedClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
}

function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Promise.resolve(Buffer.alloc(0));

  if (Buffer.isBuffer(body)) return Promise.resolve(body);

  if (body instanceof Uint8Array) {
    return Promise.resolve(Buffer.from(body.buffer, body.byteOffset, body.byteLength));
  }

  if (body instanceof Readable) {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      body.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      body.on("error", reject);
      body.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    return (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray().then((bytes) => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  }

  throw new Error("R2_INVALID_OBJECT_BODY");
}

function encodeStoragePath(value: string): string {
  return value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function formatAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function getSigningKey(secretAccessKey: string, dateStamp: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, "auto");
  const dateRegionServiceKey = hmac(dateRegionKey, "s3");
  return hmac(dateRegionServiceKey, "aws4_request");
}

function buildCanonicalQuery(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
}

// ================================
// [Public helpers]
// ================================

function getR2SafeErrorLog(error: unknown): { message?: string; code?: string; name?: string } {
  if (!error || typeof error !== "object") {
    return {};
  }

  const record = error as { message?: unknown; code?: unknown; name?: unknown };

  return {
    message: typeof record.message === "string" ? record.message : undefined,
    code: typeof record.code === "string" ? record.code : undefined,
    name: typeof record.name === "string" ? record.name : undefined,
  };
}

export function createAttachmentFileProxyUrl(key: string): string {
  const cleanKey = cleanStorageKey(key);
  return `/api/workorders/attachments/file?key=${encodeURIComponent(cleanKey)}`;
}

export function createR2PresignedPutUrl(input: CreateR2PresignedPutUrlInput): R2PresignedPutUrlResult {
  const config = getR2Config();
  const key = cleanStorageKey(input.key);
  const contentType = input.contentType || "application/octet-stream";
  const expiresInSeconds = Math.min(Math.max(input.expiresInSeconds ?? 900, 60), 3600);
  const now = new Date();
  const { amzDate, dateStamp } = formatAmzDate(now);
  const endpoint = new URL(config.endpoint);
  const host = endpoint.host;
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "content-type;host";
  const canonicalUri = `/${encodeStoragePath(config.bucketName)}/${encodeStoragePath(key)}`;
  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalQueryString = buildCanonicalQuery(queryParams);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", getSigningKey(config.secretAccessKey, dateStamp)).update(stringToSign, "utf8").digest("hex");
  const url = `${config.endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

  return {
    key,
    url,
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    expiresInSeconds,
  };
}

export async function putR2Object(input: PutR2ObjectInput): Promise<void> {
  const config = getR2Config();
  const client = createR2Client();
  const key = cleanStorageKey(input.key);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: input.body,
        ContentType: input.contentType || "application/octet-stream",
      })
    );
  } catch (error: unknown) {
    console.error("[R2_PUT_ERROR]", {
      hasKey: Boolean(key),
      ...getR2SafeErrorLog(error),
    });

    throw error;
  }
}

export async function getR2Object(input: GetR2ObjectInput): Promise<R2ObjectResult> {
  const config = getR2Config();
  const client = createR2Client();
  const key = cleanStorageKey(typeof input === "string" ? input : input.key);

  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );

    const body = await streamToBuffer(result.Body);

    return {
      body,
      contentType: result.ContentType || "application/octet-stream",
      contentLength: Number(result.ContentLength || body.byteLength),
    };
  } catch (error: unknown) {
    console.error("[R2_GET_ERROR]", {
      hasKey: Boolean(key),
      ...getR2SafeErrorLog(error),
    });

    throw error;
  }
}

export async function deleteR2Object(input: GetR2ObjectInput): Promise<void> {
  const config = getR2Config();
  const client = createR2Client();
  const key = cleanStorageKey(typeof input === "string" ? input : input.key);

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      })
    );
  } catch (error: unknown) {
    console.error("[R2_DELETE_ERROR]", {
      hasKey: Boolean(key),
      ...getR2SafeErrorLog(error),
    });

    throw error;
  }
}

export async function deleteR2ObjectWithPresignedRequest(input: GetR2ObjectInput): Promise<void> {
  const config = getR2Config();
  const key = cleanStorageKey(typeof input === "string" ? input : input.key);
  const now = new Date();
  const { amzDate, dateStamp } = formatAmzDate(now);
  const endpoint = new URL(config.endpoint);
  const host = endpoint.host;
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const signedHeaders = "host";
  const canonicalUri = `/${encodeStoragePath(config.bucketName)}/${encodeStoragePath(key)}`;
  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "300",
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalQueryString = buildCanonicalQuery(queryParams);
  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [
    "DELETE",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", getSigningKey(config.secretAccessKey, dateStamp)).update(stringToSign, "utf8").digest("hex");
  const url = `${config.endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error("[R2_PRESIGNED_DELETE_ERROR]", {
      hasKey: Boolean(key),
      status: response.status,
      message,
    });
    throw new Error(message || `R2_PRESIGNED_DELETE_FAILED_${response.status}`);
  }
}
