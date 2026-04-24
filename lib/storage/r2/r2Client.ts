import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// ================================
// [R2 Client]
// ================================

type R2BodyInput = Buffer | Uint8Array | ArrayBuffer;

type PutR2ObjectInput = {
  key: string;
  body: R2BodyInput;
  contentType?: string | null;
};

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
  const endpoint = process.env.R2_ENDPOINT;
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

function toBuffer(body: R2BodyInput): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);

  if (Buffer.isBuffer(body)) return body;

  if (body instanceof Uint8Array) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  throw new Error("R2_INVALID_OBJECT_BODY");
}

// ================================
// [Public helpers]
// ================================

export function createAttachmentFileProxyUrl(key: string): string {
  const cleanKey = cleanStorageKey(key);
  return `/api/workorders/attachments/file?key=${encodeURIComponent(cleanKey)}`;
}

export async function putR2Object(input: PutR2ObjectInput): Promise<{ ok: true; key: string }> {
  const config = getR2Config();
  const client = createR2Client();
  const key = cleanStorageKey(input.key);
  const body = toBuffer(input.body);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: body,
        ContentType: input.contentType || "application/octet-stream",
      })
    );

    return { ok: true, key };
  } catch (error: any) {
    console.error("[R2_UPLOAD_ERROR]", {
      bucketName: config.bucketName,
      key,
      endpoint: config.endpoint,
      message: error?.message,
      code: error?.code,
      name: error?.name,
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
  } catch (error: any) {
    console.error("[R2_GET_ERROR]", {
      bucketName: config.bucketName,
      key,
      endpoint: config.endpoint,
      message: error?.message,
      code: error?.code,
      name: error?.name,
    });

    throw error;
  }
}

export async function uploadToR2(params: {
  key: string;
  body: R2BodyInput;
  contentType: string;
}): Promise<{ ok: true; key: string }> {
  return putR2Object({
    key: params.key,
    body: params.body,
    contentType: params.contentType,
  });
}
