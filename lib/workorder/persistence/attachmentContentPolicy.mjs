export function isPdfAttachmentContent(bytes) {
  const limit = Math.min(bytes.length - 4, 1024);
  for (let index = 0; index < limit; index += 1) {
    if (bytes[index] === 0x25
      && bytes[index + 1] === 0x50
      && bytes[index + 2] === 0x44
      && bytes[index + 3] === 0x46
      && bytes[index + 4] === 0x2d) return true;
  }
  return false;
}
