import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const OUTPUT_WIDTH = 920;
const OUTPUT_HEIGHT = 920;
const OUTPUT_FILENAME = "linen-round-dress-sketch.png";
const OUTPUT_MIME_TYPE = "image/png";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function assertRepositorySvg(sourcePath, source) {
  const relative = path.relative(process.cwd(), sourcePath).replaceAll("\\", "/");
  assert.equal(relative, "public/dev-samples/linen-round-dress-sketch.svg", "alpha42-image-source-path-invalid");
  assert.match(source, /^\s*<svg\b/i, "alpha42-image-source-not-svg");
  assert.doesNotMatch(source, /\b(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i, "alpha42-image-external-resource-forbidden");
}

export async function prepareAlpha42RepresentativeImage(input = {}) {
  const sourcePath = path.resolve(input.sourcePath ?? "public/dev-samples/linen-round-dress-sketch.svg");
  const sourceBytes = await fs.readFile(sourcePath);
  const source = sourceBytes.toString("utf8");
  assertRepositorySvg(sourcePath, source);

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim() || undefined;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({
      viewport: { width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>html,body{margin:0;width:${OUTPUT_WIDTH}px;height:${OUTPUT_HEIGHT}px;overflow:hidden;background:transparent}svg{display:block;width:${OUTPUT_WIDTH}px;height:${OUTPUT_HEIGHT}px}</style>${source}`,
      { waitUntil: "domcontentloaded" },
    );
    await page.evaluate(async () => document.fonts.ready);
    const svg = page.locator("svg").first();
    await svg.waitFor({ state: "visible" });
    const bytes = Buffer.from(await svg.screenshot({
      type: "png",
      omitBackground: true,
      animations: "disabled",
    }));
    assert.deepEqual(bytes.subarray(0, PNG_SIGNATURE.length), PNG_SIGNATURE, "alpha42-image-png-signature-invalid");
    assert.equal(bytes.readUInt32BE(16), OUTPUT_WIDTH, "alpha42-image-png-width-invalid");
    assert.equal(bytes.readUInt32BE(20), OUTPUT_HEIGHT, "alpha42-image-png-height-invalid");
    assert.ok(bytes.byteLength > 0 && bytes.byteLength <= 10 * 1024 * 1024, "alpha42-image-png-size-invalid");
    return Object.freeze({
      bytes,
      fileSizeBytes: bytes.byteLength,
      filename: OUTPUT_FILENAME,
      mimeType: OUTPUT_MIME_TYPE,
      extension: ".png",
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      sourceSha256: sha256(sourceBytes),
      contentSha256: sha256(bytes),
      renderer: `local-chromium/${browser.version()}`,
    });
  } finally {
    await browser.close();
  }
}
