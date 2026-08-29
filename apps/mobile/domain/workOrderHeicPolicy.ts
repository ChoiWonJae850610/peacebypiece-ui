const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);

export function isHeicLikeAcquiredImage(input: {
  readonly mimeType?: string | null;
  readonly fileName?: string | null;
  readonly uri?: string | null;
  readonly prefix?: Uint8Array | null;
}) {
  const mimeType = input.mimeType?.trim().toLowerCase() ?? "";
  if (HEIC_MIME_TYPES.has(mimeType)) return true;
  if (/\.hei[cf](?:$|\?)/i.test(input.fileName ?? "") || /\.hei[cf](?:$|\?)/i.test(input.uri ?? "")) return true;
  const prefix = input.prefix;
  if (!prefix || prefix.length < 12) return false;
  const marker = String.fromCharCode(...prefix.slice(4, 8));
  const brand = String.fromCharCode(...prefix.slice(8, 12)).toLowerCase();
  return marker === "ftyp" && HEIC_BRANDS.has(brand);
}

export function isJpegImagePrefix(prefix: Uint8Array) {
  return prefix.length >= 3 && prefix[0] === 0xff && prefix[1] === 0xd8 && prefix[2] === 0xff;
}
