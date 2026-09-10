import { createDrawingScene, type DrawingSceneV1 } from "@/lib/domain/drawing";

const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 5 });

export function createAlpha78SampleDrawingScene(): DrawingSceneV1 {
  return createDrawingScene([
    Object.freeze({ id: "alpha78:freehand:original", kind: "freehand" as const, points: Object.freeze([{ x: 120, y: 230 }, { x: 210, y: 170 }, { x: 310, y: 220 }, { x: 390, y: 150 }]), style }),
    Object.freeze({ id: "alpha78:freehand:fragment-a", kind: "freehand" as const, points: Object.freeze([{ x: 110, y: 350 }, { x: 175, y: 330 }, { x: 235, y: 365 }]), style }),
    Object.freeze({ id: "alpha78:freehand:fragment-b", kind: "freehand" as const, points: Object.freeze([{ x: 300, y: 370 }, { x: 365, y: 335 }, { x: 435, y: 360 }]), style }),
    Object.freeze({ id: "alpha78:line:moved", kind: "line" as const, start: Object.freeze({ x: 120, y: 500 }), end: Object.freeze({ x: 440, y: 540 }), style }),
    Object.freeze({ id: "alpha78:arrow:end-edited", kind: "arrow" as const, start: Object.freeze({ x: 120, y: 650 }), end: Object.freeze({ x: 480, y: 585 }), style }),
    Object.freeze({ id: "alpha78:rectangle:resized", kind: "rectangle" as const, bounds: Object.freeze({ x: 530, y: 160, width: 330, height: 260 }), style }),
    Object.freeze({ id: "alpha78:ellipse:resized", kind: "ellipse" as const, bounds: Object.freeze({ x: 545, y: 490, width: 300, height: 205 }), style }),
    Object.freeze({ id: "alpha78:text:moved", kind: "text" as const, anchor: Object.freeze({ x: 155, y: 860 }), content: "3cm 줄임 · 포켓 2cm 위", fontSize: 42, style }),
    Object.freeze({ id: "alpha78:text:korean", kind: "text" as const, anchor: Object.freeze({ x: 155, y: 970 }), content: "시보리 변경 / 스티치 2줄", fontSize: 34, style }),
    Object.freeze({ id: "alpha78:z-order:top", kind: "rectangle" as const, bounds: Object.freeze({ x: 520, y: 820, width: 310, height: 250 }), style: Object.freeze({ ...style, strokeColor: "#9A3412" }) }),
  ]);
}
