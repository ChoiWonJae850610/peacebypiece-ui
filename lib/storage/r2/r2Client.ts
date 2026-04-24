import "server-only";
import { createHash, createHmac } from "crypto";
import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
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

type R2HttpResponse = {
  statusCode: number;
  statusMessage: string;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
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

function toCanonicalQueryString(url: URL): string {
  return Array.from(url.searchParams.entries())
    .sort(([aKey, aValue], [bKey, bValue]) => (aKey === bKey ? aValue.localeCompare(bValue) : aKey.localeCompare(bKey)))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
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
  const canonicalHeaders = signedHeaderKeys.map((key) => `${key}:${headers[key].trim()}`).join("\n") + "\n";
  const signedHeaders = signedHeaderKeys.join(";");
  const canonicalRequest = [
    input.method,
    input.url.pathname,
    toCanonicalQueryString(input.url),
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

function readHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function requestR2Object(input: {
  method: "PUT" | "GET";
  url: URL;
  headers: Record<string, string>;
  body?: Buffer;
}): Promise<R2HttpResponse> {
  return new Promise((resolve, reject) => {
    const transport = input.url.protocol === "http:" ? httpRequest : httpsRequest;
    const request = transport({
      protocol: input.url.protocol,
      hostname: input.url.hostname,
      port: input.url.port ? Number(input.url.port) : undefined,
      method: input.method,
      path: `${input.url.pathname}${input.url.search}`,
      headers: input.headers,
      minVersion: "TLSv1.2",
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          statusMessage: response.statusMessage ?? "",
          headers: response.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    request.on("error", reject);
    request.setTimeout(30_000, () => request.destroy(new Error("R2 request timed out.")));

    if (input.body) request.write(input.body);
    request.end();
  });
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
    const response = await requestR2Object({
      method: "PUT",
      url,
      headers: {
        authorization: signed.authorization,
        "content-type": contentType,
        "content-length": String(body.byteLength),
        "x-amz-content-sha256": signed.headers["x-amz-content-sha256"],
        "x-amz-date": signed.headers["x-amz-date"],
      },
      body,
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      const text = response.body.toString("utf8");
      console.error("[R2_UPLOAD_FAIL]", {
        status: response.statusCode,
        statusText: response.statusMessage,
        bucketName: config.bucketName,
        key: input.key,
        endpointHost: url.host,
        responseText: text,
      });
      throw new Error(`R2 upload failed: ${response.statusCode} ${response.statusMessage}${text ? ` - ${text}` : ""}`);
    }
  } catch (error) {
    console.error("[R2_UPLOAD_ERROR]", {
      bucketName: config.bucketName,
      key: input.key,
      endpointHost: url.host,
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined,
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

  const response = await requestR2Object({
    method: "GET",
    url,
    headers: {
      authorization: signed.authorization,
      "x-amz-content-sha256": signed.headers["x-amz-content-sha256"],
      "x-amz-date": signed.headers["x-amz-date"],
    },
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const text = response.body.toString("utf8");
    throw new Error(`R2 download failed: ${response.statusCode} ${response.statusMessage}${text ? ` - ${text}` : ""}`);
  }

  const body = response.body.buffer.slice(response.body.byteOffset, response.body.byteOffset + response.body.byteLength);

  return {
    body,
    contentType: readHeaderValue(response.headers["content-type"]),
    contentLength: readHeaderValue(response.headers["content-length"]),
  };
}

export function createAttachmentFileProxyUrl(storageKey: string): string {
  return `/api/workorders/attachments/file?key=${encodeURIComponent(storageKey)}`;
}
