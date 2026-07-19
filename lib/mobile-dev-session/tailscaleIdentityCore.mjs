import { createHash, timingSafeEqual } from "node:crypto";

const MAX_LOGIN_LENGTH = 320;
const RFC2047_Q = /^=\?utf-8\?q\?([^?]+)\?=$/i;

function decodeRfc2047Q(value) {
  const match = RFC2047_Q.exec(value);
  if (!match) return value;
  const source = match[1];
  const bytes = [];
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === "_") {
      bytes.push(0x20);
      continue;
    }
    if (character === "=") {
      const pair = source.slice(index + 1, index + 3);
      if (!/^[0-9a-f]{2}$/i.test(pair)) return null;
      bytes.push(Number.parseInt(pair, 16));
      index += 2;
      continue;
    }
    bytes.push(...Buffer.from(character, "utf8"));
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

export function normalizeTailscaleUserLogin(rawValue) {
  const raw = rawValue?.trim();
  if (!raw || raw.length > MAX_LOGIN_LENGTH || raw.includes(",") || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  const decoded = decodeRfc2047Q(raw)?.trim().toLowerCase();
  if (!decoded || decoded.length > MAX_LOGIN_LENGTH || /[\u0000-\u001f\u007f,\s]/.test(decoded)) return null;
  if (!/^[^@]+@[^@]+$/.test(decoded)) return null;
  return decoded;
}

export function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function matchesApprovedLoginHash(login, approvedSha256) {
  const actual = Buffer.from(sha256Hex(login), "hex");
  const expected = Buffer.from(approvedSha256, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
