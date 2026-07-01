#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const outDir = path.join(".tmp", "pdf-r2-lifecycle-fixtures");
fs.mkdirSync(outDir, { recursive: true });

function createPdfBytes(sizeBytes) {
  const header = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n", "utf8");
  const footer = Buffer.from("\n%%EOF\n", "utf8");
  return Buffer.concat([header, Buffer.alloc(Math.max(0, sizeBytes - header.length - footer.length), 0x20), footer]);
}

const oneMb = 1024 * 1024;
const fixtures = [
  { name: "valid.png", mime: "image/png", bytes: Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082", "hex") },
  { name: "valid.jpg", mime: "image/jpeg", bytes: Buffer.from("ffd8ffe000104a46494600010101006000600000ffd9", "hex") },
  { name: "valid-small.pdf", mime: "application/pdf", bytes: createPdfBytes(512) },
  { name: "valid-1mb.pdf", mime: "application/pdf", bytes: createPdfBytes(oneMb) },
  { name: "valid-5mb.pdf", mime: "application/pdf", bytes: createPdfBytes(5 * oneMb) },
  { name: "valid-10mb.pdf", mime: "application/pdf", bytes: createPdfBytes(10 * oneMb) },
  { name: "invalid-over-10mb.pdf", mime: "application/pdf", bytes: createPdfBytes(10 * oneMb + 1) },
];

function headerValid(fixture) {
  if (fixture.mime === "application/pdf") return fixture.bytes.subarray(0, 5).toString("utf8") === "%PDF-";
  if (fixture.mime === "image/png") return fixture.bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (fixture.mime === "image/jpeg") return fixture.bytes[0] === 0xff && fixture.bytes[1] === 0xd8;
  return false;
}

const manifest = fixtures.map((fixture) => {
  const filePath = path.join(outDir, fixture.name);
  fs.writeFileSync(filePath, fixture.bytes);
  return {
    name: fixture.name,
    mimeType: fixture.mime,
    extension: path.extname(fixture.name).slice(1),
    sizeBytes: fixture.bytes.length,
    sha256: crypto.createHash("sha256").update(fixture.bytes).digest("hex"),
    headerValid: headerValid(fixture),
  };
});

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), mutation: "local .tmp files only", manifest }, null, 2));
console.log(`PDF/R2 fixtures generated: ${outDir}`);
console.log(`Fixture count: ${manifest.length}`);
console.log("Profiles: small, 1MB, 5MB, 10MB, over-10MB");
console.log("Mutation: local .tmp files only");
