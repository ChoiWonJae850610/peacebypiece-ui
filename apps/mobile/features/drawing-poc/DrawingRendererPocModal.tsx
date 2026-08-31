import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import {
  appendDrawingActiveStrokePoint,
  beginDrawingActiveStroke,
  cancelDrawingActiveStroke,
  commitDrawingScene,
  createDrawingCamera,
  createDrawingScene,
  createDrawingSceneHistory,
  finalizeDrawingActiveStroke,
  measureDrawingPointGaps,
  redoDrawingScene,
  resolveDrawingViewportTransform,
  screenToWorld,
  serializeDrawingScene,
  undoDrawingScene,
  type DrawingActiveStroke,
  type DrawingPoint,
  type DrawingSceneHistory,
  type DrawingViewport,
} from "@/domain/drawing";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import {
  DRAWING_POC_FREEHAND_STYLE,
  countDrawingPocFreehandElements,
  countDrawingPocFreehandPoints,
  createDrawingPocWorkload,
  type DrawingPocWorkload,
} from "./drawingRendererPocPolicy";
import { projectDrawingElement } from "./drawingRenderProjection";
import SvgDrawingSceneRenderer, { svgDrawingRendererAdapter } from "./SvgDrawingSceneRenderer";
import { readDrawingPocMonotonicTime } from "./drawingPocTiming";

type Props = Readonly<{
  visible: boolean;
  onClose: () => void;
}>;

type StrokeMetrics = Readonly<{
  acceptedPoints: number;
  activeUpdates: number;
  averageWorldGap: number;
  cancelled: boolean;
  decimatedPoints: number;
  maximumWorldGap: number;
  samplesReceived: number;
}>;

type CommitCounters = Readonly<{
  history: number;
  scene: number;
}>;

type ProjectionCounters = Readonly<{
  paths: number;
  projections: number;
}>;

const camera = createDrawingCamera();
const emptyStrokeMetrics: StrokeMetrics = Object.freeze({
  acceptedPoints: 0,
  activeUpdates: 0,
  averageWorldGap: 0,
  cancelled: false,
  decimatedPoints: 0,
  maximumWorldGap: 0,
  samplesReceived: 0,
});
const workloadLabels: Readonly<Record<DrawingPocWorkload, string>> = Object.freeze({
  sparse: "Sparse",
  medium: "Medium",
  heavy: "Heavy",
});

function clampWorldPoint(point: DrawingPoint): DrawingPoint {
  return Object.freeze({
    x: Math.max(0, Math.min(1_000, point.x)),
    y: Math.max(0, Math.min(1_400, point.y)),
  });
}

function beginHistory(workload: DrawingPocWorkload): DrawingSceneHistory {
  return createDrawingSceneHistory(createDrawingPocWorkload(workload));
}

function metricsFromStroke(stroke: DrawingActiveStroke, activeUpdates: number, cancelled = false): StrokeMetrics {
  const gaps = measureDrawingPointGaps(stroke.points);
  return Object.freeze({
    acceptedPoints: stroke.points.length,
    activeUpdates,
    averageWorldGap: gaps.averageWorldGap,
    cancelled,
    decimatedPoints: stroke.decimatedPoints,
    maximumWorldGap: gaps.maximumWorldGap,
    samplesReceived: stroke.samplesReceived,
  });
}

export default function DrawingRendererPocModal(props: Props) {
  const [workload, setWorkload] = useState<DrawingPocWorkload>("sparse");
  const [history, setHistory] = useState(() => beginHistory("sparse"));
  const [activeStroke, setActiveStroke] = useState<DrawingActiveStroke | null>(null);
  const [viewport, setViewport] = useState<DrawingViewport>({ width: 1, height: 1 });
  const [lastActiveUpdateMs, setLastActiveUpdateMs] = useState<number | null>(null);
  const [lastCommitMs, setLastCommitMs] = useState<number | null>(null);
  const [lastStrokeMetrics, setLastStrokeMetrics] = useState<StrokeMetrics>(emptyStrokeMetrics);
  const [commitCounters, setCommitCounters] = useState<CommitCounters>({ history: 0, scene: 0 });
  const [activeUpdateCount, setActiveUpdateCount] = useState(0);
  const [committedLayerRenderCount, setCommittedLayerRenderCount] = useState(0);
  const [projectionCounters, setProjectionCounters] = useState<ProjectionCounters>(() => ({
    paths: countDrawingPocFreehandElements(history.current),
    projections: 1,
  }));
  const historyRef = useRef(history);
  const viewportRef = useRef(viewport);
  const activeStrokeRef = useRef<DrawingActiveStroke | null>(null);
  const activeUpdateCountRef = useRef(0);
  const strokeSequenceRef = useRef(0);
  const committedScene = history.current;

  useEffect(() => { historyRef.current = history; }, [history]);
  const transform = useMemo(() => resolveDrawingViewportTransform(camera, viewport), [viewport]);
  const committedFrame = useMemo(
    () => svgDrawingRendererAdapter.render({ scene: committedScene, transform }),
    [committedScene, transform],
  );
  const activePrimitive = useMemo(() => activeStroke
    ? projectDrawingElement(finalizeDrawingActiveStroke(activeStroke), transform)
    : null, [activeStroke, transform]);
  const sceneBytes = useMemo(() => serializeDrawingScene(committedScene).length, [committedScene]);
  const onCommittedLayerRender = useCallback(() => {
    setCommittedLayerRenderCount((current) => current + 1);
  }, []);

  function updateHistory(next: DrawingSceneHistory) {
    if (next.current !== historyRef.current.current) {
      setProjectionCounters((current) => ({
        paths: current.paths + countDrawingPocFreehandElements(next.current),
        projections: current.projections + 1,
      }));
    }
    historyRef.current = next;
    setHistory(next);
  }

  function discardActiveStroke(cancelled: boolean) {
    const current = activeStrokeRef.current;
    activeStrokeRef.current = cancelDrawingActiveStroke();
    setActiveStroke(null);
    if (current) setLastStrokeMetrics(metricsFromStroke(current, activeUpdateCountRef.current, cancelled));
  }

  function setWorkloadScene(nextWorkload: DrawingPocWorkload) {
    const startedAt = readDrawingPocMonotonicTime();
    discardActiveStroke(true);
    const next = beginHistory(nextWorkload);
    setWorkload(nextWorkload);
    setProjectionCounters({ paths: 0, projections: 0 });
    updateHistory(next);
    setCommitCounters({ history: 0, scene: 0 });
    activeUpdateCountRef.current = 0;
    setActiveUpdateCount(0);
    setCommittedLayerRenderCount(0);
    setLastStrokeMetrics(emptyStrokeMetrics);
    setLastCommitMs(readDrawingPocMonotonicTime() - startedAt);
  }

  function worldPointFromEvent(locationX: number, locationY: number): DrawingPoint {
    return clampWorldPoint(screenToWorld({ x: locationX, y: locationY }, camera, viewportRef.current));
  }

  // The responder is constructed once; these ref reads occur only inside native gesture callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const first = worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY);
      const active = beginDrawingActiveStroke({
        id: `poc-live-${strokeSequenceRef.current += 1}`,
        point: first,
        style: DRAWING_POC_FREEHAND_STYLE,
      });
      activeStrokeRef.current = active;
      activeUpdateCountRef.current = 0;
      setActiveStroke(active);
      setActiveUpdateCount(0);
      setLastStrokeMetrics(emptyStrokeMetrics);
    },
    onPanResponderMove: (event) => {
      const current = activeStrokeRef.current;
      if (!current) return;
      const startedAt = readDrawingPocMonotonicTime();
      const next = appendDrawingActiveStrokePoint(
        current,
        worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY),
      );
      activeStrokeRef.current = next;
      if (next.points !== current.points) {
        activeUpdateCountRef.current += 1;
        setActiveUpdateCount(activeUpdateCountRef.current);
        setActiveStroke(next);
      }
      setLastActiveUpdateMs(readDrawingPocMonotonicTime() - startedAt);
    },
    onPanResponderRelease: (event) => {
      const current = activeStrokeRef.current;
      if (!current) return;
      const completed = appendDrawingActiveStrokePoint(
        current,
        worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY),
        { final: true },
      );
      activeStrokeRef.current = null;
      setActiveStroke(null);

      const startedAt = readDrawingPocMonotonicTime();
      const completedElement = finalizeDrawingActiveStroke(completed);
      const nextScene = createDrawingScene([...historyRef.current.current.elements, completedElement]);
      const nextHistory = commitDrawingScene(historyRef.current, nextScene);
      updateHistory(nextHistory);
      setCommitCounters((currentCounters) => ({
        history: currentCounters.history + 1,
        scene: currentCounters.scene + 1,
      }));
      setLastStrokeMetrics(metricsFromStroke(completed, activeUpdateCountRef.current));
      setLastCommitMs(readDrawingPocMonotonicTime() - startedAt);
    },
    onPanResponderTerminate: () => {
      discardActiveStroke(true);
    },
  }));

  function onCanvasLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0 && (width !== viewportRef.current.width || height !== viewportRef.current.height)) {
      const next = { width, height };
      setProjectionCounters((current) => ({
        paths: current.paths + countDrawingPocFreehandElements(historyRef.current.current),
        projections: current.projections + 1,
      }));
      viewportRef.current = next;
      setViewport(next);
    }
  }

  function closePoc() {
    discardActiveStroke(true);
    props.onClose();
  }

  const visibleStrokeMetrics = activeStroke ? metricsFromStroke(activeStroke, activeUpdateCount) : lastStrokeMetrics;
  return <Modal animationType="slide" onRequestClose={closePoc} presentationStyle="fullScreen" visible={props.visible}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SVG Drawing Fidelity &amp; Performance PoC</Text>
          <Text style={styles.subtitle}>DEV/TEST · 메모리 전용 · 저장/업로드 없음</Text>
        </View>
        <Pressable accessibilityLabel="Drawing PoC 닫기" onPress={closePoc} style={styles.close}><X color={WAFL_THEME.color.deepNavy} size={24} /></Pressable>
      </View>

      <View style={styles.workloadRow}>
        {(["sparse", "medium", "heavy"] as const).map((candidate) => <Pressable accessibilityRole="button" accessibilityState={{ selected: workload === candidate }} key={candidate} onPress={() => setWorkloadScene(candidate)} style={[styles.workload, workload === candidate && styles.workloadSelected]} testID={`drawing-poc-workload-${candidate}`}><Text style={styles.workloadText}>{workloadLabels[candidate]}</Text></Pressable>)}
      </View>

      <View onLayout={onCanvasLayout} style={styles.canvasFrame} testID="drawing-poc-input-surface" {...panResponder.panHandlers}>
        {viewport.width > 1 && viewport.height > 1
          ? <SvgDrawingSceneRenderer activePrimitive={activePrimitive} committedFrame={committedFrame} height={viewport.height} onCommittedLayerRender={onCommittedLayerRender} width={viewport.width} />
          : null}
      </View>

      <View style={styles.actionRow}>
        <Pressable disabled={history.past.length === 0} onPress={() => updateHistory(undoDrawingScene(historyRef.current))} style={[styles.action, history.past.length === 0 && styles.disabled]} testID="drawing-poc-undo"><Text style={styles.actionText}>Undo</Text></Pressable>
        <Pressable disabled={history.future.length === 0} onPress={() => updateHistory(redoDrawingScene(historyRef.current))} style={[styles.action, history.future.length === 0 && styles.disabled]} testID="drawing-poc-redo"><Text style={styles.actionText}>Redo</Text></Pressable>
        <Pressable onPress={() => updateHistory(commitDrawingScene(historyRef.current, createDrawingScene()))} style={[styles.action, styles.clear]} testID="drawing-poc-clear"><Text style={[styles.actionText, styles.clearText]}>Clear</Text></Pressable>
      </View>

      <View style={styles.overlay} testID="drawing-poc-developer-overlay">
        <Text style={styles.overlayText}>renderer SVG · workload {workload}</Text>
        <Text style={styles.overlayText}>elements {committedScene.elements.length} · freehand points {countDrawingPocFreehandPoints(committedScene)} · scene bytes {sceneBytes}</Text>
        <Text style={styles.overlayText}>samples {visibleStrokeMetrics.samplesReceived} · accepted {visibleStrokeMetrics.acceptedPoints} · decimated {visibleStrokeMetrics.decimatedPoints} · active {activeStroke?.points.length ?? 0}</Text>
        <Text style={styles.overlayText}>avg gap {visibleStrokeMetrics.averageWorldGap.toFixed(2)} · max gap {visibleStrokeMetrics.maximumWorldGap.toFixed(2)} world · active updates {visibleStrokeMetrics.activeUpdates}</Text>
        <Text style={styles.overlayText}>committed layer renders {committedLayerRenderCount} · projection rebuilds {projectionCounters.projections} · path rebuilds {projectionCounters.paths}</Text>
        <Text style={styles.overlayText}>stroke Scene commits {commitCounters.scene} · History commits {commitCounters.history}{visibleStrokeMetrics.cancelled ? " · last cancelled" : ""}</Text>
        <Text style={styles.overlayText}>active JS {lastActiveUpdateMs === null ? "—" : `${lastActiveUpdateMs.toFixed(2)}ms`} · commit JS {lastCommitMs === null ? "—" : `${lastCommitMs.toFixed(2)}ms`}</Text>
      </View>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1, paddingHorizontal: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 8, paddingTop: 4 },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 17 },
  subtitle: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 9, marginTop: 2 },
  close: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  workloadRow: { flexDirection: "row", gap: 7, paddingVertical: 8 },
  workload: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: 9, borderWidth: 1, flex: 1, paddingVertical: 7 },
  workloadSelected: { backgroundColor: "#F3E3D7", borderColor: WAFL_THEME.color.brickOrange },
  workloadText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: 10 },
  canvasFrame: { backgroundColor: "#FFFDF8", borderColor: WAFL_THEME.color.border, borderRadius: 12, borderWidth: 1, flex: 1, overflow: "hidden" },
  actionRow: { flexDirection: "row", gap: 8, paddingVertical: 8 },
  action: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: 9, borderWidth: 1, flex: 1, paddingVertical: 8 },
  actionText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  clear: { borderColor: "#D8AAA0" },
  clearText: { color: WAFL_THEME.color.error },
  disabled: { opacity: 0.36 },
  overlay: { backgroundColor: "#1D293BCC", borderRadius: 8, gap: 2, marginBottom: 5, paddingHorizontal: 9, paddingVertical: 6 },
  overlayText: { color: "#FFFFFF", fontFamily: WAFL_FONTS.medium, fontSize: 8, lineHeight: 11 },
});
