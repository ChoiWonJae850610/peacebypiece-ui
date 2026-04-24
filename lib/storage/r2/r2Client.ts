import "server-only";
import { createHash, createHmac } from "crypto";
import { getR2Config, type R2Config } from "@/lib/storage/r2/r2Config";

const SERVICE = "s3";
const REGION = "auto";

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

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function toAmzDate(date = new Date()): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function toBodyBuffer(body: Buffer | Uint8Array | ArrayBuffer): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
}

function encodeKeyPath(key: string): string {
  return key
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function normalizeEndpoint(config: R2Config): string {
  const endpoint = config.endpoint.trim();
  if (!endpoint || endpoint.includes("<") || endpoint.includes(">")) {
    throw new Error("Invalid R2 endpoint. Remove placeholder brackets from R2_ENDPOINT.");
  }

  const url = new URL(endpoint.replace(/\/+$/, ""));
  const bucketPath = `/${config.bucketName}`;
  if (url.pathname === bucketPath || url.pathname === `${bucketPath}/`) {
    url.pathname = "";
  }
  if (url.pathname && url.pathname !== "/") {
    throw new Error("Invalid R2 endpoint. Use account endpoint only, not an object path.");
  }

  return url.toString().replace(/\/+$/, "");
}

function buildObjectUrl(config: R2Config, key: string): URL {
  const endpoint = normalizeEndpoint(config);
  const cleanBucketName = config.bucketName.trim().replace(/^\/+|\/+$/g, "");
  const cleanKey = encodeKeyPath(key);

  if (!cleanBucketName) throw new Error("R2 bucket name is not configured.");
  if (!cleanKey) throw new Error("R2 storage key is empty.");

  return new URL(`${endpoint}/${encodeURIComponent(cleanBucketName)}/${cleanKey}`);
}

function createSigningKey(secretAccessKey: string, dateStamp: string): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

function createAuthorizationHeader(input: {
  config: R2Config;
  method: string;
  url: URL;
  amzDate: string;
  dateStamp: string;
  payloadHash: string;
  contentType?: string | null;
}) {
  const headers: Record<string, string> = {
    host: input.url.host,
    "x-amz-content-sha256": input.payloadHash,
    "x-amz-date": input.amzDate,
  };

  if (input.contentType) headers["content-type"] = input.contentType;

  const signedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderKeys.map((key) => `${key}:${headers[key]}`).join("\n") + "\n";
  const signedHeaders = signedHeaderKeys.join(";");
  const canonicalRequest = [
    input.method,
    input.url.pathname,
    input.url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    input.payloadHash,
  ].join("\n");
  const credentialScope = `${input.dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", input.amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", createSigningKey(input.config.secretAccessKey, input.dateStamp)).update(stringToSign).digest("hex");

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${input.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    headers,
  };
}

function requireR2Config(): R2Config {
  const config = getR2Config();
  if (!config) throw new Error("R2 storage is not configured.");
  return config;
}

export async function putR2Object(input: R2ObjectPutInput): Promise<void> {
  const config = requireR2Config();
  const body = toBodyBuffer(input.body);
  const url = buildObjectUrl(config, input.key);
  const { amzDate, dateStamp } = toAmzDate();
  const contentType = input.contentType ?? "application/octet-stream";
  const payloadHash = sha256Hex(body);
  const signed = createAuthorizationHeader({
    config,
    method: "PUT",
    url,
    amzDate,
    dateStamp,
    payloadHash,
    contentType,
  });

  try {
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        authorization: signed.authorization,
        "content-type": contentType,
        "content-length": String(body.byteLength),
        "x-amz-content-sha256": signed.headers["x-amz-content-sha256"],
        "x-amz-date": signed.headers["x-amz-date"],
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[R2_UPLOAD_FAIL]", {
        status: response.status,
        statusText: response.statusText,
        bucketName: config.bucketName,
        key: input.key,
        endpointHost: url.host,
        responseText: text,
      });
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`);
    }
  } catch (error) {
    console.error("[R2_UPLOAD_ERROR]", {
      bucketName: config.bucketName,
      key: input.key,
      endpointHost: url.host,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getR2Object(key: string): Promise<R2ObjectGetOutput> {
  const config = requireR2Config();
  const url = buildObjectUrl(config, key);
  const { amzDate, dateStamp } = toAmzDate();
  const payloadHash = sha256Hex("");
  const signed = createAuthorizationHeader({
    config,
    method: "GET",
    url,
    amzDate,
    dateStamp,
    payloadHash,
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      authorization: signed.authorization,
      "x-amz-content-sha256": signed.headers["x-amz-content-sha256"],
      "x-amz-date": signed.headers["x-amz-date"],
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 download failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`);
  }

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
  };
}

export function createAttachmentFileProxyUrl(storageKey: string): string {
  return `/api/workorders/attachments/file?key=${encodeURIComponent(storageKey)}`;
}
