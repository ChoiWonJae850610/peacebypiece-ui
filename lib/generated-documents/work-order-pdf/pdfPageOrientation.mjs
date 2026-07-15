const PDF_OBJECT_PATTERN = /(?:^|[\r\n])(\d+)\s+(\d+)\s+obj\b([\s\S]*?)\bendobj\b/g;
const PDF_REFERENCE_PATTERN = /(\d+)\s+(\d+)\s+R/g;
const BOX_TOLERANCE_POINTS = 2;
const VALID_ROTATIONS = new Set([0, 90, 180, 270]);

function parseObjects(pdfBytes) {
  const source = Buffer.from(pdfBytes).toString("latin1");
  const objects = new Map();
  for (const match of source.matchAll(PDF_OBJECT_PATTERN)) {
    objects.set(`${match[1]}:${match[2]}`, match[3]);
  }
  if (objects.size === 0) throw new Error("PDF_PAGE_TREE_UNREADABLE");
  return objects;
}

function parseReference(value) {
  const match = value?.match(/^(\d+)\s+(\d+)\s+R$/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function readRawValue(body, key) {
  const match = body.match(new RegExp(`/${key}\\s*(\\[[^\\]]*\\]|\\d+\\s+\\d+\\s+R|-?\\d+(?:\\.\\d+)?)`));
  return match?.[1]?.trim() ?? null;
}

function readInheritedRawValue(objects, objectKey, key, visited = new Set()) {
  if (!objectKey || visited.has(objectKey)) return null;
  visited.add(objectKey);
  const body = objects.get(objectKey);
  if (!body) return null;
  const value = readRawValue(body, key);
  if (value !== null) return value;
  return readInheritedRawValue(objects, parseReference(readRawValue(body, "Parent")), key, visited);
}

function resolveRawValue(objects, rawValue) {
  const reference = parseReference(rawValue);
  return reference ? objects.get(reference)?.trim() ?? null : rawValue;
}

function parseBox(objects, rawValue, boxName, required) {
  const resolved = resolveRawValue(objects, rawValue);
  if (!resolved) {
    if (required) throw new Error(`PDF_${boxName.toUpperCase()}_MISSING`);
    return null;
  }
  const values = resolved.match(/-?(?:\d+(?:\.\d+)?|\.\d+)/g)?.map(Number) ?? [];
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`PDF_${boxName.toUpperCase()}_INVALID`);
  }
  const [x1, y1, x2, y2] = values;
  const width = x2 - x1;
  const height = y2 - y1;
  if (width <= 0 || height <= 0) throw new Error(`PDF_${boxName.toUpperCase()}_INVALID`);
  return { x: x1, y: y1, width, height };
}

function parseRotation(objects, rawValue) {
  const resolved = resolveRawValue(objects, rawValue);
  const rotation = resolved === null || resolved === undefined ? 0 : Number(resolved);
  if (!Number.isInteger(rotation) || !VALID_ROTATIONS.has(rotation)) {
    throw new Error("PDF_PAGE_ROTATE_INVALID");
  }
  return rotation;
}

function pageKeysInDocumentOrder(objects) {
  const catalog = [...objects.entries()].find(([, body]) => /\/Type\s*\/Catalog\b/.test(body));
  const rootPages = catalog ? parseReference(readRawValue(catalog[1], "Pages")) : null;
  if (!rootPages) throw new Error("PDF_PAGE_TREE_UNREADABLE");

  const ordered = [];
  const visited = new Set();
  const visit = (objectKey) => {
    if (!objectKey || visited.has(objectKey)) throw new Error("PDF_PAGE_TREE_INVALID");
    visited.add(objectKey);
    const body = objects.get(objectKey);
    if (!body) throw new Error("PDF_PAGE_TREE_INVALID");
    if (/\/Type\s*\/Page\b/.test(body) && !/\/Type\s*\/Pages\b/.test(body)) {
      ordered.push(objectKey);
      return;
    }
    if (!/\/Type\s*\/Pages\b/.test(body)) throw new Error("PDF_PAGE_TREE_INVALID");
    const kids = body.match(/\/Kids\s*\[([\s\S]*?)\]/)?.[1] ?? "";
    const references = [...kids.matchAll(PDF_REFERENCE_PATTERN)].map((match) => `${match[1]}:${match[2]}`);
    if (references.length === 0) throw new Error("PDF_PAGE_TREE_INVALID");
    references.forEach(visit);
  };
  visit(rootPages);
  if (ordered.length === 0) throw new Error("PDF_PAGE_COUNT_INVALID");
  return ordered;
}

export function classifyPdfPageOrientation(width, height, tolerancePoints = BOX_TOLERANCE_POINTS) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("PDF_PAGE_DIMENSIONS_INVALID");
  }
  if (Math.abs(width - height) <= tolerancePoints) return "square-or-unknown";
  return width > height ? "landscape" : "portrait";
}

export function inspectPdfPageOrientations(pdfBytes) {
  const objects = parseObjects(pdfBytes);
  return pageKeysInDocumentOrder(objects).map((objectKey, pageIndex) => {
    const mediaBox = parseBox(objects, readInheritedRawValue(objects, objectKey, "MediaBox"), "media_box", true);
    const cropBox = parseBox(objects, readInheritedRawValue(objects, objectKey, "CropBox"), "crop_box", false);
    const trimBox = parseBox(objects, readRawValue(objects.get(objectKey) ?? "", "TrimBox"), "trim_box", false);
    const rotate = parseRotation(objects, readInheritedRawValue(objects, objectKey, "Rotate"));
    const effectiveBox = cropBox ?? mediaBox;
    const quarterTurn = rotate === 90 || rotate === 270;
    const effectiveWidth = quarterTurn ? effectiveBox.height : effectiveBox.width;
    const effectiveHeight = quarterTurn ? effectiveBox.width : effectiveBox.height;
    const classifiedOrientation = classifyPdfPageOrientation(effectiveWidth, effectiveHeight);
    const expectedOrientation = pageIndex === 0 ? "landscape" : "portrait";
    return {
      pageIndex,
      mediaBox,
      cropBox,
      trimBox,
      effectiveBoxSource: cropBox ? "cropBox" : "mediaBox",
      rotate,
      effectiveWidth,
      effectiveHeight,
      classifiedOrientation,
      expectedOrientation,
      match: classifiedOrientation === expectedOrientation,
    };
  });
}

export function validatePdfPageOrientations(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return { valid: false, firstMismatchPageIndex: null, mismatchReason: "page-count-zero" };
  }
  const firstMismatch = pages.find((page) => !page?.match);
  if (!firstMismatch) return { valid: true, firstMismatchPageIndex: null, mismatchReason: null };
  return {
    valid: false,
    firstMismatchPageIndex: Number.isInteger(firstMismatch.pageIndex) ? firstMismatch.pageIndex : null,
    mismatchReason: firstMismatch.classifiedOrientation === "square-or-unknown"
      ? "square-or-unknown"
      : `expected-${firstMismatch.expectedOrientation}-actual-${firstMismatch.classifiedOrientation}`,
  };
}
