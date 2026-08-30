import {
  shouldReconcileWaflRuntimeOrientation,
  type WaflRuntimeOrientationAction,
} from "./mobileOrientationPolicy.ts";

export type WaflRuntimeOrientationCoordinator = {
  start: () => Promise<void>;
  handleAppStateChange: (nextAppState: string) => Promise<void>;
  dispose: () => void;
};

export function createWaflRuntimeOrientationCoordinator(input: {
  action: WaflRuntimeOrientationAction;
  initialAppState: string;
  apply: (action: WaflRuntimeOrientationAction) => Promise<void>;
}): WaflRuntimeOrientationCoordinator {
  let currentAppState = input.initialAppState;
  let disposed = false;
  let applying: Promise<void> | null = null;
  let queued = false;

  const reconcile = async () => {
    if (disposed || currentAppState !== "active" || input.action === "none") {
      return;
    }
    if (applying) {
      queued = true;
      await applying;
      return;
    }

    applying = (async () => {
      do {
        queued = false;
        await input.apply(input.action);
      } while (queued && !disposed && currentAppState === "active");
    })();

    try {
      await applying;
    } finally {
      applying = null;
    }
  };

  return {
    start: reconcile,
    handleAppStateChange: async (nextAppState) => {
      const previousAppState = currentAppState;
      currentAppState = nextAppState;
      if (shouldReconcileWaflRuntimeOrientation(previousAppState, nextAppState)) {
        await reconcile();
      }
    },
    dispose: () => {
      disposed = true;
      queued = false;
    },
  };
}
