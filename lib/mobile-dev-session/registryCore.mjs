import { createHash, randomBytes } from "node:crypto";

export const MOBILE_CONNECT_CODE_LENGTH = 8;
export const MOBILE_CONNECT_CODE_TTL_MS = 5 * 60 * 1000;
export const MOBILE_CONNECT_MAX_ACTIVE_CODES = 32;
export const MOBILE_CONNECT_MAX_FAILURES = 5;

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_PATTERN = /^[2-9A-HJ-NP-Z]{8}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeMobileConnectCode(value) {
  return String(value ?? "").toUpperCase().replace(/[\s-]/g, "");
}

export function isMobileConnectCode(value) {
  return CODE_PATTERN.test(normalizeMobileConnectCode(value));
}

function createCode() {
  const bytes = randomBytes(MOBILE_CONNECT_CODE_LENGTH);
  let code = "";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

function codeHash(code, runToken) {
  return sha256(`${runToken}:${code}`);
}

function runFingerprint(runToken) {
  return sha256(runToken).slice(0, 16);
}

export class MobileDevSessionRegistry {
  constructor() {
    this.entries = new Map();
  }

  cleanup(now = Date.now()) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }

  issue({ payload, runToken, now = Date.now() }) {
    this.cleanup(now);
    if (this.entries.size >= MOBILE_CONNECT_MAX_ACTIVE_CODES) {
      throw new Error("MOBILE_CONNECT_REGISTRY_FULL");
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = createCode();
      const hash = codeHash(code, runToken);
      if (this.entries.has(hash)) continue;
      const expiresAt = now + MOBILE_CONNECT_CODE_TTL_MS;
      this.entries.set(hash, {
        payload,
        expiresAt,
        runFingerprint: runFingerprint(runToken),
        failureCount: 0,
      });
      return { code, expiresAt, hashPrefix: hash.slice(0, 8) };
    }
    throw new Error("MOBILE_CONNECT_CODE_GENERATION_FAILED");
  }

  exchange({ code, runToken, now = Date.now() }) {
    const normalizedCode = normalizeMobileConnectCode(code);
    if (!CODE_PATTERN.test(normalizedCode)) return { ok: false, reason: "unavailable" };

    this.cleanup(now);
    const hash = codeHash(normalizedCode, runToken);
    const entry = this.entries.get(hash);
    if (!entry || entry.runFingerprint !== runFingerprint(runToken)) {
      return { ok: false, reason: "unavailable" };
    }
    if (entry.expiresAt <= now) {
      this.entries.delete(hash);
      return { ok: false, reason: "unavailable" };
    }

    entry.failureCount += 1;
    if (entry.failureCount > MOBILE_CONNECT_MAX_FAILURES) {
      this.entries.delete(hash);
      return { ok: false, reason: "unavailable" };
    }

    this.entries.delete(hash);
    return { ok: true, payload: entry.payload, hashPrefix: hash.slice(0, 8) };
  }

  get size() {
    return this.entries.size;
  }
}
