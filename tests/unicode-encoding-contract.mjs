import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { TextDecoder } from "node:util";

const root = process.cwd();
const excludedSegments = new Set([
  ".git",
  ".next",
  ".wrangler",
  "node_modules",
  "artifacts",
  "playwright-report",
  "test-results",
  "reports",
]);
const binaryExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip",
  ".woff", ".woff2", ".ttf", ".otf", ".mp3", ".mp4", ".mov", ".avi",
]);
const textExtensions = new Set([
  ".md", ".txt", ".json", ".yml", ".yaml", ".ts", ".tsx", ".js", ".jsx",
  ".mjs", ".cjs", ".css", ".scss", ".sql", ".ps1", ".psm1", ".psd1",
  ".toml", ".xml", ".csv", ".sh", ".html",
]);
const specialTextNames = new Set([".env.example", ".gitignore", ".gitattributes", ".editorconfig"]);
const decoder = new TextDecoder("utf-8", { fatal: true });
const errors = [];
const warnings = [];

function isExcluded(relativePath) {
  return relativePath.split(path.sep).some((segment) => excludedSegments.has(segment));
}

function walk(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    warnings.push(`${path.relative(root, directory)}: skipped unreadable path from extraction environment (${error.code ?? error.message})`);
    return;
  }
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath);
    if (isExcluded(relativePath)) continue;

    if (entry.name.includes("\uFFFD")) {
      if (fs.existsSync(absolutePath)) {
        errors.push(`${relativePath}: path contains U+FFFD replacement character`);
      } else {
        warnings.push(`${relativePath}: extraction environment exposed a replacement path; compare with git ls-files before repair`);
      }
    }
    const roundTripName = Buffer.from(entry.name, "utf8").toString("utf8");
    if (roundTripName !== entry.name) {
      errors.push(`${relativePath}: path name failed UTF-8 round-trip`);
    }

    if (entry.isDirectory()) {
      walk(absolutePath);
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (binaryExtensions.has(extension)) continue;
    if (!textExtensions.has(extension) && !specialTextNames.has(entry.name)) continue;

    const bytes = fs.readFileSync(absolutePath);
    let text;
    try {
      text = decoder.decode(bytes);
    } catch (error) {
      errors.push(`${relativePath}: invalid UTF-8 (${error.message})`);
      continue;
    }
    if (text.includes("\uFFFD")) {
      errors.push(`${relativePath}: content contains U+FFFD replacement character`);
    }

    const selfDescribingFiles = new Set([
      "docs/project/25-korean-unicode-encoding-standard.md",
      "tests/unicode-encoding-contract.mjs",
    ]);
    if (!selfDescribingFiles.has(relativePath.split(path.sep).join("/"))) {
      const suspiciousPatterns = ["Ã", "Â", "â€"];
      const matched = suspiciousPatterns.filter((value) => text.includes(value));
      if (matched.length > 0) {
        warnings.push(`${relativePath}: possible mojibake candidate (${matched.join(", ")})`);
      }
    }
  }
}

walk(root);

const canonicalPowerShell = path.join(root, "tools", "pipeline", "peacebypiece-auto-pipeline.ps1");
if (fs.existsSync(canonicalPowerShell)) {
  const bytes = fs.readFileSync(canonicalPowerShell);
  const hasUtf8Bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  if (!hasUtf8Bom) {
    errors.push("tools/pipeline/peacebypiece-auto-pipeline.ps1: UTF-8 BOM is required for Windows PowerShell 5.1");
  }
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`unicode encoding contract: OK (${warnings.length} warning candidate(s))`);
