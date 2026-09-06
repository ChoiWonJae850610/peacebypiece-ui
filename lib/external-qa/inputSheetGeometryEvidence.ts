import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const EVIDENCE_DIRECTORY = path.join(process.cwd(), ".tmp", "wafl-external-qa");
export const WAFL_INPUT_SHEET_GEOMETRY_EVIDENCE_PATH = path.join(
  EVIDENCE_DIRECTORY,
  "input-sheet-final-geometry-evidence.jsonl",
);

const SURFACES = new Set([
  "new-recipe",
  "spec-save-new",
  "quick-main",
  "quick-address-direct",
  "numeric-direct",
]);
const MAX_SERIALIZED_BYTES = 64 * 1024;

function isSafeDiagnosticValue(value: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length <= 512;
  if (Array.isArray(value)) return value.length <= 64 && value.every((item) => isSafeDiagnosticValue(item, depth + 1));
  if (typeof value !== "object") return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.length <= 128
    && entries.every(([key, item]) => /^[A-Za-z][A-Za-z0-9]*$/u.test(key) && isSafeDiagnosticValue(item, depth + 1));
}

export function parseWaflInputSheetGeometryEvidence(value: unknown) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const evidence = value as Record<string, unknown>;
  if (!SURFACES.has(String(evidence.surface ?? ""))) return null;
  if (!/^[a-z0-9:-]{1,128}$/u.test(String(evidence.captureId ?? ""))) return null;
  if (!/^[A-Za-z][A-Za-z0-9:-]{0,127}$/u.test(String(evidence.event ?? ""))) return null;
  if (!Number.isSafeInteger(evidence.sequence) || Number(evidence.sequence) < 1) return null;
  if (!isSafeDiagnosticValue(evidence)) return null;
  const serialized = JSON.stringify(evidence);
  if (Buffer.byteLength(serialized, "utf8") > MAX_SERIALIZED_BYTES) return null;
  return { evidence, serialized } as const;
}

export async function appendWaflInputSheetGeometryEvidence(serialized: string) {
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true });
  await appendFile(WAFL_INPUT_SHEET_GEOMETRY_EVIDENCE_PATH, `${serialized}\n`, { encoding: "utf8" });
}
