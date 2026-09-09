import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ModalProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpRight, BrushCleaning, ChevronDown, Circle, Eraser, Hand, Minus, PenLine, Redo2, Search, Square, Trash2, Type, Undo2 } from "lucide-react-native";

import {
  applyDrawingStrokePartialErasePlan,
  appendDrawingActiveStrokePoint,
  beginDrawingActiveSegment,
  beginDrawingActiveShape,
  beginDrawingActiveStroke,
  beginDrawingCameraGesture,
  cancelDrawingActiveSegment,
  cancelDrawingActiveShape,
  cancelDrawingActiveStroke,
  clampDrawingCamera,
  clampDrawingPointToCanvas,
  commitDrawingScene,
  createDrawingCamera,
  createDrawingCoverCamera,
  createDrawingScene,
  createDrawingSceneHistory,
  createDrawingTextElement,
  DRAWING_CANONICAL_CANVAS,
  DRAWING_TEXT_DEFAULT_FONT_SIZE,
  DRAWING_TEXT_MAX_LENGTH,
  drawingScenesEqual,
  finalizeDrawingActiveSegment,
  finalizeDrawingActiveShape,
  finalizeDrawingActiveStroke,
  isDrawingWorldPointInsideCanvas,
  isDrawingAuthoringViewportGenerationCurrent,
  hitTestDrawingSceneTopmost,
  hitTestDrawingSelectionHandlesScreen,
  planDrawingStrokePartialErase,
  redoDrawingScene,
  removeDrawingElementsById,
  hitTestDrawingSelectedElementPickup,
  replaceDrawingSceneElement,
  resolveDrawingElementTranslation,
  resolveDrawingSelectionMoveDelta,
  resolveDrawingSelectionHandles,
  resolveDrawingSelectionHandleTransform,
  resolveDrawingCameraGestureUpdate,
  resolveDrawingViewportTransform,
  screenToWorld,
  serializeDrawingScene,
  undoDrawingScene,
  updateDrawingActiveSegment,
  updateDrawingActiveShape,
  worldToScreen,
  type DrawingActiveSegment,
  type DrawingActiveShape,
  type DrawingActiveStroke,
  type DrawingCamera,
  type DrawingCameraGesture,
  type DrawingCameraTouch,
  type DrawingElement,
  type DrawingStrokePartialErasePlan,
  type DrawingPoint,
  type DrawingSceneHistory,
  type DrawingSelectionHandleKind,
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
import {
  projectDrawingElement,
  projectDrawingEraserCursor,
  projectDrawingSelectionOutline,
  projectDrawingSelectionHandles,
  projectDrawingTextInsertionPreview,
} from "@/features/drawing-poc/drawingRenderProjection";
import {
  resolveDrawingEraserScreenRadius,
  resolveDrawingEraserWorldRadius,
} from "@/features/drawing-poc/drawingEraserVisualFeedback";
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
import { createDrawingLatestFrameScheduler } from "./drawingCameraFrameCoalescing";
import {
  resolveDrawingRawCameraInputTransition,
  type DrawingRawCameraTouchEvent,
} from "./drawingRawCameraInputLifecycle";
import { formatDrawingZoomPercentLabel } from "./drawingZoomPercent";

const penStyle = Object.freeze({ strokeColor: "#17263D", strokeWidth: 4, fillColor: null });
const annotationStyle = Object.freeze({ strokeColor: "#17263D", strokeWidth: 3, fillColor: null });
const textInsertionCaretStyle = Object.freeze({ strokeColor: WAFL_THEME.color.readOnly, strokeWidth: 2, fillColor: null });
const DRAWING_ERASER_SCREEN_RADIUS = resolveDrawingEraserScreenRadius(WAFL_THEME.touch.minimum);
const DRAWING_SELECTION_MOVE_SCREEN_SLOP = WAFL_THEME.spacing.sm;
const DRAWING_SELECTION_PICKUP_SCREEN_PADDING = WAFL_THEME.spacing.sm;
const DRAWING_SELECTION_HANDLE_VISUAL_RADIUS = WAFL_THEME.spacing.sm;
const DRAWING_SELECTION_HANDLE_TOUCH_RADIUS = WAFL_THEME.touch.minimum / 2;
const WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS: NonNullable<ModalProps["supportedOrientations"]> = [
  "portrait",
];

type SketchTool = "pen" | "line" | "arrow" | "rectangle" | "ellipse" | "text" | "selection" | "eraser";
type SketchAuthoringTool = Exclude<SketchTool, "selection" | "eraser">;
type SelectionMoveGesture = Readonly<{
  baseElement: DrawingElement;
  elementId: string;
  startScreen: DrawingPoint;
  startWorld: DrawingPoint;
  viewportGeneration: number;
}>;
type SelectionTransformGesture = Readonly<{
  baseElement: DrawingElement;
  elementId: string;
  fixedAnchor: DrawingPoint;
  handle: DrawingSelectionHandleKind;
  viewportGeneration: number;
}>;

const AUTHORING_TOOLS: readonly SketchAuthoringTool[] = Object.freeze([
  "pen",
  "line",
  "arrow",
  "rectangle",
  "ellipse",
  "text",
]);

const AUTHORING_TOOL_LABELS: Readonly<Record<SketchAuthoringTool, string>> = Object.freeze({
  arrow: "화살표",
  ellipse: "타원",
  line: "선",
  pen: "펜",
  rectangle: "사각형",
  text: "텍스트",
});

function isAuthoringTool(tool: SketchTool): tool is SketchAuthoringTool {
  return tool !== "selection" && tool !== "eraser";
}

type SaveIdentity = Readonly<{ clientRequestId: string; idempotencyKey: string }>;

function newHistory() {
  return createDrawingSceneHistory(createDrawingScene());
}

function drawingTouchesFromEvent(event: GestureResponderEvent): readonly DrawingCameraTouch[] {
  return Object.freeze(event.nativeEvent.touches.map((touch) => Object.freeze({
    identifier: touch.identifier,
    localX: touch.locationX,
    localY: touch.locationY,
    pageX: touch.pageX,
    pageY: touch.pageY,
  })));
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
  const [lastAuthoringTool, setLastAuthoringTool] = useState<SketchAuthoringTool>("pen");
  const [drawingToolMenuVisible, setDrawingToolMenuVisible] = useState(false);
  const [activeStroke, setActiveStroke] = useState<DrawingActiveStroke | null>(null);
  const [activeSegment, setActiveSegment] = useState<DrawingActiveSegment | null>(null);
  const [activeShape, setActiveShape] = useState<DrawingActiveShape | null>(null);
  const [textSheetVisible, setTextSheetVisible] = useState(false);
  const [textSession, setTextSession] = useState<WorkOrderSketchTextSession | null>(null);
  const [camera, setCamera] = useState<DrawingCamera>(createDrawingCamera);
  const [viewport, setViewport] = useState<DrawingViewport>({ width: 1, height: 1 });
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [drawingVersion, setDrawingVersion] = useState(0);
  const [baseline, setBaseline] = useState(serializeDrawingScene(createDrawingScene()));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [decision, setDecision] = useState<WaflActionConfirmationState | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectionMovePreviewScene, setSelectionMovePreviewScene] = useState<ReturnType<typeof createDrawingScene> | null>(null);
  const [eraserCursorWorld, setEraserCursorWorld] = useState<DrawingPoint | null>(null);
  const [eraserRadiusWorld, setEraserRadiusWorld] = useState(DRAWING_ERASER_SCREEN_RADIUS);
  const [eraserPreviewScene, setEraserPreviewScene] = useState<ReturnType<typeof createDrawingScene> | null>(null);
  const [cameraFrameScheduler] = useState(() => createDrawingLatestFrameScheduler<DrawingCamera>({
    cancelFrame: cancelAnimationFrame,
    render: setCamera,
    requestFrame: requestAnimationFrame,
  }));
  const historyRef = useRef(history);
  const cameraRef = useRef(camera);
  const viewportRef = useRef(viewport);
  const activeStrokeRef = useRef<DrawingActiveStroke | null>(null);
  const activeSegmentRef = useRef<DrawingActiveSegment | null>(null);
  const activeShapeRef = useRef<DrawingActiveShape | null>(null);
  const selectedElementIdRef = useRef<string | null>(null);
  const selectionMoveGestureRef = useRef<SelectionMoveGesture | null>(null);
  const selectionTransformGestureRef = useRef<SelectionTransformGesture | null>(null);
  const eraserTrailRef = useRef<readonly DrawingPoint[]>(Object.freeze([]));
  const eraserRadiusWorldRef = useRef(DRAWING_ERASER_SCREEN_RADIUS);
  const viewportGenerationRef = useRef(0);
  const activeGestureViewportGenerationRef = useRef<number | null>(null);
  const cameraGestureRef = useRef<DrawingCameraGesture | null>(null);
  const cameraInputActiveRef = useRef(false);
  const suppressOneFingerUntilReleaseRef = useRef(false);
  const initialCoverPendingRef = useRef(false);
  const viewportMeasuredRef = useRef(false);
  const selectionBeforeOneFingerGestureRef = useRef<string | null>(null);
  const selectionSnapshotActiveRef = useRef(false);
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
  const transform = useMemo(() => resolveDrawingViewportTransform(camera, viewport), [camera, viewport]);
  const zoomPercentLabel = useMemo(() => formatDrawingZoomPercentLabel(camera.zoom), [camera.zoom]);
  const paperScreenRect = useMemo(() => {
    const topLeft = worldToScreen({ x: 0, y: 0 }, camera, viewport);
    const bottomRight = worldToScreen({
      x: DRAWING_CANONICAL_CANVAS.width,
      y: DRAWING_CANONICAL_CANVAS.height,
    }, camera, viewport);
    return Object.freeze({
      height: bottomRight.y - topLeft.y,
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
    });
  }, [camera, viewport]);
  const displayedScene = selectionMovePreviewScene ?? eraserPreviewScene ?? currentScene;
  const committedFrame = useMemo(() => svgDrawingRendererAdapter.render({ scene: displayedScene, transform }), [displayedScene, transform]);
  const selectedElement = useMemo(
    () => currentScene.elements.find((element) => element.id === selectedElementId) ?? null,
    [currentScene, selectedElementId],
  );
  const displayedSelectedElement = useMemo(
    () => displayedScene.elements.find((element) => element.id === selectedElementId) ?? null,
    [displayedScene, selectedElementId],
  );
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
  const eraserPreviewFrame = useMemo(() => Object.freeze([
    ...(eraserCursorWorld === null ? [] : [projectDrawingEraserCursor(
      eraserCursorWorld,
      transform,
      WAFL_THEME.color.editActive,
      eraserRadiusWorld,
    )]),
  ]), [eraserCursorWorld, eraserRadiusWorld, transform]);
  const transientPreviewFrame = useMemo(() => Object.freeze([
    ...(displayedSelectedElement ? [projectDrawingSelectionOutline(displayedSelectedElement, transform, WAFL_THEME.color.brickOrange)] : []),
    ...(displayedSelectedElement ? projectDrawingSelectionHandles(displayedSelectedElement, transform, {
      fillColor: WAFL_THEME.color.paper,
      screenRadius: DRAWING_SELECTION_HANDLE_VISUAL_RADIUS,
      strokeColor: WAFL_THEME.color.brickOrange,
    }) : []),
    ...eraserPreviewFrame,
    ...textPreviewFrame,
  ]), [displayedSelectedElement, eraserPreviewFrame, textPreviewFrame, transform]);

  const setCurrentCamera = useCallback((next: DrawingCamera) => {
    cameraFrameScheduler.cancel();
    cameraRef.current = next;
    setCamera(next);
  }, [cameraFrameScheduler]);

  const projectCurrentCamera = useCallback((next: DrawingCamera) => {
    cameraRef.current = next;
    cameraFrameScheduler.schedule(next);
  }, [cameraFrameScheduler]);

  const applyInitialCoverIfPending = useCallback((nextViewport: DrawingViewport) => {
    if (!initialCoverPendingRef.current || nextViewport.width <= 0 || nextViewport.height <= 0) return false;
    initialCoverPendingRef.current = false;
    setCurrentCamera(createDrawingCoverCamera(nextViewport));
    return true;
  }, [setCurrentCamera]);

  useEffect(() => {
    if (!props.visible) return;
    const generation = openGenerationRef.current + 1;
    openGenerationRef.current = generation;
    parentCloseGuardRef.current.reset();
    async function load() {
      await Promise.resolve();
      if (generation !== openGenerationRef.current) return;
      initialCoverPendingRef.current = true;
      const fitCamera = createDrawingCamera();
      setCurrentCamera(fitCamera);
      if (viewportMeasuredRef.current) applyInitialCoverIfPending(viewportRef.current);
      setLoading(true);
      setMessage(null);
      setDecision(null);
      activeStrokeRef.current = null;
      activeSegmentRef.current = null;
      activeShapeRef.current = null;
      cameraGestureRef.current = null;
      cameraInputActiveRef.current = false;
      suppressOneFingerUntilReleaseRef.current = false;
      selectionBeforeOneFingerGestureRef.current = null;
      selectionSnapshotActiveRef.current = false;
      selectedElementIdRef.current = null;
      selectionMoveGestureRef.current = null;
      selectionTransformGestureRef.current = null;
      eraserTrailRef.current = Object.freeze([]);
      setEraserPreviewScene(null);
      setEraserCursorWorld(null);
      setDrawingToolMenuVisible(false);
      activeGestureViewportGenerationRef.current = null;
      setActiveStroke(null);
      setActiveSegment(null);
      setActiveShape(null);
      setSelectedElementId(null);
      setSelectionMovePreviewScene(null);
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
    return () => {
      openGenerationRef.current += 1;
      cameraFrameScheduler.cancel();
    };
  }, [applyInitialCoverIfPending, cameraFrameScheduler, props.visible, props.workOrderId, setCurrentCamera]);

  useEffect(() => () => cameraFrameScheduler.cancel(), [cameraFrameScheduler]);

  function updateHistory(next: DrawingSceneHistory) {
    historyRef.current = next;
    setHistory(next);
  }

  function clearSelection() {
    selectedElementIdRef.current = null;
    setSelectedElementId(null);
  }

  function selectElement(id: string | null) {
    selectedElementIdRef.current = id;
    setSelectedElementId(id);
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

  function clearEraserVisualFeedback() {
    eraserTrailRef.current = Object.freeze([]);
    setEraserPreviewScene(null);
    setEraserCursorWorld(null);
  }

  function clearSelectionMovePreview() {
    selectionMoveGestureRef.current = null;
    setSelectionMovePreviewScene(null);
  }

  function clearSelectionTransformPreview() {
    selectionTransformGestureRef.current = null;
    setSelectionMovePreviewScene(null);
  }

  function discardActiveGesture() {
    discardActiveStroke();
    discardActiveSegment();
    discardActiveShape();
    activeGestureViewportGenerationRef.current = null;
    pendingTextAnchorRef.current = null;
    clearEraserVisualFeedback();
    clearSelectionMovePreview();
    clearSelectionTransformPreview();
  }

  function endCameraGesture() {
    cameraFrameScheduler.flush();
    cameraGestureRef.current = null;
    cameraInputActiveRef.current = false;
  }

  function releaseCameraSuppression() {
    suppressOneFingerUntilReleaseRef.current = false;
    selectionBeforeOneFingerGestureRef.current = null;
    selectionSnapshotActiveRef.current = false;
  }

  function cancelAllTransientGestures() {
    discardActiveGesture();
    if (cameraInputActiveRef.current) endCameraGesture();
    if (!suppressOneFingerUntilReleaseRef.current) releaseCameraSuppression();
  }

  function beginRawCameraGesture(touches: readonly DrawingCameraTouch[]) {
    if (touches.length < 2) return;
    cameraGestureRef.current = beginDrawingCameraGesture({
      camera: cameraRef.current,
      touches,
      viewport: viewportRef.current,
      viewportGeneration: viewportGenerationRef.current,
    });
  }

  function updateRawCameraGesture(touches: readonly DrawingCameraTouch[]) {
    if (!cameraInputActiveRef.current || touches.length < 2) return;
    let gesture = cameraGestureRef.current;
    if (gesture === null) {
      gesture = beginDrawingCameraGesture({
        camera: cameraRef.current,
        touches,
        viewport: viewportRef.current,
        viewportGeneration: viewportGenerationRef.current,
      });
      cameraGestureRef.current = gesture;
    }
    if (gesture === null) return;
    const update = resolveDrawingCameraGestureUpdate({
      gesture,
      touches,
      viewport: viewportRef.current,
      viewportGeneration: viewportGenerationRef.current,
    });
    if (update !== null) {
      projectCurrentCamera(update.camera);
      cameraGestureRef.current = update.gesture;
      return;
    }
    cameraGestureRef.current = beginDrawingCameraGesture({
      camera: cameraRef.current,
      touches,
      viewport: viewportRef.current,
      viewportGeneration: viewportGenerationRef.current,
    });
  }

  function captureSelectionBeforeOneFingerGesture() {
    if (selectionSnapshotActiveRef.current) return;
    selectionBeforeOneFingerGestureRef.current = selectedElementIdRef.current;
    selectionSnapshotActiveRef.current = true;
  }

  function handleRawCameraTouch(eventType: DrawingRawCameraTouchEvent, event: GestureResponderEvent) {
    const touches = drawingTouchesFromEvent(event);
    if (eventType === "start" && touches.length === 1) captureSelectionBeforeOneFingerGesture();
    if (eventType === "start" && touches.length >= 2) captureSelectionBeforeOneFingerGesture();

    const transition = resolveDrawingRawCameraInputTransition({
      activeTouchCount: touches.length,
      event: eventType,
      state: {
        cameraActive: cameraInputActiveRef.current,
        suppressionActive: suppressOneFingerUntilReleaseRef.current,
      },
    });

    if (transition.cancelOneFingerTransient) {
      if (selectedElementIdRef.current !== selectionBeforeOneFingerGestureRef.current) {
        selectElement(selectionBeforeOneFingerGestureRef.current);
      }
      discardActiveGesture();
    }

    cameraInputActiveRef.current = transition.nextState.cameraActive;
    suppressOneFingerUntilReleaseRef.current = transition.nextState.suppressionActive;

    if (transition.endCamera) endCameraGesture();
    if (transition.acquireCamera) beginRawCameraGesture(touches);
    if (transition.updateCamera) updateRawCameraGesture(touches);
    if (transition.releaseSuppression) releaseCameraSuppression();
  }

  function handleRawCameraTouchStart(event: GestureResponderEvent) {
    handleRawCameraTouch("start", event);
  }

  function handleRawCameraTouchMove(event: GestureResponderEvent) {
    handleRawCameraTouch("move", event);
  }

  function handleRawCameraTouchEnd(event: GestureResponderEvent) {
    handleRawCameraTouch("end", event);
  }

  function handleRawCameraTouchCancel(event: GestureResponderEvent) {
    handleRawCameraTouch("cancel", event);
  }

  function commitElement(element: DrawingElement) {
    updateHistory(commitDrawingScene(
      historyRef.current,
      createDrawingScene([...historyRef.current.current.elements, element]),
    ));
  }

  function makeElementId(kind: "arrow" | "ellipse" | "line" | "rectangle" | "stroke" | "text") {
    // eslint-disable-next-line react-hooks/purity -- IDs are allocated only from user-event handlers.
    return `${kind}:${Date.now()}:${sequenceRef.current += 1}`;
  }

  function selectTool(next: SketchTool) {
    setDrawingToolMenuVisible(false);
    if (next === toolRef.current) return;
    cancelAllTransientGestures();
    if (textSessionRef.current !== null) cancelText();
    if (next !== "selection") clearSelection();
    if (isAuthoringTool(next)) setLastAuthoringTool(next);
    toolRef.current = next;
    setTool(next);
  }

  function toggleDrawingToolMenu() {
    cancelAllTransientGestures();
    setDrawingToolMenuVisible((visible) => !visible);
  }

  function extendEraserGesture(point: DrawingPoint, present = true): DrawingStrokePartialErasePlan {
    const previous = eraserTrailRef.current[eraserTrailRef.current.length - 1];
    const trail = previous && previous.x === point.x && previous.y === point.y
      ? eraserTrailRef.current
      : Object.freeze([...eraserTrailRef.current, point]);
    eraserTrailRef.current = trail;
    const scene = historyRef.current.current;
    const plan = planDrawingStrokePartialErase(scene, trail, { radius: eraserRadiusWorldRef.current });
    if (present) {
      setEraserCursorWorld(point);
      setEraserPreviewScene(plan.changed
        ? applyDrawingStrokePartialErasePlan(
          scene,
          plan,
          (originalId, fragmentIndex) => `eraser-preview:${fragmentIndex}:${originalId.slice(0, 88)}`,
        )
        : null);
    }
    return plan;
  }

  function commitEraserGesture(plan: DrawingStrokePartialErasePlan) {
    const scene = historyRef.current.current;
    clearEraserVisualFeedback();
    if (!plan.changed) return;
    const nextScene = applyDrawingStrokePartialErasePlan(
      scene,
      plan,
      () => makeElementId("stroke"),
    );
    updateHistory(commitDrawingScene(historyRef.current, nextScene));
    clearSelection();
  }

  function deleteSelectedElement() {
    const selectedId = selectedElementIdRef.current;
    if (selectedId === null) return;
    const nextScene = removeDrawingElementsById(historyRef.current.current, new Set([selectedId]));
    updateHistory(commitDrawingScene(historyRef.current, nextScene));
    clearSelection();
  }

  function undo() {
    cancelAllTransientGestures();
    const next = undoDrawingScene(historyRef.current);
    updateHistory(next);
    const selectedId = selectedElementIdRef.current;
    if (selectedId !== null && !next.current.elements.some((element) => element.id === selectedId)) clearSelection();
  }

  function redo() {
    cancelAllTransientGestures();
    const next = redoDrawingScene(historyRef.current);
    updateHistory(next);
    const selectedId = selectedElementIdRef.current;
    if (selectedId !== null && !next.current.elements.some((element) => element.id === selectedId)) clearSelection();
  }

  function clearScene() {
    updateHistory(commitDrawingScene(historyRef.current, createDrawingScene()));
    clearSelection();
  }

  function worldPointFromEvent(locationX: number, locationY: number) {
    return clampDrawingPointToCanvas(screenToWorld(
      { x: locationX, y: locationY },
      cameraRef.current,
      viewportRef.current,
    ));
  }

  function rawWorldPointFromEvent(locationX: number, locationY: number) {
    return screenToWorld(
      { x: locationX, y: locationY },
      cameraRef.current,
      viewportRef.current,
    );
  }

  function planSelectionMove(locationX: number, locationY: number) {
    const gesture = selectionMoveGestureRef.current;
    if (!gesture || gesture.viewportGeneration !== viewportGenerationRef.current) return null;
    const delta = resolveDrawingSelectionMoveDelta({
      currentScreen: { x: locationX, y: locationY },
      currentWorld: rawWorldPointFromEvent(locationX, locationY),
      minimumScreenDistance: DRAWING_SELECTION_MOVE_SCREEN_SLOP,
      startScreen: gesture.startScreen,
      startWorld: gesture.startWorld,
    });
    if (delta === null) return null;
    const translation = resolveDrawingElementTranslation(gesture.baseElement, delta);
    if (!translation.changed) return null;
    const scene = historyRef.current.current;
    if (!scene.elements.some((element) => element.id === gesture.elementId)) return null;
    return replaceDrawingSceneElement(scene, gesture.elementId, translation.element);
  }

  function planSelectionTransform(locationX: number, locationY: number) {
    const gesture = selectionTransformGestureRef.current;
    if (!gesture || gesture.viewportGeneration !== viewportGenerationRef.current) return null;
    const transformResult = resolveDrawingSelectionHandleTransform({
      element: gesture.baseElement,
      handle: gesture.handle,
      pointerWorld: rawWorldPointFromEvent(locationX, locationY),
    });
    if (transformResult === null || !transformResult.changed) return null;
    if (
      transformResult.fixedAnchor.x !== gesture.fixedAnchor.x
      || transformResult.fixedAnchor.y !== gesture.fixedAnchor.y
    ) return null;
    const scene = historyRef.current.current;
    if (!scene.elements.some((element) => element.id === gesture.elementId)) return null;
    return replaceDrawingSceneElement(scene, gesture.elementId, transformResult.element);
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
    onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length === 1
      && !cameraInputActiveRef.current
      && !suppressOneFingerUntilReleaseRef.current
      && editableRef.current
      && !savingRef.current
      && textSessionRef.current === null,
    onMoveShouldSetPanResponder: (event) => event.nativeEvent.touches.length === 1
      && !cameraInputActiveRef.current
      && !suppressOneFingerUntilReleaseRef.current
      && editableRef.current
      && !savingRef.current
      && textSessionRef.current === null,
    onPanResponderGrant: (event) => {
      if (
        event.nativeEvent.touches.length !== 1
        || cameraInputActiveRef.current
        || suppressOneFingerUntilReleaseRef.current
      ) return;
      captureSelectionBeforeOneFingerGesture();
      const rawPoint = rawWorldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY);
      if (toolRef.current === "selection") {
        const scene = historyRef.current.current;
        const selectedElement = selectedElementIdRef.current === null
          ? null
          : scene.elements.find((element) => element.id === selectedElementIdRef.current) ?? null;
        if (selectedElement !== null) {
          const handleHit = hitTestDrawingSelectionHandlesScreen({
            handles: resolveDrawingSelectionHandles(selectedElement),
            point: { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY },
            screenRadius: DRAWING_SELECTION_HANDLE_TOUCH_RADIUS,
            transform: resolveDrawingViewportTransform(cameraRef.current, viewportRef.current),
          });
          if (handleHit !== null) {
            const initialTransform = resolveDrawingSelectionHandleTransform({
              element: selectedElement,
              handle: handleHit.handle.kind,
              pointerWorld: handleHit.handle.anchor,
            });
            if (initialTransform !== null) {
              activeGestureViewportGenerationRef.current = viewportGenerationRef.current;
              selectionMoveGestureRef.current = null;
              selectionTransformGestureRef.current = Object.freeze({
                baseElement: selectedElement,
                elementId: selectedElement.id,
                fixedAnchor: initialTransform.fixedAnchor,
                handle: handleHit.handle.kind,
                viewportGeneration: viewportGenerationRef.current,
              });
              setSelectionMovePreviewScene(null);
              return;
            }
          }
        }
      }
      if (!isDrawingWorldPointInsideCanvas(rawPoint)) {
        activeGestureViewportGenerationRef.current = null;
        pendingTextAnchorRef.current = null;
        if (toolRef.current === "selection") clearSelection();
        return;
      }
      const point = clampDrawingPointToCanvas(rawPoint);
      activeGestureViewportGenerationRef.current = viewportGenerationRef.current;
      if (toolRef.current === "text") {
        pendingTextAnchorRef.current = point;
        return;
      }
      if (toolRef.current === "selection") {
        const scene = historyRef.current.current;
        const actualHit = hitTestDrawingSceneTopmost(scene, point);
        const selectedElement = selectedElementIdRef.current === null
          ? null
          : scene.elements.find((element) => element.id === selectedElementIdRef.current) ?? null;
        const selectedPickup = actualHit === null
          && selectedElement !== null
          && hitTestDrawingSelectedElementPickup(
            selectedElement,
            point,
            DRAWING_SELECTION_PICKUP_SCREEN_PADDING,
            resolveDrawingViewportTransform(cameraRef.current, viewportRef.current).scale,
          );
        const moveTarget = actualHit ?? (selectedPickup ? selectedElement : null);
        selectElement(moveTarget?.id ?? null);
        selectionTransformGestureRef.current = null;
        selectionMoveGestureRef.current = moveTarget ? Object.freeze({
          baseElement: moveTarget,
          elementId: moveTarget.id,
          startScreen: Object.freeze({ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }),
          startWorld: rawWorldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY),
          viewportGeneration: viewportGenerationRef.current,
        }) : null;
        setSelectionMovePreviewScene(null);
        return;
      }
      if (toolRef.current === "eraser") {
        clearEraserVisualFeedback();
        const radius = resolveDrawingEraserWorldRadius(
          DRAWING_ERASER_SCREEN_RADIUS,
          resolveDrawingViewportTransform(cameraRef.current, viewportRef.current).scale,
        );
        eraserRadiusWorldRef.current = radius;
        setEraserRadiusWorld(radius);
        extendEraserGesture(point);
        return;
      }
      if (toolRef.current === "line" || toolRef.current === "arrow") {
        const segment = beginDrawingActiveSegment({ id: makeElementId(toolRef.current), kind: toolRef.current, point, style: annotationStyle });
        activeSegmentRef.current = segment;
        setActiveSegment(segment);
        return;
      }
      if (toolRef.current === "rectangle" || toolRef.current === "ellipse") {
        const shape = beginDrawingActiveShape({ id: makeElementId(toolRef.current), kind: toolRef.current, point, style: annotationStyle });
        activeShapeRef.current = shape;
        setActiveShape(shape);
        return;
      }
      const stroke = beginDrawingActiveStroke({ id: makeElementId("stroke"), point, style: penStyle });
      activeStrokeRef.current = stroke;
      setActiveStroke(stroke);
    },
    onPanResponderMove: (event) => {
      if (
        event.nativeEvent.touches.length !== 1
        || cameraInputActiveRef.current
        || suppressOneFingerUntilReleaseRef.current
      ) return;
      if (!activeGestureUsesCurrentViewport()) {
        discardActiveGesture();
        return;
      }
      if (toolRef.current === "selection") {
        if (selectionTransformGestureRef.current === null) {
          setSelectionMovePreviewScene(planSelectionMove(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          ));
        } else {
          setSelectionMovePreviewScene(planSelectionTransform(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          ));
        }
        return;
      }
      if (toolRef.current === "eraser") {
        extendEraserGesture(worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY));
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
      if (cameraInputActiveRef.current || suppressOneFingerUntilReleaseRef.current) return;
      releaseCameraSuppression();
      if (!activeGestureUsesCurrentViewport()) {
        discardActiveGesture();
        return;
      }
      activeGestureViewportGenerationRef.current = null;
      if (toolRef.current === "selection") {
        const nextScene = (selectionTransformGestureRef.current === null
          ? planSelectionMove
          : planSelectionTransform)(event.nativeEvent.locationX, event.nativeEvent.locationY);
        clearSelectionMovePreview();
        clearSelectionTransformPreview();
        if (nextScene !== null) updateHistory(commitDrawingScene(historyRef.current, nextScene));
        return;
      }
      if (toolRef.current === "eraser") {
        const plan = extendEraserGesture(
          worldPointFromEvent(event.nativeEvent.locationX, event.nativeEvent.locationY),
          false,
        );
        commitEraserGesture(plan);
        return;
      }
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
    onPanResponderTerminate: () => {
      if (cameraInputActiveRef.current || suppressOneFingerUntilReleaseRef.current) return;
      cancelAllTransientGestures();
    },
  }));

  async function acceptText() {
    const session = textSessionRef.current;
    if (!session || session.phase !== "presented") return;
    const element = createDrawingTextElement({
      id: makeElementId("text"),
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

  function onWorkbenchLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    const next = { width, height };
    const current = viewportRef.current;
    if (Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5) return;
    viewportGenerationRef.current += 1;
    cameraFrameScheduler.cancel();
    cancelAllTransientGestures();
    viewportMeasuredRef.current = true;
    viewportRef.current = next;
    setViewport(next);
    if (!applyInitialCoverIfPending(next)) setCurrentCamera(clampDrawingCamera(cameraRef.current, next));
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
    cancelAllTransientGestures();
    setDecision(null);
    cameraFrameScheduler.cancel();
    clearSelection();
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
      {drawingToolMenuVisible ? <Pressable
          accessibilityLabel="그리기 도구 목록 닫기"
          accessibilityRole="button"
          onPress={() => setDrawingToolMenuVisible(false)}
          style={styles.drawingToolDismissLayer}
          testID="work-order-sketch-drawing-tool-menu-dismiss-layer"
      /> : null}
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>스케치</Text>
        </View>
        <View style={styles.toolbar} testID="work-order-sketch-compact-toolbar">
          <View style={styles.drawingToolSelectorAnchor}>
            <IconTool
              accessibilityLabel={`그리기 도구: ${AUTHORING_TOOL_LABELS[lastAuthoringTool]}`}
              disabled={loading || saving}
              icon={<View style={styles.drawingToolIcon}>{renderSketchToolIcon(lastAuthoringTool, isAuthoringTool(tool) ? "#FFFFFF" : WAFL_THEME.color.deepNavy, 19)}<ChevronDown color={isAuthoringTool(tool) ? "#FFFFFF" : WAFL_THEME.color.readOnly} size={11} /></View>}
              onPress={toggleDrawingToolMenu}
              selected={isAuthoringTool(tool)}
              testID="work-order-sketch-drawing-tool-selector"
            />
            {drawingToolMenuVisible ? <View accessibilityLabel="그리기 도구 목록" style={styles.drawingToolMenu} testID="work-order-sketch-drawing-tool-menu">
              {AUTHORING_TOOLS.map((candidate) => <DrawingToolMenuItem
                disabled={loading || saving}
                key={candidate}
                label={AUTHORING_TOOL_LABELS[candidate]}
                onPress={() => selectTool(candidate)}
                selected={tool === candidate}
                tool={candidate}
              />)}
            </View> : null}
          </View>
          <IconTool accessibilityLabel="선택 및 이동" disabled={loading || saving} icon={<Hand color={tool === "selection" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={19} />} onPress={() => selectTool("selection")} selected={tool === "selection"} testID="work-order-sketch-selection-tool" />
          <IconTool accessibilityLabel="지우개" disabled={loading || saving} icon={<Eraser color={tool === "eraser" ? "#FFFFFF" : WAFL_THEME.color.deepNavy} size={19} />} onPress={() => selectTool("eraser")} selected={tool === "eraser"} testID="work-order-sketch-eraser-tool" />
          <IconTool accessibilityLabel="실행 취소" disabled={loading || saving || history.past.length === 0} icon={<Undo2 color={WAFL_THEME.color.deepNavy} size={19} />} onPress={undo} testID="work-order-sketch-undo" />
          <IconTool accessibilityLabel="다시 실행" disabled={loading || saving || history.future.length === 0} icon={<Redo2 color={WAFL_THEME.color.deepNavy} size={19} />} onPress={redo} testID="work-order-sketch-redo" />
          <IconTool accessibilityLabel="선택 객체 삭제" danger disabled={loading || saving || selectedElement === null} icon={<Trash2 color={WAFL_THEME.color.error} size={19} />} onPress={deleteSelectedElement} testID="work-order-sketch-delete-selected" />
          <IconTool accessibilityLabel="전체 지우기" danger disabled={loading || saving || currentScene.elements.length === 0} icon={<BrushCleaning color={WAFL_THEME.color.error} size={19} />} onPress={clearScene} testID="work-order-sketch-clear-all" />
        </View>
        {loading ? <View style={styles.center}><ActivityIndicator color={WAFL_THEME.color.brickOrange} /><Text style={styles.status}>스케치를 불러오고 있습니다.</Text></View> : (
          <View
            onLayout={onWorkbenchLayout}
            onTouchCancel={handleRawCameraTouchCancel}
            onTouchEnd={handleRawCameraTouchEnd}
            onTouchMove={handleRawCameraTouchMove}
            onTouchStart={handleRawCameraTouchStart}
            style={styles.canvasStage}
            testID="work-order-sketch-canvas-stage"
            {...panResponder.panHandlers}
          >
            {viewport.width > 1 && viewport.height > 1 ? <>
              <View
                pointerEvents="none"
                style={[styles.canvasSurface, paperScreenRect]}
                testID="work-order-sketch-canvas"
              />
              <View pointerEvents="none" style={styles.canvasRenderer}>
                <SvgDrawingSceneRenderer activePrimitive={activePrimitive} committedFrame={committedFrame} height={viewport.height} onCommittedLayerRender={() => undefined} previewFrame={transientPreviewFrame} width={viewport.width} />
              </View>
            </> : null}
          </View>
        )}
        <View pointerEvents="auto" style={styles.footer} testID="work-order-sketch-footer">
          <View style={styles.footerStatus}>
            <Text numberOfLines={1} style={styles.footerText}>{dirty ? "저장하지 않은 변경사항이 있습니다." : drawingId ? `저장된 스케치 · v${drawingVersion}` : "새 스케치"}</Text>
            {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
          </View>
          <View
            accessibilityLabel={`현재 확대 배율 ${zoomPercentLabel}`}
            accessible
            pointerEvents="none"
            style={styles.zoomHud}
            testID="work-order-sketch-zoom-percent-hud"
          >
            <Search color={WAFL_THEME.color.readOnly} size={13} />
            <Text style={styles.zoomHudText}>{zoomPercentLabel}</Text>
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

function renderSketchToolIcon(tool: SketchAuthoringTool, color: string, size: number) {
  if (tool === "pen") return <PenLine color={color} size={size} />;
  if (tool === "line") return <Minus color={color} size={size} />;
  if (tool === "arrow") return <ArrowUpRight color={color} size={size} />;
  if (tool === "rectangle") return <Square color={color} size={size} />;
  if (tool === "ellipse") return <Circle color={color} size={size} />;
  return <Type color={color} size={size} />;
}

function IconTool(props: Readonly<{
  accessibilityLabel: string;
  danger?: boolean;
  disabled: boolean;
  icon: ReactNode;
  onPress: () => void;
  selected?: boolean;
  testID: string;
}>) {
  return <Pressable
    accessibilityLabel={props.accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled: props.disabled, selected: props.selected }}
    disabled={props.disabled}
    onPress={props.onPress}
    style={({ pressed }) => [styles.iconTool, props.selected && styles.toolPrimary, props.danger && styles.toolDanger, props.disabled && styles.disabled, pressed && styles.pressed]}
    testID={props.testID}
  >{props.icon}</Pressable>;
}

function DrawingToolMenuItem(props: Readonly<{
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
  tool: SketchAuthoringTool;
}>) {
  const color = props.selected ? "#FFFFFF" : WAFL_THEME.color.deepNavy;
  return <Pressable
    accessibilityLabel={`${props.label} 도구`}
    accessibilityRole="button"
    accessibilityState={{ disabled: props.disabled, selected: props.selected }}
    disabled={props.disabled}
    onPress={props.onPress}
    style={({ pressed }) => [styles.drawingToolMenuItem, props.selected && styles.toolPrimary, props.disabled && styles.disabled, pressed && styles.pressed]}
  >
    {renderSketchToolIcon(props.tool, color, 18)}
  </Pressable>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1, gap: WAFL_THEME.spacing.xs, paddingBottom: WAFL_THEME.spacing.sm, paddingHorizontal: WAFL_THEME.layout.screenGutterPhone, position: "relative" },
  header: { alignItems: "center", justifyContent: "center", minHeight: WAFL_THEME.touch.minimum },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 18 },
  toolbar: { flexDirection: "row", gap: WAFL_THEME.spacing.xs, zIndex: 30 },
  iconTool: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.actionTile, borderWidth: WAFL_THEME.border.hairline, flex: 1, justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, minWidth: 0 },
  drawingToolIcon: { alignItems: "center", flexDirection: "row", gap: 1, justifyContent: "center" },
  drawingToolSelectorAnchor: { flex: 1, minWidth: 0, position: "relative", zIndex: 40 },
  drawingToolDismissLayer: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  drawingToolMenu: { backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.card, borderWidth: WAFL_THEME.border.hairline, gap: WAFL_THEME.spacing.xs, left: 0, padding: WAFL_THEME.spacing.xs, position: "absolute", right: 0, top: WAFL_THEME.touch.minimum + WAFL_THEME.spacing.xs, zIndex: 50 },
  drawingToolMenuItem: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.actionTile, borderWidth: WAFL_THEME.border.hairline, justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, minWidth: WAFL_THEME.touch.minimum },
  toolPrimary: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  toolDanger: { borderColor: "#D9AAA4" },
  canvasStage: { backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardMajor, borderWidth: WAFL_THEME.border.hairline, flex: 1, minHeight: 0, overflow: "hidden", position: "relative", width: "100%" },
  canvasSurface: { backgroundColor: "#FFFDF8", borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardMajor, borderWidth: WAFL_THEME.border.hairline, overflow: "hidden", position: "absolute" },
  canvasRenderer: { ...StyleSheet.absoluteFillObject },
  center: { alignItems: "center", flex: 1, gap: WAFL_THEME.spacing.sm, justifyContent: "center" },
  status: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 12 },
  footer: { borderTopColor: WAFL_THEME.color.border, borderTopWidth: WAFL_THEME.border.hairline, gap: WAFL_THEME.spacing.xs, paddingTop: WAFL_THEME.spacing.xs },
  footerStatus: { gap: 2 },
  zoomHud: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.spacing.xs, justifyContent: "center", minHeight: 16 },
  zoomHudText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 14 },
  footerActions: { flexDirection: "row", gap: WAFL_THEME.spacing.sm },
  footerAction: { flex: 1 },
  footerText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 10 },
  message: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: 10 },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.68 },
});
