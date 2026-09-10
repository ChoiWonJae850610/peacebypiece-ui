import type { DrawingExportPrimitive, DrawingSceneV1 } from "@/lib/domain/drawing";
import { projectDrawingSceneForExport } from "@/lib/domain/drawing";
import styles from "./IssuedWorkOrderPreview.module.css";

export const ISSUED_WORK_ORDER_SKETCH_OUTPUT_BOX = Object.freeze({ width: 1_500, height: 2_100 });

function Primitive({ primitive }: { readonly primitive: DrawingExportPrimitive }) {
  const shared = {
    fill: primitive.style.fillColor ?? "none",
    stroke: primitive.style.strokeColor,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: primitive.style.strokeWidth,
  };
  if (primitive.kind === "path") return <path {...shared} d={primitive.d} />;
  if (primitive.kind === "line") return <line {...shared} x1={primitive.x1} x2={primitive.x2} y1={primitive.y1} y2={primitive.y2} />;
  if (primitive.kind === "text") return <text fill={primitive.style.strokeColor} fontSize={primitive.fontSize} stroke="none" x={primitive.x} y={primitive.y}>{primitive.content}</text>;
  if (primitive.kind === "rectangle") return <rect {...shared} height={primitive.height} width={primitive.width} x={primitive.x} y={primitive.y} />;
  return <ellipse {...shared} cx={primitive.x + primitive.width / 2} cy={primitive.y + primitive.height / 2} rx={primitive.width / 2} ry={primitive.height / 2} />;
}

export default function IssuedWorkOrderSketch({ scene }: { readonly scene: DrawingSceneV1 }) {
  const projection = projectDrawingSceneForExport(scene, ISSUED_WORK_ORDER_SKETCH_OUTPUT_BOX);
  return (
    <div className={styles.sketchOutputFrame} data-wafl-drawing-output="saved-scene-v1">
      <svg
        aria-label="저장된 제품 스케치"
        className={styles.sketchOutputSvg}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${projection.outputBox.width} ${projection.outputBox.height}`}
      >
        {projection.primitives.map((primitive) => <Primitive key={primitive.id} primitive={primitive} />)}
      </svg>
    </div>
  );
}
