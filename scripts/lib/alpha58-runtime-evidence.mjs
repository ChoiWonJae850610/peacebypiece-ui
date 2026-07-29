export function normalizeCompiledBundleText(text) {
  return text
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

export function serializeMutationObservation(input) {
  if (input.observed) {
    if (!Number.isSafeInteger(input.count) || input.count < 0) {
      throw new TypeError("observed mutation evidence requires a non-negative count");
    }
    return { status: "OBSERVED", count: input.count };
  }
  if (typeof input.reason !== "string" || input.reason.trim().length === 0) {
    throw new TypeError("NOT_OBSERVED mutation evidence requires a reason");
  }
  return {
    status: "NOT_OBSERVED",
    count: null,
    reason: input.reason,
  };
}

export function serializeRuntimeResult(output) {
  return `${JSON.stringify(output, null, 2)}\n`;
}
