import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WorkOrderMajorCategoryCode } from "@/domain/workOrderCategoryPolicy";
import { getWaflSpecMeasurementDiagram } from "./specMeasurementDiagramDefinitions";
import WaflStaticGarmentAsset from "./WaflStaticGarmentAsset";

type Props = {
  readonly categoryCode: WorkOrderMajorCategoryCode | null;
  readonly previewSpecKey: string | null;
};

function points(value: readonly (readonly [number, number])[]) {
  return value.map(([x, y]) => `${x},${y}`).join(" ");
}

export default function WaflSpecMeasurementDiagram(props: Props) {
  const definition = getWaflSpecMeasurementDiagram(props.categoryCode);
  if (!definition) return null;

  const guide = props.previewSpecKey ? definition.guides.find((candidate) => candidate.specKey === props.previewSpecKey) ?? null : null;
  return <View accessibilityLabel={`${definition.categoryLabel} 스펙 위치 안내`} pointerEvents="none" style={styles.container}>
    <View style={styles.diagram}>
    <Svg accessibilityLabel={`${definition.categoryLabel} 의류 측정 도식`} height="100%" preserveAspectRatio="xMidYMid meet" viewBox={definition.viewBox} width="100%">
      <WaflStaticGarmentAsset categoryCode={definition.categoryCode} />
      {guide ? (() => {
        const first = guide.measurementPoints[0];
        const last = guide.measurementPoints[guide.measurementPoints.length - 1];
        return <G key={guide.specKey}>
          <G>
            {guide.extensionLines.map(([from, to], index) => <Line
              key={`${guide.specKey}-extension-${index}`}
              stroke={WAFL_THEME.color.brickOrange}
              strokeDasharray="2 3"
              strokeWidth={1.1}
              x1={from[0]}
              x2={to[0]}
              y1={from[1]}
              y2={to[1]}
            />)}
            <Polyline
              fill="none"
              points={points(guide.measurementPoints)}
              stroke={WAFL_THEME.color.brickOrange}
              strokeDasharray={guide.lineStyle === "dashed" ? "3 3" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
            />
            {guide.connectorPoints.length > 1 ? <Polyline
              fill="none"
              points={points(guide.connectorPoints)}
              stroke={WAFL_THEME.color.brickOrange}
              strokeDasharray="2 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.15}
            /> : null}
            <Circle cx={first[0]} cy={first[1]} fill={WAFL_THEME.color.brickOrange} r={2.4} />
            <Circle cx={last[0]} cy={last[1]} fill={WAFL_THEME.color.brickOrange} r={2.4} />
          </G>
          <Rect
            fill={WAFL_THEME.color.fabricBeige}
            height={guide.label.height}
            rx={4}
            stroke={WAFL_THEME.color.brickOrange}
            strokeWidth={1.2}
            width={guide.label.width}
            x={guide.label.x}
            y={guide.label.y}
          />
          <SvgText
            fill={WAFL_THEME.color.brickOrange}
            fontFamily={WAFL_FONTS.semibold}
            fontSize={7.4}
            textAnchor="middle"
            x={guide.label.x + guide.label.width / 2}
            y={guide.label.y + 11.4}
          >{guide.displayName}</SvgText>
        </G>;
      })() : null}
    </Svg>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1.28,
    backgroundColor: WAFL_THEME.color.paper,
    borderColor: WAFL_THEME.color.border,
    borderRadius: WAFL_THEME.radius.card,
    borderWidth: WAFL_THEME.border.hairline,
    overflow: "hidden",
    paddingHorizontal: WAFL_THEME.spacing.xs,
    paddingVertical: WAFL_THEME.spacing.xs,
  },
  diagram: { flex: 1 },
});
