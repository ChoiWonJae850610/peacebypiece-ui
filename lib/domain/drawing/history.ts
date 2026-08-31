import type { DrawingSceneV1 } from "./contracts";
import { cloneDrawingScene, drawingScenesEqual } from "./scene";

export const DEFAULT_DRAWING_HISTORY_CAPACITY = 50;

export type DrawingSceneHistory = Readonly<{
  capacity: number;
  past: readonly DrawingSceneV1[];
  current: DrawingSceneV1;
  future: readonly DrawingSceneV1[];
}>;

function requireCapacity(capacity: number): number {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new RangeError("Drawing history capacity must be a positive integer.");
  }
  return capacity;
}

function createHistoryState(
  capacity: number,
  past: readonly DrawingSceneV1[],
  current: DrawingSceneV1,
  future: readonly DrawingSceneV1[],
): DrawingSceneHistory {
  return Object.freeze({
    capacity,
    past: Object.freeze([...past]),
    current,
    future: Object.freeze([...future]),
  });
}

export function createDrawingSceneHistory(
  initialScene: DrawingSceneV1,
  capacity = DEFAULT_DRAWING_HISTORY_CAPACITY,
): DrawingSceneHistory {
  return createHistoryState(requireCapacity(capacity), [], cloneDrawingScene(initialScene), []);
}

export function commitDrawingScene(
  history: DrawingSceneHistory,
  nextScene: DrawingSceneV1,
): DrawingSceneHistory {
  const canonicalNext = cloneDrawingScene(nextScene);
  if (drawingScenesEqual(history.current, canonicalNext)) return history;
  const nextPast = [...history.past, history.current].slice(-history.capacity);
  return createHistoryState(history.capacity, nextPast, canonicalNext, []);
}

export function undoDrawingScene(history: DrawingSceneHistory): DrawingSceneHistory {
  if (history.past.length === 0) return history;
  const current = history.past[history.past.length - 1];
  return createHistoryState(
    history.capacity,
    history.past.slice(0, -1),
    current,
    [history.current, ...history.future],
  );
}

export function redoDrawingScene(history: DrawingSceneHistory): DrawingSceneHistory {
  if (history.future.length === 0) return history;
  const current = history.future[0];
  const past = [...history.past, history.current].slice(-history.capacity);
  return createHistoryState(history.capacity, past, current, history.future.slice(1));
}
