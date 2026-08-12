const PERCENT_ENCODED_UTF8_SEQUENCE = /(?:%[0-9a-f]{2}){2,}/i;
const NON_ASCII = /[^\u0000-\u007f]/u;

export function normalizeAttachmentFilenameForTransport(value: string): string {
  const trimmed = value.trim();
  let decoded = trimmed;
  if (PERCENT_ENCODED_UTF8_SEQUENCE.test(trimmed)) {
    try {
      const candidate = decodeURIComponent(trimmed);
      if (NON_ASCII.test(candidate)) decoded = candidate;
    } catch {
      decoded = trimmed;
    }
  }
  return decoded.normalize("NFC");
}

export function attachmentFilenameRoundTripsJson(value: string): boolean {
  const normalized = normalizeAttachmentFilenameForTransport(value);
  return JSON.parse(JSON.stringify({ filename: normalized })).filename === normalized;
}
