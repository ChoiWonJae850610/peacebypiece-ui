export type ReelHapticAdapter = {
  readonly selectionChanged: (index: number, at?: number) => void;
};

export function createSelectionTickGate(minimumIntervalMs = 70) {
  let lastIndex: number | null = null;
  let lastAt = Number.NEGATIVE_INFINITY;
  return (index: number, at = Date.now()) => {
    if (index === lastIndex || at - lastAt < minimumIntervalMs) return false;
    lastIndex = index;
    lastAt = at;
    return true;
  };
}

export function createSelectionHapticAdapter(vibrate: (durationMs: number) => void): ReelHapticAdapter {
  const selectionTickAllowed = createSelectionTickGate();
  return {
    selectionChanged(index, at) {
      if (selectionTickAllowed(index, at)) vibrate(8);
    },
  };
}

export const noOpReelHaptics: ReelHapticAdapter = {
  selectionChanged() {},
};
