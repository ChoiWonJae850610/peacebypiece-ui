import "server-only";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
};

const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
] as const;

export type R2EnvKey = (typeof R2_ENV_KEYS)[number];

function readEnv(key: R2EnvKey): string | null {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildEndpoint(accountId: string): string {
  const configured = readEnv("R2_ENDPOINT");
  if (configured) return configured.replace(/\/+$/, "");
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function getR2Config(): R2Config | null {
  const accountId = readEnv("R2_ACCOUNT_ID");
  const accessKeyId = readEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = readEnv("R2_BUCKET_NAME");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return null;

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint: buildEndpoint(accountId),
  };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

export function getSupportedR2EnvKeys(): readonly R2EnvKey[] {
  return R2_ENV_KEYS;
}
