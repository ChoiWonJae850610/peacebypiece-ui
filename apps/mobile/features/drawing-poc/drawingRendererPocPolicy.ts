import {
  DRAWING_CANONICAL_CANVAS,
  createDrawingScene,
  type DrawingElement,
  type DrawingFreehandElement,
  type DrawingPoint,
  type DrawingSceneV1,
} from "@/domain/drawing";

export type DrawingPocWorkload = "sparse" | "medium" | "heavy";

export const DRAWING_POC_FREEHAND_STYLE = Object.freeze({ strokeColor: "#25354D", strokeWidth: 8, fillColor: null });
const ACCENT = Object.freeze({ strokeColor: "#A5542F", strokeWidth: 7, fillColor: "#F5DED0" });

function point(x: number, y: number): DrawingPoint {
  return Object.freeze({ x, y });
}

const representativeElements: readonly DrawingElement[] = Object.freeze([
  Object.freeze({ id: "fixture-freehand", kind: "freehand", style: DRAWING_POC_FREEHAND_STYLE, points: Object.freeze([point(120, 250), point(180, 205), point(245, 255), point(310, 190), point(380, 235), point(450, 170), point(520, 210), point(590, 155)]) }),
  Object.freeze({ id: "fixture-line", kind: "line", style: DRAWING_POC_FREEHAND_STYLE, start: point(150, 430), end: point(820, 430) }),
  Object.freeze({ id: "fixture-arrow", kind: "arrow", style: DRAWING_POC_FREEHAND_STYLE, start: point(170, 610), end: point(810, 520) }),
  Object.freeze({ id: "fixture-rectangle", kind: "rectangle", style: ACCENT, bounds: Object.freeze({ x: 150, y: 740, width: 300, height: 260 }) }),
  Object.freeze({ id: "fixture-ellipse", kind: "ellipse", style: ACCENT, bounds: Object.freeze({ x: 540, y: 760, width: 300, height: 230 }) }),
]);

function workloadFreehand(index: number, pointsPerStroke: number, columns: number): DrawingFreehandElement {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const cellWidth = 900 / columns;
  const rowCount = Math.ceil((pointsPerStroke === 20 ? 40 : 120) / columns);
  const cellHeight = 1250 / rowCount;
  const points = Array.from({ length: pointsPerStroke }, (_, pointIndex) => {
    const progress = pointIndex / (pointsPerStroke - 1);
    const x = 50 + column * cellWidth + progress * (cellWidth - 18);
    const y = 70 + row * cellHeight + cellHeight * 0.5 + Math.sin(progress * Math.PI * 4 + index) * cellHeight * 0.25;
    return point(Math.min(DRAWING_CANONICAL_CANVAS.width, x), Math.min(DRAWING_CANONICAL_CANVAS.height, y));
  });
  return Object.freeze({ id: `workload-freehand-${index}`, kind: "freehand", style: DRAWING_POC_FREEHAND_STYLE, points: Object.freeze(points) });
}

function workloadShape(kind: "line" | "arrow" | "rectangle" | "ellipse", index: number, count: number): DrawingElement {
  const x = 45 + (index % 10) * 92;
  const y = 60 + Math.floor(index / 10) * Math.max(42, 1230 / Math.ceil(count / 10));
  if (kind === "line" || kind === "arrow") {
    return Object.freeze({ id: `workload-${kind}-${index}`, kind, style: ACCENT, start: point(x, y), end: point(Math.min(970, x + 70), Math.min(1370, y + 34)) });
  }
  return Object.freeze({ id: `workload-${kind}-${index}`, kind, style: ACCENT, bounds: Object.freeze({ x, y, width: 56, height: 34 }) });
}

export function createDrawingPocWorkload(workload: DrawingPocWorkload): DrawingSceneV1 {
  if (workload === "sparse") return createDrawingScene(representativeElements);
  const freehandCount = workload === "medium" ? 40 : 120;
  const pointsPerStroke = workload === "medium" ? 20 : 40;
  const shapeCount = workload === "medium" ? 10 : 30;
  const columns = workload === "medium" ? 8 : 12;
  const elements: DrawingElement[] = [];
  for (let index = 0; index < freehandCount; index += 1) elements.push(workloadFreehand(index, pointsPerStroke, columns));
  for (const kind of ["line", "arrow", "rectangle", "ellipse"] as const) {
    for (let index = 0; index < shapeCount; index += 1) elements.push(workloadShape(kind, index, shapeCount));
  }
  return createDrawingScene(elements);
}

export function countDrawingPocFreehandPoints(scene: DrawingSceneV1): number {
  return scene.elements.reduce((total, element) => total + (element.kind === "freehand" ? element.points.length : 0), 0);
}

export function countDrawingPocFreehandElements(scene: DrawingSceneV1): number {
  return scene.elements.reduce((total, element) => total + (element.kind === "freehand" ? 1 : 0), 0);
}

export function drawingPocWorkloadCounts(workload: DrawingPocWorkload): Readonly<{ elements: number; freehandPoints: number }> {
  const scene = createDrawingPocWorkload(workload);
  return Object.freeze({ elements: scene.elements.length, freehandPoints: countDrawingPocFreehandPoints(scene) });
}

export function isDrawingRendererPocEnabled(input: Readonly<{ authenticated: boolean; dev: boolean }>): boolean {
  return input.dev && input.authenticated;
}
