import {
  DRAWING_CANONICAL_CANVAS,
  DRAWING_SCENE_SCHEMA_VERSION,
  type DrawingBounds,
  type DrawingElement,
  type DrawingElementStyle,
  type DrawingPoint,
  type DrawingSceneV1,
} from "./contracts";

export type DrawingSceneValidationIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export type DrawingSceneValidationResult =
  | Readonly<{ ok: true; scene: DrawingSceneV1 }>
  | Readonly<{ ok: false; issues: readonly DrawingSceneValidationIssue[] }>;

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/;
const ELEMENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: DrawingSceneValidationIssue[],
  path: string,
  code: string,
  message: string,
) {
  issues.push(Object.freeze({ path, code, message }));
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  issues: DrawingSceneValidationIssue[],
) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      addIssue(issues, `${path}.${key}`, "unknown_field", "Unsupported persisted field.");
    }
  }
}

function readFiniteNumber(
  value: unknown,
  path: string,
  issues: DrawingSceneValidationIssue[],
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(issues, path, "finite_number_required", "Expected a finite number.");
    return null;
  }
  return value;
}

function readPoint(
  value: unknown,
  path: string,
  issues: DrawingSceneValidationIssue[],
): DrawingPoint | null {
  if (!isRecord(value)) {
    addIssue(issues, path, "point_required", "Expected a point object.");
    return null;
  }
  rejectUnknownKeys(value, ["x", "y"], path, issues);
  const x = readFiniteNumber(value.x, `${path}.x`, issues);
  const y = readFiniteNumber(value.y, `${path}.y`, issues);
  if (x === null || y === null) return null;
  if (x < 0 || x > DRAWING_CANONICAL_CANVAS.width || y < 0 || y > DRAWING_CANONICAL_CANVAS.height) {
    addIssue(issues, path, "point_outside_canvas", "Point must be inside the canonical canvas.");
    return null;
  }
  return Object.freeze({ x, y });
}

function readBounds(
  value: unknown,
  path: string,
  issues: DrawingSceneValidationIssue[],
): DrawingBounds | null {
  if (!isRecord(value)) {
    addIssue(issues, path, "bounds_required", "Expected a bounds object.");
    return null;
  }
  rejectUnknownKeys(value, ["x", "y", "width", "height"], path, issues);
  const x = readFiniteNumber(value.x, `${path}.x`, issues);
  const y = readFiniteNumber(value.y, `${path}.y`, issues);
  const width = readFiniteNumber(value.width, `${path}.width`, issues);
  const height = readFiniteNumber(value.height, `${path}.height`, issues);
  if (x === null || y === null || width === null || height === null) return null;
  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    addIssue(issues, path, "invalid_bounds", "Bounds require a non-negative origin and positive size.");
    return null;
  }
  if (x + width > DRAWING_CANONICAL_CANVAS.width || y + height > DRAWING_CANONICAL_CANVAS.height) {
    addIssue(issues, path, "bounds_outside_canvas", "Bounds must fit inside the canonical canvas.");
    return null;
  }
  return Object.freeze({ x, y, width, height });
}

function readColor(
  value: unknown,
  path: string,
  issues: DrawingSceneValidationIssue[],
  nullable: boolean,
): string | null | undefined {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !COLOR_PATTERN.test(value)) {
    addIssue(issues, path, "invalid_color", "Expected #RRGGBB or #RRGGBBAA color.");
    return undefined;
  }
  return value.toUpperCase();
}

function readStyle(
  value: unknown,
  path: string,
  issues: DrawingSceneValidationIssue[],
): DrawingElementStyle | null {
  if (!isRecord(value)) {
    addIssue(issues, path, "style_required", "Expected an element style.");
    return null;
  }
  rejectUnknownKeys(value, ["strokeColor", "strokeWidth", "fillColor"], path, issues);
  const strokeColor = readColor(value.strokeColor, `${path}.strokeColor`, issues, false);
  const fillColor = readColor(value.fillColor, `${path}.fillColor`, issues, true);
  const strokeWidth = readFiniteNumber(value.strokeWidth, `${path}.strokeWidth`, issues);
  if (strokeWidth !== null && strokeWidth <= 0) {
    addIssue(issues, `${path}.strokeWidth`, "invalid_stroke_width", "Stroke width must be positive.");
  }
  if (typeof strokeColor !== "string" || fillColor === undefined || strokeWidth === null || strokeWidth <= 0) {
    return null;
  }
  return Object.freeze({ strokeColor, strokeWidth, fillColor });
}

function readElement(
  value: unknown,
  index: number,
  issues: DrawingSceneValidationIssue[],
): DrawingElement | null {
  const path = `$.elements[${index}]`;
  if (!isRecord(value)) {
    addIssue(issues, path, "element_required", "Expected an element object.");
    return null;
  }
  const id = value.id;
  if (typeof id !== "string" || !ELEMENT_ID_PATTERN.test(id)) {
    addIssue(issues, `${path}.id`, "invalid_element_id", "Element ID is malformed.");
  }
  const style = readStyle(value.style, `${path}.style`, issues);
  const kind = value.kind;
  if (typeof id !== "string" || !ELEMENT_ID_PATTERN.test(id) || style === null) return null;

  if (kind === "freehand") {
    rejectUnknownKeys(value, ["id", "kind", "style", "points"], path, issues);
    if (!Array.isArray(value.points) || value.points.length < 2) {
      addIssue(issues, `${path}.points`, "invalid_freehand_points", "Freehand requires at least two points.");
      return null;
    }
    const points = value.points.map((point, pointIndex) => readPoint(point, `${path}.points[${pointIndex}]`, issues));
    if (points.some((point) => point === null)) return null;
    return Object.freeze({ id, kind, style, points: Object.freeze(points as DrawingPoint[]) });
  }

  if (kind === "line" || kind === "arrow") {
    rejectUnknownKeys(value, ["id", "kind", "style", "start", "end"], path, issues);
    const start = readPoint(value.start, `${path}.start`, issues);
    const end = readPoint(value.end, `${path}.end`, issues);
    if (start === null || end === null) return null;
    if (start.x === end.x && start.y === end.y) {
      addIssue(issues, path, "degenerate_segment", "Line and arrow endpoints must differ.");
      return null;
    }
    return Object.freeze({ id, kind, style, start, end });
  }

  if (kind === "rectangle" || kind === "ellipse") {
    rejectUnknownKeys(value, ["id", "kind", "style", "bounds"], path, issues);
    const bounds = readBounds(value.bounds, `${path}.bounds`, issues);
    if (bounds === null) return null;
    return Object.freeze({ id, kind, style, bounds });
  }

  addIssue(issues, `${path}.kind`, "unsupported_element_kind", "Element kind is not supported.");
  return null;
}

export function validateDrawingScene(value: unknown): DrawingSceneValidationResult {
  const issues: DrawingSceneValidationIssue[] = [];
  if (!isRecord(value)) {
    return Object.freeze({
      ok: false,
      issues: Object.freeze([
        Object.freeze({ path: "$", code: "scene_required", message: "Expected a Drawing Scene object." }),
      ]),
    });
  }
  rejectUnknownKeys(value, ["schemaVersion", "canvas", "elements"], "$", issues);
  if (value.schemaVersion !== DRAWING_SCENE_SCHEMA_VERSION) {
    addIssue(issues, "$.schemaVersion", "unsupported_schema", "Unsupported Drawing Scene schema version.");
  }

  if (!isRecord(value.canvas)) {
    addIssue(issues, "$.canvas", "canvas_required", "Expected the canonical canvas.");
  } else {
    rejectUnknownKeys(value.canvas, ["width", "height", "origin", "xAxis", "yAxis"], "$.canvas", issues);
    for (const [key, expected] of Object.entries(DRAWING_CANONICAL_CANVAS)) {
      if (value.canvas[key] !== expected) {
        addIssue(issues, `$.canvas.${key}`, "wrong_canonical_canvas", "Scene canvas is not canonical.");
      }
    }
  }

  if (!Array.isArray(value.elements)) {
    addIssue(issues, "$.elements", "elements_required", "Expected an ordered element array.");
  }
  const elements = Array.isArray(value.elements)
    ? value.elements.map((element, index) => readElement(element, index, issues))
    : [];
  const ids = new Set<string>();
  for (const element of elements) {
    if (element === null) continue;
    if (ids.has(element.id)) {
      addIssue(issues, "$.elements", "duplicate_element_id", "Element IDs must be unique.");
    }
    ids.add(element.id);
  }

  if (issues.length > 0 || elements.some((element) => element === null)) {
    return Object.freeze({ ok: false, issues: Object.freeze(issues) });
  }
  return Object.freeze({
    ok: true,
    scene: Object.freeze({
      schemaVersion: DRAWING_SCENE_SCHEMA_VERSION,
      canvas: DRAWING_CANONICAL_CANVAS,
      elements: Object.freeze(elements as DrawingElement[]),
    }),
  });
}

export class DrawingSceneValidationError extends Error {
  readonly issues: readonly DrawingSceneValidationIssue[];

  constructor(issues: readonly DrawingSceneValidationIssue[]) {
    super(`Invalid Drawing Scene (${issues.length} issue${issues.length === 1 ? "" : "s"}).`);
    this.name = "DrawingSceneValidationError";
    this.issues = issues;
  }
}

export function cloneDrawingScene(value: unknown): DrawingSceneV1 {
  const result = validateDrawingScene(value);
  if (!result.ok) throw new DrawingSceneValidationError(result.issues);
  return result.scene;
}

export function createDrawingScene(elements: readonly DrawingElement[] = []): DrawingSceneV1 {
  return cloneDrawingScene({
    schemaVersion: DRAWING_SCENE_SCHEMA_VERSION,
    canvas: DRAWING_CANONICAL_CANVAS,
    elements,
  });
}

export function serializeDrawingScene(scene: DrawingSceneV1): string {
  return JSON.stringify(cloneDrawingScene(scene));
}

export function parseDrawingScene(serialized: string): DrawingSceneV1 {
  let value: unknown;
  try {
    value = JSON.parse(serialized) as unknown;
  } catch {
    throw new DrawingSceneValidationError([
      Object.freeze({ path: "$", code: "invalid_json", message: "Drawing Scene JSON is malformed." }),
    ]);
  }
  return cloneDrawingScene(value);
}

export function drawingScenesEqual(left: DrawingSceneV1, right: DrawingSceneV1): boolean {
  return serializeDrawingScene(left) === serializeDrawingScene(right);
}
