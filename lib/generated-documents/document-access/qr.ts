export type QrCode = {
  readonly version: number;
  readonly size: number;
  readonly mask: number;
  readonly modules: readonly (readonly boolean[])[];
};

type BlockSpec = { readonly count: number; readonly total: number; readonly data: number };

// QR Code Model 2, error correction level M. Viewer URLs are bounded to version 10.
const MEDIUM_BLOCKS: readonly (readonly BlockSpec[])[] = [
  [],
  [{ count: 1, total: 26, data: 16 }],
  [{ count: 1, total: 44, data: 28 }],
  [{ count: 1, total: 70, data: 44 }],
  [{ count: 2, total: 50, data: 32 }],
  [{ count: 2, total: 67, data: 43 }],
  [{ count: 4, total: 43, data: 27 }],
  [{ count: 4, total: 49, data: 31 }],
  [{ count: 2, total: 60, data: 38 }, { count: 2, total: 61, data: 39 }],
  [{ count: 3, total: 58, data: 36 }, { count: 2, total: 59, data: 37 }],
  [{ count: 4, total: 69, data: 43 }, { count: 1, total: 70, data: 44 }],
];

function appendBits(target: number[], value: number, length: number) {
  if (length < 0 || value >>> length !== 0) throw new Error("QR_BIT_VALUE_INVALID");
  for (let i = length - 1; i >= 0; i -= 1) target.push((value >>> i) & 1);
}

function multiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function reedSolomonDivisor(degree: number): number[] {
  const result = Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = multiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = multiply(root, 0x02);
  }
  return result;
}

function reedSolomonRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = Array<number>(divisor.length).fill(0);
  for (const value of data) {
    const factor = value ^ result.shift()!;
    result.push(0);
    for (let i = 0; i < result.length; i += 1) result[i] ^= multiply(divisor[i], factor);
  }
  return result;
}

function getBlocks(version: number): readonly BlockSpec[] {
  const blocks = MEDIUM_BLOCKS[version];
  if (!blocks?.length) throw new Error("QR_VERSION_UNSUPPORTED");
  return blocks;
}

function dataCodewordCount(version: number): number {
  return getBlocks(version).reduce((sum, spec) => sum + spec.count * spec.data, 0);
}

function chooseVersion(byteLength: number): number {
  for (let version = 1; version < MEDIUM_BLOCKS.length; version += 1) {
    const countBits = version <= 9 ? 8 : 16;
    if (byteLength >= 2 ** countBits) continue;
    if (4 + countBits + byteLength * 8 <= dataCodewordCount(version) * 8) return version;
  }
  throw new Error("QR_PAYLOAD_TOO_LONG");
}

function createDataCodewords(payload: Uint8Array, version: number): number[] {
  const capacity = dataCodewordCount(version) * 8;
  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, payload.length, version <= 9 ? 8 : 16);
  for (const byte of payload) appendBits(bits, byte, 8);
  appendBits(bits, 0, Math.min(4, capacity - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) value = (value << 1) | bits[i + j];
    bytes.push(value);
  }
  for (let pad = 0; bytes.length < capacity / 8; pad += 1) bytes.push(pad % 2 === 0 ? 0xec : 0x11);
  return bytes;
}

function addErrorCorrection(data: readonly number[], version: number): number[] {
  const blocks: { data: number[]; error: number[] }[] = [];
  let offset = 0;
  for (const spec of getBlocks(version)) {
    const errorLength = spec.total - spec.data;
    const divisor = reedSolomonDivisor(errorLength);
    for (let i = 0; i < spec.count; i += 1) {
      const blockData = data.slice(offset, offset + spec.data);
      offset += spec.data;
      blocks.push({ data: [...blockData], error: reedSolomonRemainder(blockData, divisor) });
    }
  }
  if (offset !== data.length) throw new Error("QR_BLOCK_LAYOUT_INVALID");
  const result: number[] = [];
  const maxData = Math.max(...blocks.map((block) => block.data.length));
  for (let i = 0; i < maxData; i += 1) {
    for (const block of blocks) if (i < block.data.length) result.push(block.data[i]);
  }
  for (let i = 0; i < blocks[0].error.length; i += 1) {
    for (const block of blocks) result.push(block.error[i]);
  }
  return result;
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32
    ? 26
    : Math.ceil((version * 4 + count * 2 + 1) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let position = version * 4 + 10; result.length < count; position -= step) result.splice(1, 0, position);
  return result;
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return (x * y) % 2 + (x * y) % 3 === 0;
    case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
    case 7: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    default: throw new Error("QR_MASK_INVALID");
  }
}

function penalty(modules: readonly (readonly boolean[])[]): number {
  const size = modules.length;
  let score = 0;
  const lines: boolean[][] = [
    ...modules.map((row) => [...row]),
    ...Array.from({ length: size }, (_, x) => modules.map((row) => row[x])),
  ];
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === line[i - 1]) run += 1;
      else {
        if (run >= 5) score += 3 + run - 5;
        run = 1;
      }
    }
    if (run >= 5) score += 3 + run - 5;
    const binary = line.map((value) => value ? "1" : "0").join("");
    score += (binary.match(/10111010000/g)?.length ?? 0) * 40;
    score += (binary.match(/00001011101/g)?.length ?? 0) * 40;
  }
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const value = modules[y][x];
      if (modules[y][x + 1] === value && modules[y + 1][x] === value && modules[y + 1][x + 1] === value) score += 3;
    }
  }
  const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  return score;
}

function buildMatrix(version: number, codewords: readonly number[], mask: number): boolean[][] {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const functions = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const setFunction = (x: number, y: number, value: boolean) => {
    if (x >= 0 && y >= 0 && x < size && y < size) {
      modules[y][x] = value;
      functions[y][x] = true;
    }
  };
  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setFunction(cx + dx, cy + dy, distance !== 2 && distance !== 4);
    }
  };
  const drawAlignment = (cx: number, cy: number) => {
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
      setFunction(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  };

  for (let i = 0; i < size; i += 1) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }
  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);
  const positions = alignmentPositions(version);
  for (const y of positions) for (const x of positions) if (!functions[y][x]) drawAlignment(x, y);

  const drawFormat = (formatMask: number) => {
    const data = formatMask; // Error correction level M uses format bits 00.
    let remainder = data;
    for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    const bits = ((data << 10) | remainder) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i += 1) setFunction(8, i, bit(i));
    setFunction(8, 7, bit(6));
    setFunction(8, 8, bit(7));
    setFunction(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, bit(i));
    setFunction(8, size - 8, true);
  };
  drawFormat(mask);

  if (version >= 7) {
    let remainder = version;
    for (let i = 0; i < 12; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    const bits = (version << 12) | remainder;
    for (let i = 0; i < 18; i += 1) {
      const value = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + i % 3;
      const b = Math.floor(i / 3);
      setFunction(a, b, value);
      setFunction(b, a, value);
    }
  }

  const dataBits: number[] = [];
  for (const value of codewords) appendBits(dataBits, value, 8);
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    const upward = ((right + 1) & 2) === 0;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (functions[y][x]) continue;
        const value = index < dataBits.length && dataBits[index] === 1;
        modules[y][x] = maskBit(mask, x, y) ? !value : value;
        index += 1;
      }
    }
  }
  return modules;
}

export function createQrCode(payload: string): QrCode {
  const bytes = new TextEncoder().encode(payload);
  const version = chooseVersion(bytes.length);
  const codewords = addErrorCorrection(createDataCodewords(bytes, version), version);
  let bestMask = 0;
  let bestModules = buildMatrix(version, codewords, 0);
  let bestPenalty = penalty(bestModules);
  for (let mask = 1; mask < 8; mask += 1) {
    const candidate = buildMatrix(version, codewords, mask);
    const candidatePenalty = penalty(candidate);
    if (candidatePenalty < bestPenalty) {
      bestMask = mask;
      bestModules = candidate;
      bestPenalty = candidatePenalty;
    }
  }
  return { version, size: bestModules.length, mask: bestMask, modules: bestModules };
}

export function createQrSvg(payload: string): string {
  const qr = createQrCode(payload);
  const quietZone = 4;
  const dimension = qr.size + quietZone * 2;
  const path: string[] = [];
  for (let y = 0; y < qr.size; y += 1) for (let x = 0; x < qr.size; x += 1) {
    if (qr.modules[y][x]) path.push(`M${x + quietZone} ${y + quietZone}h1v1h-1z`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" role="img" aria-label="공유 링크 QR"><rect width="100%" height="100%" fill="#fff"/><path d="${path.join("")}" fill="#111827"/></svg>`;
}
