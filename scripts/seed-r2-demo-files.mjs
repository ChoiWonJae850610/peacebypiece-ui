#!/usr/bin/env node
/**
 * PeaceByPiece R2 realistic attachment demo helper.
 *
 * Usage examples:
 *   node scripts/seed-r2-demo-files.mjs --preset=small --mode=generate
 *   node scripts/seed-r2-demo-files.mjs --preset=small --mode=upload --confirm-upload
 *   node scripts/seed-r2-demo-files.mjs --preset=small --mode=verify
 *   node scripts/seed-r2-demo-files.mjs --preset=small --mode=all --confirm-upload
 *
 * Required env for DB metadata read:
 *   DATABASE_URL
 *
 * Required env for upload / verify:
 *   R2_WORKER_UPLOAD_URL
 *   R2_WORKER_UPLOAD_SECRET
 */
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHmac } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT_DIR = path.join(PROJECT_ROOT, ".tmp", "r2-demo-files");
const DEFAULT_MANIFEST_DIR = path.join(PROJECT_ROOT, ".tmp", "r2-demo-manifests");

const PRESETS = {
  small: { label: "small", maxFiles: 50, maxTotalBytes: 50 * 1024 * 1024 },
  medium: { label: "medium", maxFiles: 300, maxTotalBytes: 500 * 1024 * 1024 },
  large: { label: "large", maxFiles: 1200, maxTotalBytes: 2 * 1024 * 1024 * 1024 },
};

const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ax3pPAAAAAASUVORK5CYII=",
  "base64",
);
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 20 100 Td (PeaceByPiece demo) Tj ET\nendstream endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
  "utf8",
);
const MINIMAL_ZIP = Buffer.from("UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==", "base64");
const MINIMAL_TXT = Buffer.from("PeaceByPiece realistic demo file.\n", "utf8");

function parseArgs(argv) {
  const args = new Map();
  const flags = new Set();
  for (const raw of argv.slice(2)) {
    if (!raw.startsWith("--")) continue;
    const withoutPrefix = raw.slice(2);
    const eqIndex = withoutPrefix.indexOf("=");
    if (eqIndex === -1) {
      flags.add(withoutPrefix);
    } else {
      args.set(withoutPrefix.slice(0, eqIndex), withoutPrefix.slice(eqIndex + 1));
    }
  }
  return { args, flags };
}

const { args, flags } = parseArgs(process.argv);
const presetName = args.get("preset") || "small";
const mode = args.get("mode") || "generate";
const outDir = path.resolve(args.get("out") || DEFAULT_OUT_DIR);
const manifestDir = path.resolve(args.get("manifest-dir") || DEFAULT_MANIFEST_DIR);
const dryRun = flags.has("dry-run");
const confirmUpload = flags.has("confirm-upload");
const includeDeleted = flags.has("include-deleted");
const preset = PRESETS[presetName];

if (!preset) {
  fail(`Unknown preset: ${presetName}. Use one of ${Object.keys(PRESETS).join(", ")}.`);
}
if (!["generate", "upload", "verify", "all", "plan"].includes(mode)) {
  fail("Unknown mode. Use --mode=plan|generate|upload|verify|all.");
}

function fail(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function readEnv(name, required = true) {
  const value = process.env[name];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (required) fail(`${name} environment variable is required.`);
  return null;
}

function sanitizeStorageKey(key) {
  const value = String(key || "").trim().replace(/^\/+/, "");
  if (!value.startsWith("workorders/")) fail(`Unsafe storage key: ${key}`);
  if (value.includes("..") || value.includes("\\")) fail(`Unsafe storage key: ${key}`);
  return value;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function signWorkerRequest({ method, key, contentType, expiresAt, secret }) {
  const payload = method === "PUT"
    ? ["PUT", key, contentType || "application/octet-stream", String(expiresAt)].join("\n")
    : [method, key, String(expiresAt)].join("\n");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function buildWorkerUrl({ method, key, contentType }) {
  const uploadUrl = normalizeBaseUrl(readEnv("R2_WORKER_UPLOAD_URL"));
  const secret = readEnv("R2_WORKER_UPLOAD_SECRET");
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;
  const signature = signWorkerRequest({ method, key, contentType, expiresAt, secret });
  const url = new URL(uploadUrl);
  url.searchParams.set("key", key);
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("signature", signature);
  if (method === "PUT") url.searchParams.set("contentType", contentType || "application/octet-stream");
  return url.toString();
}

async function withDb(callback) {
  const client = new Client({ connectionString: readEnv("DATABASE_URL") });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function readAttachmentRows() {
  return withDb(async (client) => {
    const result = await client.query(
      `
        SELECT
          id,
          order_id,
          type,
          storage_key,
          thumbnail_key,
          original_name,
          mime_type,
          COALESCE(size_bytes, 0)::bigint AS size_bytes,
          is_active,
          deleted_at,
          created_at
        FROM attachments
        WHERE id LIKE 'realistic-attachment-%'
          AND storage_key IS NOT NULL
          AND storage_key LIKE 'workorders/%'
          ${includeDeleted ? "" : "AND deleted_at IS NULL AND COALESCE(is_active, true) = true"}
        ORDER BY created_at ASC, id ASC
      `,
    );
    return result.rows.map((row) => ({
      ...row,
      size_bytes: Number(row.size_bytes || 0),
    }));
  });
}

function getBasePayloadForMime(mimeType, fileName) {
  const mime = String(mimeType || "").toLowerCase();
  const name = String(fileName || "").toLowerCase();
  if (mime.includes("pdf") || name.endsWith(".pdf")) return MINIMAL_PDF;
  if (mime.includes("zip") || name.endsWith(".zip")) return MINIMAL_ZIP;
  if (mime.includes("image") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) return MINIMAL_PNG;
  return MINIMAL_TXT;
}

function getUploadContentType(item) {
  if (item.isThumbnail) return "image/png";
  return item.mime_type || "application/octet-stream";
}

function getTargetSize(row) {
  const fallback = row.type === "design" ? 128 * 1024 : row.type === "memo" ? 64 * 1024 : 512 * 1024;
  return Math.max(Number(row.size_bytes || 0), fallback);
}

function createCandidateItems(rows) {
  const items = [];
  for (const row of rows) {
    const key = sanitizeStorageKey(row.storage_key);
    items.push({
      attachmentId: row.id,
      orderId: row.order_id,
      key,
      localPath: path.join(outDir, key),
      fileName: row.original_name,
      mime_type: row.mime_type || "application/octet-stream",
      size: getTargetSize(row),
      sourceType: row.type,
      createdAt: row.created_at,
      isThumbnail: false,
    });
    if (row.thumbnail_key) {
      const thumbKey = sanitizeStorageKey(row.thumbnail_key);
      items.push({
        attachmentId: `${row.id}#thumbnail`,
        orderId: row.order_id,
        key: thumbKey,
        localPath: path.join(outDir, thumbKey),
        fileName: `${row.original_name || row.id}.thumbnail.png`,
        mime_type: "image/png",
        size: 18 * 1024,
        sourceType: "thumbnail",
        createdAt: row.created_at,
        isThumbnail: true,
      });
    }
  }
  return items;
}

function selectPresetItems(items) {
  const selected = [];
  let total = 0;
  for (const item of items) {
    if (!item.isThumbnail) {
      if (selected.filter((entry) => !entry.isThumbnail).length >= preset.maxFiles) break;
      if (total + item.size > preset.maxTotalBytes && selected.length > 0) continue;
      selected.push(item);
      total += item.size;
    }
    if (item.isThumbnail && selected.some((entry) => entry.attachmentId === item.attachmentId.replace("#thumbnail", ""))) {
      selected.push(item);
      total += item.size;
    }
  }
  return selected;
}

async function ensureDirForFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeDemoFile(item) {
  await ensureDirForFile(item.localPath);
  const base = getBasePayloadForMime(item.mime_type, item.fileName);
  const size = Math.max(item.size, base.length);
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(item.localPath);
    stream.on("error", reject);
    stream.on("finish", resolve);
    stream.write(base);
    let remaining = size - base.length;
    const fillChunk = Buffer.alloc(Math.min(1024 * 1024, Math.max(1, remaining)), 0x20);
    while (remaining > 0) {
      const current = remaining >= fillChunk.length ? fillChunk : fillChunk.subarray(0, remaining);
      stream.write(current);
      remaining -= current.length;
    }
    stream.end();
  });
  return size;
}

async function writeManifest(items, status) {
  await fs.mkdir(manifestDir, { recursive: true });
  const manifestPath = path.join(manifestDir, `r2-demo-${preset.label}-${status}.json`);
  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
  await fs.writeFile(manifestPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    preset: preset.label,
    mode,
    outDir,
    totalFiles: items.length,
    totalBytes,
    totalMb: Number((totalBytes / 1024 / 1024).toFixed(2)),
    items: items.map((item) => ({
      attachmentId: item.attachmentId,
      orderId: item.orderId,
      key: item.key,
      localPath: path.relative(PROJECT_ROOT, item.localPath),
      contentType: getUploadContentType(item),
      size: item.size,
      sourceType: item.sourceType,
      isThumbnail: item.isThumbnail,
    })),
  }, null, 2), "utf8");
  return manifestPath;
}

async function generateFiles(items) {
  if (dryRun) {
    console.log(`[DRY-RUN] Would generate ${items.length} files into ${outDir}`);
    return;
  }
  for (const [index, item] of items.entries()) {
    await writeDemoFile(item);
    if ((index + 1) % 10 === 0 || index + 1 === items.length) {
      console.log(`[GENERATE] ${index + 1}/${items.length}`);
    }
  }
}

async function uploadFiles(items) {
  if (!confirmUpload && !dryRun) {
    fail("Upload requires --confirm-upload. Use --dry-run to preview without uploading.");
  }
  for (const [index, item] of items.entries()) {
    const contentType = getUploadContentType(item);
    if (dryRun) {
      console.log(`[DRY-RUN] PUT ${item.key} (${contentType}, ${item.size} bytes)`);
      continue;
    }
    const payload = await fs.readFile(item.localPath);
    const url = buildWorkerUrl({ method: "PUT", key: item.key, contentType });
    const response = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: payload });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      fail(`Upload failed for ${item.key}: ${response.status} ${text}`);
    }
    if ((index + 1) % 10 === 0 || index + 1 === items.length) {
      console.log(`[UPLOAD] ${index + 1}/${items.length}`);
    }
  }
}

async function verifyFiles(items) {
  for (const [index, item] of items.entries()) {
    if (dryRun) {
      console.log(`[DRY-RUN] GET ${item.key}`);
      continue;
    }
    const url = buildWorkerUrl({ method: "GET", key: item.key });
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      fail(`Verify failed for ${item.key}: ${response.status} ${text}`);
    }
    await response.arrayBuffer();
    if ((index + 1) % 10 === 0 || index + 1 === items.length) {
      console.log(`[VERIFY] ${index + 1}/${items.length}`);
    }
  }
}

async function main() {
  console.log(`[INFO] PeaceByPiece R2 demo files helper`);
  console.log(`[INFO] preset=${preset.label}, mode=${mode}, dryRun=${dryRun}`);
  console.log(`[INFO] outDir=${outDir}`);

  const rows = await readAttachmentRows();
  if (rows.length === 0) {
    fail("No realistic attachment metadata found. Run seed_realistic_workorders_0_9_2227.sql first.");
  }

  const items = selectPresetItems(createCandidateItems(rows));
  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
  console.log(`[INFO] selected=${items.length} files, total=${(totalBytes / 1024 / 1024).toFixed(2)}MB`);
  const manifestPath = await writeManifest(items, "plan");
  console.log(`[INFO] manifest=${path.relative(PROJECT_ROOT, manifestPath)}`);

  if (mode === "plan") return;
  if (mode === "generate" || mode === "all") {
    await generateFiles(items);
    const generatedManifest = await writeManifest(items, "generated");
    console.log(`[INFO] generated manifest=${path.relative(PROJECT_ROOT, generatedManifest)}`);
  }
  if (mode === "upload" || mode === "all") {
    await uploadFiles(items);
    const uploadedManifest = await writeManifest(items, "uploaded");
    console.log(`[INFO] uploaded manifest=${path.relative(PROJECT_ROOT, uploadedManifest)}`);
  }
  if (mode === "verify") {
    await verifyFiles(items);
    const verifiedManifest = await writeManifest(items, "verified");
    console.log(`[INFO] verified manifest=${path.relative(PROJECT_ROOT, verifiedManifest)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
