#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const commandPath = "tools/simulator/commands/attachment-lifecycle.mjs";
const manifestPath = "tools/simulator/fixtures/attachments/canonical-lifecycle-manifest.json";
const source = fs.readFileSync(commandPath, "utf8");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

assert.match(source, /createValidPdfBytes/);
assert.match(source, /buildPdfWithPadding/);
assert.match(source, /startxref/);
assert.match(source, /createValidPngBytes/);
assert.match(source, /createPngChunk/);
assert.match(source, /crc32/);
assert.match(source, /createValidJpegBytes/);
assert.match(source, /validateJpegBytes/);
assert.doesNotMatch(source, /base = Buffer\.from\("%PDF-1\.4/);
assert.doesNotMatch(source, /iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8\/x8AAwMB\/ax3pPAAAAAASUVORK5CYII=/);

const generate = spawnSync(process.execPath, [commandPath, "--mode=generate"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
assert.equal(generate.status, 0, generate.stderr || generate.stdout);
assert.match(generate.stdout, /mode=generate execute=false/);
assert.match(generate.stdout, /generated=11/);

const materializedItems = manifest.normalLifecycleFixtures.filter((item) =>
  item.attachment_kind !== "none" && item.lifecycle_status !== "fault_reference_only"
);
const mimeCounts = materializedItems.reduce((counts, item) => {
  counts[item.mime_type] = (counts[item.mime_type] || 0) + 1;
  return counts;
}, {});
assert.equal(materializedItems.length, 11);
assert.deepEqual(mimeCounts, {
  "image/png": 7,
  "image/jpeg": 1,
  "application/pdf": 3,
});

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crc32Table[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function validatePdf(buffer, item) {
  const text = buffer.toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4\n"), `${item.fixture_id} must start with a PDF header`);
  assert.match(text, /\nxref\n/, `${item.fixture_id} must include xref`);
  assert.match(text, /\ntrailer\n/, `${item.fixture_id} must include trailer`);
  assert.match(text, /\nstartxref\n\d+\n%%EOF\n$/, `${item.fixture_id} must end with startxref and EOF`);
  const startxref = Number(text.match(/\nstartxref\n(\d+)\n%%EOF\n$/)?.[1] ?? -1);
  assert.ok(Number.isSafeInteger(startxref) && startxref > 0, `${item.fixture_id} must include numeric startxref`);
  assert.equal(text.slice(startxref, startxref + 4), "xref", `${item.fixture_id} startxref must point to xref`);
  assert.match(text, /\/Root 1 0 R/, `${item.fixture_id} must include root catalog`);
  assert.match(text, /\/Type \/Page/, `${item.fixture_id} must include a page`);
}

function validatePng(buffer, item) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${item.fixture_id} must start with PNG signature`);
  let offset = 8;
  const chunks = [];
  while (offset < buffer.byteLength) {
    assert.ok(offset + 12 <= buffer.byteLength, `${item.fixture_id} chunk header must fit`);
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;
    assert.ok(crcEnd <= buffer.byteLength, `${item.fixture_id} ${type} chunk must fit`);
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const actualCrc = crc32(buffer.subarray(offset + 4, dataEnd));
    assert.equal(actualCrc, expectedCrc, `${item.fixture_id} ${type} chunk CRC must match`);
    chunks.push(type);
    offset = crcEnd;
    if (type === "IEND") break;
  }
  assert.equal(offset, buffer.byteLength, `${item.fixture_id} must not contain bytes after IEND`);
  assert.deepEqual(chunks.slice(0, 2), ["IHDR", "IDAT"], `${item.fixture_id} must start with IHDR and IDAT`);
  assert.equal(chunks.at(-1), "IEND", `${item.fixture_id} must end with IEND`);
}

function validateJpeg(buffer, item) {
  assert.equal(buffer[0], 0xff, `${item.fixture_id} must start with JPEG SOI`);
  assert.equal(buffer[1], 0xd8, `${item.fixture_id} must start with JPEG SOI`);
  assert.equal(buffer[buffer.byteLength - 2], 0xff, `${item.fixture_id} must end with JPEG EOI`);
  assert.equal(buffer[buffer.byteLength - 1], 0xd9, `${item.fixture_id} must end with JPEG EOI`);
  let offset = 2;
  let sawSof = false;
  let sawSos = false;
  while (offset < buffer.byteLength - 2) {
    assert.equal(buffer[offset], 0xff, `${item.fixture_id} marker prefix must be present`);
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9) break;
    assert.ok(offset + 2 <= buffer.byteLength, `${item.fixture_id} segment length must fit`);
    const length = buffer.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= buffer.byteLength, `${item.fixture_id} segment length must be valid`);
    if (marker >= 0xc0 && marker <= 0xc3) sawSof = true;
    if (marker === 0xda) {
      sawSos = true;
      offset += length;
      const eoi = buffer.lastIndexOf(Buffer.from([0xff, 0xd9]));
      assert.ok(eoi >= offset, `${item.fixture_id} entropy data must precede EOI`);
      offset = eoi;
      continue;
    }
    offset += length;
  }
  assert.ok(sawSof, `${item.fixture_id} must include SOF marker`);
  assert.ok(sawSos, `${item.fixture_id} must include SOS marker`);
}

for (const item of materializedItems) {
  const filePath = path.join(".tmp", "simulator", "attachments", "files", item.canonical_r2_key);
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer.byteLength, item.exact_size_bytes, `${item.fixture_id} exact_size_bytes must match generated bytes`);
  if (item.mime_type === "application/pdf") validatePdf(buffer, item);
  if (item.mime_type === "image/png") validatePng(buffer, item);
  if (item.mime_type === "image/jpeg") validateJpeg(buffer, item);
}

const gTrash = materializedItems.find((item) => item.fixture_id === "G-trashed-pdf");
assert.ok(gTrash, "G trash PDF fixture must exist");
const gTrashPath = path.join(".tmp", "simulator", "attachments", "files", gTrash.canonical_r2_key);
const gTrashBytes = fs.readFileSync(gTrashPath);
assert.equal(gTrashBytes.byteLength, 262144);
validatePdf(gTrashBytes, gTrash);

console.log("simulator attachment file format contract passed: exact-size valid PDF, PNG, and JPEG fixtures");
