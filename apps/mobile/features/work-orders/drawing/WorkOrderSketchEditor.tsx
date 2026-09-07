import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ModalProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpRight, Circle, Minus, PenLine, Redo2, Square, Trash2, Type, Undo2 } from "lucide-react-native";

import {
  appendDrawingActiveStrokePoint,
  beginDrawingActiveSegment,
  beginDrawingActiveShape,
  beginDrawingActiveStroke,
  cancelDrawingActiveSegment,
  cancelDrawingActiveShape,
  cancelDrawingActiveStroke,
  clampDrawingPointToCanvas,
  commitDrawingScene,
  createDrawingCamera,
  createDrawingScene,
  createDrawingSceneHistory,
  createDrawingTextElement,
  DRAWING_TEXT_DEFAULT_FONT_SIZE,
  DRAWING_TEXT_MAX_LENGTH,
  drawingScenesEqual,
  finalizeDrawingActiveSegment,
  finalizeDrawingActiveShape,
  finalizeDrawingActiveStroke,
  isDrawingAuthoringViewportGenerationCurrent,
  redoDrawingScene,
  resolveDrawingViewportTransform,
  screenToWorld,
  serializeDrawingScene,
  undoDrawingScene,
  updateDrawingActiveSegment,
  updateDrawingActiveShape,
  type DrawingActiveSegment,
  type DrawingActiveShape,
  type DrawingActiveStroke,
  type DrawingElement,
  type DrawingPoint,
  type DrawingSceneHistory,
  type DrawingViewport,
} from "@/domain/drawing";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { useWaflProductSketchOrientationPolicy } from "@/application/useWaflRuntimeOrientationPolicy";
import { MobileApiError } from "@/domain/mobileContract";
import WaflActionProcessingBlocker from "@/features/feedback/WaflActionProcessingBlocker";
import type { WaflActionConfirmationState } from "@/features/feedback/WaflActionConfirmationCard";
import WaflDecisionSheet from "@/features/feedback/WaflDecisionSheet";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflPrimaryActionButton from "@/features/inputs/WaflPrimaryActionButton";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import { projectDrawingElement, projectDrawingTextInsertionPreview } from "@/features/drawing-poc/drawingRenderProjection";
import SvgDrawingSceneRenderer, { svgDrawingRendererAdapter } from "@/features/drawing-poc/SvgDrawingSceneRenderer";
import { getPrimaryWorkOrderDrawing, savePrimaryWorkOrderDrawing } from "@/lib/api/drawingApi";
import { createWorkOrderSketchParentCloseGuard, resolveWorkOrderSketchCloseIntent } from "./workOrderSketchClosePolicy";
import {
  closeWorkOrderSketchTextSession,
  createWorkOrderSketchTextSession,
  isCurrentWorkOrderSketchTextSession,
  presentWorkOrderSketchTextSession,
  updateWorkOrderSketchTextDraft,
  type WorkOrderSketchTextSession,
} from "./workOrderSketchTextSessionPolicy";

const camera = createDrawingCamera();
const penStyle = Object.freeze({ strokeColor: "#17263D", strokeWidth: 4, fillColor: null });
const annotationStyle = Object.freeze({ strokeColor: "#17263D", strokeWidth: 3, fillColor: null });
const textInsertionCaretStyle = Object.freeze({ strokeColor: WAFL_THEME.color.readOnly, strokeWidth: 2, fillColor: null });
const WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS: NonNullable<ModalProps["supportedOrientations"]> = [
  "portrait",
];

type SketchTool = "pen" | "line" | "arrow" | "rectangle" | "ellipse" | "text";

type SaveIdentity = Readonly<{ clientRequestId: string; idempotencyKey: string }>;

function newHistory() {
  return createDrawingSceneHistory(createDrawingScene());
}

export default function WorkOrderSketchEditor(props: Readonly<{
  editable: boolean;
  onClose: () => void;
  visible: boolean;
  workOrderId: string;
}>) {
  useWaflProductSketchOrientationPolicy(props.visible);
  const [history, setHistory] = useState<DrawingSceneHistory>(newHistory);
  const [tool, setTool] = useState<SketchTool>("pen");
  const [activeStroke, setActiveStroke] = useState<DrawingActiveStroke | null>(null);
  const [activeSegment, setActiveSegment] = useState<DrawingActiveSegment | null>(null);
  const [activeShape, setActiveShape] = useState<DrawingActiveShape | null>(null);
  const [textSheetVisible, setTextSheetVisible] = useState(false);
  const [textSession, setTextSession] = useState<WorkOrderSketchTextSession | null>(null);
  const [viewport, setViewport] = useState<DrawingViewport>({ width: 1, height: 1 });
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [drawingVersion, setDrawingVersion] = useState(0);
  const [baseline, setBaseline] = useState(serializeDrawingScene(createDrawingScene()));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [decision, setDecision] = useState<WaflActionConfirmationState | null>(null);
  const historyRef = useRef(history);
  const viewportRef = useRef(viewport);
  const activeStrokeRef = useRef<DrawingActiveStroke | null>(null);
  const activeSegmentRef = useRef<DrawingActiveSegment | null>(null);
  const activeShapeRef = useRef<DrawingActiveShape | null>(null);
  const viewportGenerationRef = useRef(0);
  const activeGestureViewportGenerationRef = useRef<number | null>(null);
  const toolRef = useRef<SketchTool>("pen");
  const pendingTextAnchorRef = useRef<DrawingPoint | null>(null);
  const textSessionRef = useRef<WorkOrderSketchTextSession | null>(null);
  const textSheetVisibleRef = useRef(false);
  const pendingTextCommitRef = useRef<Readonly<{ element: DrawingElement; sessionId: number }> | null>(null);
  const closingTextSessionIdRef = useRef<number | null>(null);
  const textSessionSequenceRef = useRef(0);
  const editorVisibleRef = useRef(props.visible);
  const sequenceRef = useRef(0);
  const saveIdentityRef = useRef<SaveIdentity | null>(null);
  const savingRef = useRef(false);
  const openGenerationRef = useRef(0);
  const editableRef = useRef(props.editable);
  const parentCloseGuardRef = useRef(createWorkOrderSketchParentCloseGuard());
  const currentScene = history.current;
  const serialized = useMemo(() => serializeDrawingScene(currentScene), [currentScene]);
  const dirty = serialized !== baseline;

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { editableRef.current = props.editable; }, [props.editable]);
  useEffect(() => { editorVisibleRef.current = props.visible; }, [props.visible]);
  const transform = useMemo(() => resolveDrawingViewportTransform(camera, viewport), [viewport]);
  const committedFrame = useMemo(() => svgDrawingRendererAdapter.render({ scene: currentScene, transform }), [currentScene, transform]);
  const activePrimitive = useMemo(() => {
    if (activeStroke) return projectDrawingElement(finalizeDrawingActiveStroke(activeStroke), transform);
    if (activeSegment) return projectDrawingElement(activeSegment, transform);
    if (activeShape) {
      const preview = finalizeDrawingActiveShape(activeShape, 0);
      return preview ? projectDrawingElement(preview, transform) : null;
    }
    return null;
  }, [activeSegment, activeShape, activeStroke, transform]);
  const textPreviewFrame = useMemo(() => textSession === null ? [] : projectDrawingTextInsertionPreview({
    anchor: textSession.anchor,
    caretStyle: textInsertionCaretStyle,
    content: textSession.draft,
    fontSize: DRAWING_TEXT_DEFAULT_FONT_SIZE,
    textStyle: annotationStyle,
  }, transform), [textSession, transform]);

  useEffect(() => {
    if (!props.visible) return;
    const generation = openGenerationRef.current + 1;
    openGenerationRef.current = generation;
    parentCloseGuardRef.current.reset();
    async function load() {
      await Promise.resolve();
      if (generation !== openGenerationRef.current) return;
      setLoading(true);
      setMessage(null);
      setDecision(null);
      activeStrokeRef.current = null;
      activeSegmentRef.current = null;
      activeShapeRef.current = null;
      activeGestureViewportGenerationRef.current = null;
      setActiveStroke(null);
      setActiveSegment(null);
      setActiveShape(null);
      setTextSheetVisible(false);
      textSheetVisibleRef.current = false;
      textSessionRef.current = null;
      setTextSession(null);
      pendingTextAnchorRef.current = null;
      pendingTextCommitRef.current = null;
      saveIdentityRef.current = null;
      try {
        const drawing = await getPrimaryWorkOrderDrawing(props.workOrderId);
        if (generation !== openGenerationRef.current) return;
        const next = createDrawingSceneHistory(drawing.scene);
        historyRef.current = next;
        setHistory(next);
        setDrawingId(drawing.drawingId);
        setDrawingVersion(drawing.drawingVersion);
        setBaseline(serializeDrawingScene(drawing.scene));
      } catch (error) {
        if (generation === openGenerationRef.current) setMessage(error instanceof Error ? error.message : "스케치를 불러오지 못했습니다.");
      } finally {
        if (generation === openGenerationRef.current) setLoading(false);
      }
    }
    void load();
    return () => { openGenerationRef.current += 1; };
  }, [props.visible, props.workOrderId]);

  function updateHistory(next: DrawingSceneHistory) {
    historyRef.current = next;
    setHistory(next);
  }

  function discardActiveStroke() {
    activeStrokeRef.current = cancelDrawingActiveStroke();
    setActiveStroke(null);
  }

  function discardActiveSegment() {
    activeSegmentRef.current = cancelDrawingActiveSegment();
    setActiveSegment(null);
  }

  function discardActiveShape() {
    activeShapeRef.current = cancelDrawingActiveShape();
    setActiveShape(null);
  }

  function discardActiveGesture() {
    discardActiveStroke();
    discardActiveSegment();
    discardActiveShape();
    activeGestureViewportGenerationRef.current = null;
    pendingTextAnchorRef.current = null;
  }

  function commitElement(element: DrawingElement) {
    updateHistory(commitDrawingScene(
      historyRef.current,
      createDrawingScene([...historyRef.current.current.elements, element]),
    ));
  }

  function selectTool(next: SketchTool) {
    if (next === toolRef.current) return;
    discardActiveGesture();
    if (textSessionRef.current !== null) cancelText();
    toolRef.current = next;
    setTool(next);
  }

  function worldPointFromEvent(locationX: number, locationY: number) {
    return clampDrawingPointToCanvas(screenToWorld({ x: locationX, y: locationY }, camera, viewportRef.current));
  }

  function activeGestureUsesCurrentViewport() {
    return isDrawingAuthoringViewportGenerationCurrent(
      activeGestureViewportGenerationRef.current,
      viewportGenerationRef.current,
    );
  }

  // Native gesture callbacks read mutable session refs; no renderer or Scene mutation occurs during render.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => editableRef.current && !savingRef.current && textSessionRef.current === null,
    onMoveShouldSetPanResponder: () => editableRef.current && !savingRef.current && textSessionRef.current === null,
    onPanResponderGrant: (event) => {
      const point = worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY);
      activeGestureViewportGenerationRef.current = viewportGenerationRef.current;
      if (toolRef.current === "text") {
        pendingTextAnchorRef.current = point;
        return;
      }
      if (toolRef.current === "line" || toolRef.current === "arrow") {
        const segment = beginDrawingActiveSegment({ id: `${toolRef.current}:${Date.now()}:${sequenceRef.current += 1}`, kind: toolRef.current, point, style: annotationStyle });
        activeSegmentRef.current = segment;
        setActiveSegment(segment);
        return;
      }
      if (toolRef.current === "rectangle" || toolRef.current === "ellipse") {
        const shape = beginDrawingActiveShape({ id: `${toolRef.current}:${Date.now()}:${sequenceRef.current += 1}`, kind: toolRef.current, point, style: annotationStyle });
        activeShapeRef.current = shape;
        setActiveShape(shape);
        return;
      }
      const stroke = beginDrawingActiveStroke({ id: `stroke:${Date.now()}:${sequenceRef.current += 1}`, point, style: penStyle });
      activeStrokeRef.current = stroke;
      setActiveStroke(stroke);
    },
    onPanResponderMove: (event) => {
      if (!activeGestureUsesCurrentViewport()) {
        discardActiveGesture();
        return;
      }
      if (toolRef.current === "line" || toolRef.current === "arrow") {
        const current = activeSegmentRef.current;
        if (!current) return;
        const next = updateDrawingActiveSegment(current, worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY));
        activeSegmentRef.current = next;
        setActiveSegment(next);
        return;
      }
      if (toolRef.current === "rectangle" || toolRef.current === "ellipse") {
        const current = activeShapeRef.current;
        if (!current) return;
        const next = updateDrawingActiveShape(current, worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY));
        activeShapeRef.current = next;
        setActiveShape(next);
        return;
      }
      const current = activeStrokeRef.current;
      if (!current) return;
      const next = appendDrawingActiveStrokePoint(current, worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY));
      activeStrokeRef.current = next;
      if (next.points !== current.points) setActiveStroke(next);
    },
    onPanResponderRelease: (event) => {
      if (!activeGestureUsesCurrentViewport()) {
        discardActiveGesture();
        return;
      }
      activeGestureViewportGenerationRef.current = null;
      if (toolRef.current === "text") {
        const anchor = pendingTextAnchorRef.current;
        pendingTextAnchorRef.current = null;
        if (!anchor || textSessionRef.current !== null) return;
        const session = createWorkOrderSketchTextSession(textSessionSequenceRef.current + 1, anchor);
        textSessionSequenceRef.current = session.id;
        textSessionRef.current = session;
        setTextSession(session);
        textSheetVisibleRef.current = true;
        setTextSheetVisible(true);
        return;
      }
      if (toolRef.current === "line" || toolRef.current === "arrow") {
        const current = activeSegmentRef.current;
        if (!current) return;
        const completed = updateDrawingActiveSegment(current, worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY));
        activeSegmentRef.current = null;
        setActiveSegment(null);
        const element = finalizeDrawingActiveSegment(completed);
        if (element) commitElement(element);
        return;
      }
      if (toolRef.current === "rectangle" || toolRef.current === "ellipse") {
        const current = activeShapeRef.current;
        if (!current) return;
        const completed = updateDrawingActiveShape(current, worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY));
        activeShapeRef.current = null;
        setActiveShape(null);
        const element = finalizeDrawingActiveShape(completed);
        if (element) commitElement(element);
        return;
      }
      const current = activeStrokeRef.current;
      if (!current) return;
      const completed = appendDrawingActiveStrokePoint(current, worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY), { final: true });
      activeStrokeRef.current = null;
      setActiveStroke(null);
      commitElement(finalizeDrawingActiveStroke(completed));
    },
    onPanResponderTerminate: discardActiveGesture,
  }));

  async function acceptText() {
    const session = textSessionRef.current;
    if (!session || session.phase !== "presented") return;
    const element = createDrawingTextElement({
      id: `text:${Date.now()}:${sequenceRef.current += 1}`,
      anchor: session.anchor,
      content: session.draft,
      style: annotationStyle,
    });
    if (!element) return;
    pendingTextCommitRef.current = Object.freeze({ element, sessionId: session.id });
    closingTextSessionIdRef.current = session.id;
    const closing = closeWorkOrderSketchTextSession(session);
    textSessionRef.current = closing;
    setTextSession(closing);
    textSheetVisibleRef.current = false;
    setTextSheetVisible(false);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  function cancelText() {
    pendingTextCommitRef.current = null;
    closingTextSessionIdRef.current = textSessionRef.current?.id ?? null;
    textSessionRef.current = null;
    setTextSession(null);
    textSheetVisibleRef.current = false;
    setTextSheetVisible(false);
  }

  function completeTextSheetClose() {
    const pending = pendingTextCommitRef.current;
    const closingSessionId = closingTextSessionIdRef.current;
    pendingTextCommitRef.current = null;
    closingTextSessionIdRef.current = null;
    const currentSession = textSessionRef.current;
    textSessionRef.current = null;
    setTextSession(null);
    if (
      pending
      && pending.sessionId === closingSessionId
      && isCurrentWorkOrderSketchTextSession(currentSession, pending.sessionId)
      && editorVisibleRef.current
    ) commitElement(pending.element);
  }

  function presentTextSheet(sessionId: number | null) {
    if (sessionId === null || !textSheetVisibleRef.current || !editorVisibleRef.current) return;
    const presented = presentWorkOrderSketchTextSession(textSessionRef.current, sessionId);
    textSessionRef.current = presented.session;
    setTextSession(presented.session);
  }

  function updateTextDraft(value: string) {
    const next = updateWorkOrderSketchTextDraft(textSessionRef.current, value);
    textSessionRef.current = next;
    setTextSession(next);
  }

  function onCanvasLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    const next = { width, height };
    const current = viewportRef.current;
    if (Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5) return;
    viewportGenerationRef.current += 1;
    discardActiveGesture();
    viewportRef.current = next;
    setViewport(next);
  }

  function makeSaveIdentity(): SaveIdentity {
    const suffix = `${Date.now()}-${sequenceRef.current += 1}`;
    return Object.freeze({ clientRequestId: `alpha73-drawing-${suffix}`, idempotencyKey: `alpha73-drawing-${suffix}` });
  }

  async function save() {
    if (!props.editable || !dirty || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setMessage(null);
    const submitted = historyRef.current.current;
    const identity = saveIdentityRef.current ?? makeSaveIdentity();
    saveIdentityRef.current = identity;
    try {
      let saved;
      try {
        saved = await savePrimaryWorkOrderDrawing(props.workOrderId, { clientRequestId: identity.clientRequestId, drawingId, expectedVersion: drawingVersion, scene: submitted }, identity.idempotencyKey);
      } catch (error) {
        if (!(error instanceof MobileApiError) || (error.code !== "TIMEOUT" && error.code !== "NETWORK_ERROR")) throw error;
        const reconciled = await getPrimaryWorkOrderDrawing(props.workOrderId);
        if (!drawingScenesEqual(reconciled.scene, submitted)) throw error;
        saved = reconciled;
      }
      setDrawingId(saved.drawingId);
      setDrawingVersion(saved.drawingVersion);
      setBaseline(serializeDrawingScene(saved.scene));
      saveIdentityRef.current = null;
      setMessage("스케치를 저장했습니다.");
    } catch (error) {
      if (!(error instanceof MobileApiError) || (error.code !== "TIMEOUT" && error.code !== "NETWORK_ERROR")) saveIdentityRef.current = null;
      setMessage(error instanceof Error ? error.message : "스케치를 저장하지 못했습니다.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function closeEditorSession() {
    if (!parentCloseGuardRef.current.close()) return;
    props.onClose();
    discardActiveGesture();
    setDecision(null);
    cancelText();
  }

  function requestClose() {
    const intent = resolveWorkOrderSketchCloseIntent({ dirty, saving: savingRef.current });
    if (intent === "blocked") return;
    if (intent === "close") { closeEditorSession(); return; }
    setDecision({
      title: "스케치를 닫을까요?",
      helper: "저장하지 않은 변경사항이 사라집니다.",
      cancelAccessibilityLabel: "계속 편집",
      confirmAccessibilityLabel: "저장하지 않고 나가기",
      safeOptionLabel: "계속 편집",
      actionOptionLabel: "저장하지 않고 나가기",
      destructive: true,
      onCancel: () => setDecision(null),
      onConfirm: closeEditorSession,
    });
  }

  return <Modal animationType="slide" onRequestClose={requestClose} presentationStyle="fullScreen" supportedOrientations={WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS} visible={props.visible}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>스케치</Text>
      </View>
      <View style={styles.toolPicker} testID="work-order-sketch-tool-picker">
        <Tool accessibilityLabel="펜 도구" disabled={loading || saving} icon={<PenLine color={tool === "pen" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={17} />} label="펜" onPress={() => selectTool("pen")} selected={tool === "pen"} style={styles.authoringTool} />
        <Tool accessibilityLabel="선 도구" disabled={loading || saving} icon={<Minus color={tool === "line" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={17} />} label="선" onPress={() => selectTool("line")} selected={tool === "line"} style={styles.authoringTool} />
        <Tool accessibilityLabel="화살표 도구" disabled={loading || saving} icon={<ArrowUpRight color={tool === "arrow" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={17} />} label="화살표" onPress={() => selectTool("arrow")} selected={tool === "arrow"} style={styles.authoringTool} />
        <Tool accessibilityLabel="사각형 도구" disabled={loading || saving} icon={<Square color={tool === "rectangle" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={17} />} label="사각형" onPress={() => selectTool("rectangle")} selected={tool === "rectangle"} style={styles.authoringTool} />
        <Tool accessibilityLabel="타원 도구" disabled={loading || saving} icon={<Circle color={tool === "ellipse" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={17} />} label="타원" onPress={() => selectTool("ellipse")} selected={tool === "ellipse"} style={styles.authoringTool} />
        <Tool accessibilityLabel="텍스트 도구" disabled={loading || saving} icon={<Type color={tool === "text" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={17} />} label="텍스트" onPress={() => selectTool("text")} selected={tool === "text"} style={styles.authoringTool} />
      </View>
      <View style={styles.toolbar}>
        <Tool accessibilityLabel="실행 취소" disabled={loading || saving || history.past.length === 0} icon={<Undo2 color={WAFL_THEME.color.deepNavy} size={18} />} label="Undo" onPress={() => updateHistory(undoDrawingScene(historyRef.current))} />
        <Tool accessibilityLabel="다시 실행" disabled={loading || saving || history.future.length === 0} icon={<Redo2 color={WAFL_THEME.color.deepNavy} size={18} />} label="Redo" onPress={() => updateHistory(redoDrawingScene(historyRef.current))} />
        <Tool accessibilityLabel="스케치 모두 지우기" disabled={loading || saving || currentScene.elements.length === 0} icon={<Trash2 color={WAFL_THEME.color.error} size={18} />} label="Clear" onPress={() => updateHistory(commitDrawingScene(historyRef.current, createDrawingScene()))} tone="danger" />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={WAFL_THEME.color.brickOrange} /><Text style={styles.status}>스케치를 불러오고 있습니다.</Text></View> : (
        <View onLayout={onCanvasLayout} style={styles.canvas} testID="work-order-sketch-canvas" {...panResponder.panHandlers}>
          {viewport.width > 1 && viewport.height > 1 ? <SvgDrawingSceneRenderer activePrimitive={activePrimitive} committedFrame={committedFrame} height={viewport.height} onCommittedLayerRender={() => undefined} previewFrame={textPreviewFrame} width={viewport.width} /> : null}
        </View>
      )}
      <View pointerEvents="auto" style={styles.footer} testID="work-order-sketch-footer">
        <View style={styles.footerStatus}>
          <Text style={styles.footerText}>{dirty ? "저장하지 않은 변경사항이 있습니다." : drawingId ? `저장된 스케치 · v${drawingVersion}` : "새 스케치"}</Text>
          {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
        </View>
        <View style={styles.footerActions}>
          <View style={styles.footerAction}>
            <WaflPrimaryActionButton accessibilityLabel="스케치 닫기" disabled={saving} label="닫기" onPress={requestClose} testID="work-order-sketch-close" />
          </View>
          <View style={styles.footerAction}>
            <WaflPrimaryActionButton accessibilityLabel="스케치 저장" disabled={!props.editable || loading || saving || !dirty} label="저장" onPress={() => { void save(); }} pending={saving} testID="work-order-sketch-save" />
          </View>
        </View>
      </View>
      <WaflActionProcessingBlocker helper="잠시만 기다려 주세요." message={saving ? "스케치를 저장 중입니다." : null} testID="work-order-sketch-save-blocker" />
      <WaflDecisionSheet decision={decision} resolveAfterClose testID="work-order-sketch-dirty-exit-decision" />
      <WaflInputSheet
        confirmAccessibilityLabel="텍스트 추가"
        confirmDisabled={(textSession?.draft.trim().length ?? 0) === 0}
        keyboardAutoExpand
        keyboardMode="directInput"
        measurementVariant={`product-sketch-text-${textSession?.id ?? "idle"}`}
        onAfterClose={completeTextSheetClose}
        onAfterOpen={() => presentTextSheet(textSession?.id ?? null)}
        onCancel={cancelText}
        onConfirm={acceptText}
        sizing="adaptiveExpandable"
        title="텍스트 추가"
        visible={textSheetVisible}
        presentationGeneration={textSession?.id}
      >
        <WaflSheetValueField
          label="작업지시 텍스트"
          maxLength={DRAWING_TEXT_MAX_LENGTH}
          onChange={updateTextDraft}
          placeholder="예: 3cm 줄임"
          value={textSession?.draft ?? ""}
        />
      </WaflInputSheet>
    </SafeAreaView>
  </Modal>;
}

function Tool(props: Readonly<{ accessibilityLabel: string; disabled: boolean; icon: ReactNode; label: string; onPress: () => void; selected?: boolean; style?: object; tone?: "danger" }>) {
  return <Pressable accessibilityLabel={props.accessibilityLabel} accessibilityState={{ disabled: props.disabled, selected: props.selected }} disabled={props.disabled} onPress={props.onPress} style={({ pressed }) => [styles.tool, props.style, props.selected && styles.toolPrimary, props.tone === "danger" && styles.toolDanger, props.disabled && styles.disabled, pressed && styles.pressed]}><View style={styles.toolIcon}>{props.icon}</View><Text style={[styles.toolText, props.selected && styles.toolTextPrimary, props.tone === "danger" && styles.toolTextDanger]}>{props.label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1, paddingHorizontal: WAFL_THEME.layout.screenGutterPhone },
  header: { alignItems: "center", justifyContent: "center", minHeight: 52 },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 18 },
  toolPicker: { flexDirection: "row", flexWrap: "wrap", gap: WAFL_THEME.spacing.xs, paddingBottom: WAFL_THEME.spacing.xs },
  toolbar: { flexDirection: "row", gap: WAFL_THEME.spacing.xs, paddingBottom: WAFL_THEME.spacing.sm },
  tool: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.actionTile, borderWidth: WAFL_THEME.border.hairline, flex: 1, flexDirection: "row", gap: 4, justifyContent: "center", minHeight: WAFL_THEME.touch.minimum },
  authoringTool: { flexBasis: 96 },
  toolPrimary: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  toolDanger: { borderColor: "#D9AAA4" },
  toolIcon: { alignItems: "center", justifyContent: "center" },
  toolText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: 10 },
  toolTextPrimary: { color: "#FFFFFF" },
  toolTextDanger: { color: WAFL_THEME.color.error },
  canvas: { backgroundColor: "#FFFDF8", borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardMajor, borderWidth: WAFL_THEME.border.hairline, flex: 1, overflow: "hidden" },
  center: { alignItems: "center", flex: 1, gap: 9, justifyContent: "center" },
  status: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 12 },
  footer: { borderTopColor: WAFL_THEME.color.border, borderTopWidth: WAFL_THEME.border.hairline, gap: WAFL_THEME.spacing.xs, paddingBottom: WAFL_THEME.spacing.sm, paddingTop: WAFL_THEME.spacing.xs },
  footerStatus: { gap: 3, minHeight: 24 },
  footerActions: { flexDirection: "row", gap: WAFL_THEME.spacing.sm },
  footerAction: { flex: 1 },
  footerText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 10 },
  message: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: 10 },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.68 },
});
