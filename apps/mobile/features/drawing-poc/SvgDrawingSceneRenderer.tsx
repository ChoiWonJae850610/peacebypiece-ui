import { memo, useEffect, useMemo } from "react";
import Svg, { Ellipse, G, Line, Path, Rect } from "react-native-svg";

import type { DrawingRendererAdapter } from "@/domain/drawing";
import { projectDrawingScene, type DrawingProjectedFrame, type DrawingRenderPrimitive } from "./drawingRenderProjection";

export const svgDrawingRendererAdapter: DrawingRendererAdapter<DrawingProjectedFrame> = Object.freeze({ render: projectDrawingScene });

function renderPrimitive(primitive: DrawingRenderPrimitive) {
  const shared = { fill: primitive.style.fillColor ?? "none", stroke: primitive.style.strokeColor, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: primitive.style.strokeWidth };
  if (primitive.kind === "path") return <Path {...shared} d={primitive.d} key={primitive.id} />;
  if (primitive.kind === "line") return <Line {...shared} key={primitive.id} x1={primitive.x1} x2={primitive.x2} y1={primitive.y1} y2={primitive.y2} />;
  if (primitive.kind === "rectangle") return <Rect {...shared} height={primitive.height} key={primitive.id} width={primitive.width} x={primitive.x} y={primitive.y} />;
  return <Ellipse {...shared} cx={primitive.x + primitive.width / 2} cy={primitive.y + primitive.height / 2} key={primitive.id} rx={primitive.width / 2} ry={primitive.height / 2} />;
}

const CommittedSvgLayer = memo(function CommittedSvgLayer(props: Readonly<{
  frame: DrawingProjectedFrame;
  onRender: () => void;
}>) {
  const { frame, onRender } = props;
  const committedElements = useMemo(() => frame.map(renderPrimitive), [frame]);
  useEffect(() => { onRender(); }, [frame, onRender]);
  return <G testID="drawing-poc-svg-committed-layer">{committedElements}</G>;
});

const ActiveStrokeSvgLayer = memo(function ActiveStrokeSvgLayer(props: Readonly<{
  primitive: DrawingRenderPrimitive | null;
}>) {
  return <G testID="drawing-poc-svg-active-layer">{props.primitive ? renderPrimitive(props.primitive) : null}</G>;
});

export default function SvgDrawingSceneRenderer(props: Readonly<{
  activePrimitive: DrawingRenderPrimitive | null;
  committedFrame: DrawingProjectedFrame;
  onCommittedLayerRender: () => void;
  height: number;
  width: number;
}>) {
  return <Svg height={props.height} testID="drawing-poc-svg-canvas" width={props.width}>
    <CommittedSvgLayer frame={props.committedFrame} onRender={props.onCommittedLayerRender} />
    <ActiveStrokeSvgLayer primitive={props.activePrimitive} />
  </Svg>;
}
