export type WorkOrderSketchCloseIntent = "blocked" | "close" | "confirm";

export function resolveWorkOrderSketchCloseIntent(input: Readonly<{
  dirty: boolean;
  saving: boolean;
}>): WorkOrderSketchCloseIntent {
  if (input.saving) return "blocked";
  return input.dirty ? "confirm" : "close";
}

export function createWorkOrderSketchParentCloseGuard() {
  let committed = false;
  return Object.freeze({
    close() {
      if (committed) return false;
      committed = true;
      return true;
    },
    reset() {
      committed = false;
    },
  });
}
