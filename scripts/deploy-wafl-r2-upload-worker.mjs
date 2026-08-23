#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const env = Object.fromEntries(fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/u).map((line) => {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/u);
  return match ? [match[1], match[2].trim().replace(/^("|')|("|')$/gu, "")] : null;
}).filter(Boolean));
const workerName = new URL(env.R2_WORKER_UPLOAD_URL).hostname.split(".")[0];
const bucketName = env.R2_BUCKET_NAME;
assert.match(workerName, /^[a-z0-9-]+$/u, "R2_WORKER_NAME_INVALID");
assert.match(bucketName, /^[A-Za-z0-9._-]+$/u, "R2_BUCKET_NAME_INVALID");
const tempDir = path.join(root, ".tmp", "wafl-r2-worker-deploy");
const configPath = path.join(tempDir, "wrangler.toml");
const wrangler = path.join(root, "cloudflare", "pdf-generator-worker", "node_modules", ".bin", "wrangler.cmd");
const hash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);

function run(args) {
  assert.ok(args.every((value) => !/[&|<>^\r\n]/u.test(value)), "WRANGLER_ARGUMENT_UNSAFE");
  const result = spawnSync(wrangler, args, { cwd: root, encoding: "utf8", windowsHide: true, shell: true });
  if (result.status !== 0) {
    const safeReason = String(result.stderr || result.stdout || "unknown")
      .replace(/https?:\/\/\S+/giu, "[redacted-url]")
      .replace(/[0-9a-f]{24,}/giu, "[redacted-id]")
      .replace(/\s+/gu, " ").slice(0, 400);
    throw new Error(`WRANGLER_COMMAND_FAILED_${result.status ?? "UNKNOWN"}: ${safeReason}`);
  }
  return result.stdout;
}

fs.mkdirSync(tempDir, { recursive: true });
fs.writeFileSync(configPath, [
  `name = "${workerName}"`,
  `main = "${path.join(root, "cloudflare", "r2-upload-worker.js").replace(/\\/gu, "/")}"`,
  'compatibility_date = "2026-08-20"',
  "",
  "[images]",
  'binding = "IMAGES"',
  "",
  "[[r2_buckets]]",
  'binding = "R2_BUCKET"',
  `bucket_name = "${bucketName}"`,
  "",
].join("\n"), "utf8");

try {
  const deployArgs = ["deploy", "--config", configPath, "--keep-vars"];
  if (dryRun) deployArgs.push("--dry-run");
  run(deployArgs);
  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, workerRef: hash(workerName), configContainsSecret: false }));
  } else {
    const deployments = JSON.parse(run(["deployments", "list", "--name", workerName, "--json"]));
    const versionId = deployments?.at(-1)?.versions?.[0]?.version_id;
    assert.ok(versionId, "DEPLOYED_WORKER_VERSION_MISSING");
    const version = JSON.parse(run(["versions", "view", versionId, "--name", workerName, "--json"]));
    const bindings = (version?.resources?.bindings ?? []).map((binding) => ({ name: binding.name, type: binding.type }));
    assert.ok(bindings.some((binding) => binding.name === "R2_BUCKET" && binding.type === "r2_bucket"), "R2_BUCKET_BINDING_MISSING");
    assert.ok(bindings.some((binding) => binding.name === "IMAGES" && binding.type === "images"), "IMAGES_BINDING_MISSING");
    assert.ok(bindings.some((binding) => binding.name === "R2_WORKER_UPLOAD_SECRET"), "WORKER_SECRET_BINDING_NOT_PRESERVED");
    console.log(JSON.stringify({ deployed: true, workerRef: hash(workerName), versionRef: hash(versionId), bindings: bindings.map((binding) => binding.name).sort(), configContainsSecret: false }));
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
