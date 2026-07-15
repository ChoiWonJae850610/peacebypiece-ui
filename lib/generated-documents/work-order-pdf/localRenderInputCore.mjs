import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const TOKEN_PATTERN = /^[a-f0-9]{32}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export function getLocalIssuedPdfRenderInputPath(runToken) {
  if (!TOKEN_PATTERN.test(runToken)) throw new Error("PDF_LOCAL_RENDER_TOKEN_INVALID");
  return path.join(process.cwd(), ".tmp", "wafl-v2-alpha38", "render-input", `${runToken}.json`);
}

function assertLocalIssuedPdfRenderInput(value) {
  const parsed = value;
  if (!parsed?.snapshot?.workOrderId
    || !parsed.snapshot?.revisionId
    || typeof parsed.canonicalSnapshotJson !== "string"
    || parsed.canonicalSnapshotJson.length === 0
    || !SHA256_PATTERN.test(parsed.snapshotSha256)
    || typeof parsed.objectKeyPlan !== "string"
    || parsed.objectKeyPlan.length === 0
    || !(parsed.representativeImageDataUrl === null || typeof parsed.representativeImageDataUrl === "string")) {
    throw new Error("PDF_RENDER_INPUT_INVALID");
  }
  const actualSnapshotSha256 = crypto
    .createHash("sha256")
    .update(Buffer.from(parsed.canonicalSnapshotJson, "utf8"))
    .digest("hex");
  if (actualSnapshotSha256 !== parsed.snapshotSha256) throw new Error("PDF_RENDER_INPUT_INVALID");
  return parsed;
}

export async function writeLocalIssuedPdfRenderInput(runToken, input) {
  const inputPath = getLocalIssuedPdfRenderInputPath(runToken);
  await fs.mkdir(path.dirname(inputPath), { recursive: true });
  await fs.writeFile(inputPath, `${JSON.stringify(assertLocalIssuedPdfRenderInput(input))}\n`, "utf8");
  return inputPath;
}

export async function readLocalIssuedPdfRenderInput(runToken) {
  let serialized;
  try {
    serialized = await fs.readFile(getLocalIssuedPdfRenderInputPath(runToken), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") throw new Error("PDF_RENDER_INPUT_NOT_FOUND");
    throw error;
  }
  try {
    return assertLocalIssuedPdfRenderInput(JSON.parse(serialized));
  } catch (error) {
    if (error instanceof Error && error.message === "PDF_RENDER_INPUT_INVALID") throw error;
    throw new Error("PDF_RENDER_INPUT_INVALID");
  }
}
