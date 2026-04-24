import "server-only";
import { createHash, createHmac } from "crypto";
import { getR2Config, type R2Config } from "@/lib/storage/r2/r2Config";

const SERVICE = "s3";
const REGION = "auto";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

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

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function toAmzDate(date = new Date()): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function encodeKeyPath(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildObjectUrl(config: R2Config, key: string): URL {
  const endpoint = config.endpoint.replace(/\/+$/, "");
  return new URL(`${endpoint}/${config.bucketName}/${encodeKeyPath(key)}`);
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
  contentType?: string | null;
}) {
  const host = input.url.host;
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": UNSIGNED_PAYLOAD,
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
    UNSIGNED_PAYLOAD,
  ].join("\n");
  const credentialScope = `${input.dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", input.amzDate, credentialScope, hash(canonicalRequest)].join("\n");
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
  const url = buildObjectUrl(config, input.key);
  const { amzDate, dateStamp } = toAmzDate();
  const contentType = input.contentType ?? "application/octet-stream";
  const signed = createAuthorizationHeader({
    config,
    method: "PUT",
    url,
    amzDate,
    dateStamp,
    contentType,
  });

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      authorization: signed.authorization,
      "content-type": contentType,
      "x-amz-content-sha256": signed.headers["x-amz-content-sha256"],
      "x-amz-date": signed.headers["x-amz-date"],
    },
    body: input.body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 upload failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`);
  }
}

export async function getR2Object(key: string): Promise<R2ObjectGetOutput> {
  const config = requireR2Config();
  const url = buildObjectUrl(config, key);
  const { amzDate, dateStamp } = toAmzDate();
  const signed = createAuthorizationHeader({
    config,
    method: "GET",
    url,
    amzDate,
    dateStamp,
  });

  const response = await fetch(url, {
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
