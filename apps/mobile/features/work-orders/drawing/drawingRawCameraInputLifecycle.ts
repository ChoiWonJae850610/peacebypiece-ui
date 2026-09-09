export type DrawingRawCameraTouchEvent = "cancel" | "end" | "move" | "start";

export type DrawingRawCameraInputState = Readonly<{
  cameraActive: boolean;
  suppressionActive: boolean;
}>;

export type DrawingRawCameraInputTransition = Readonly<{
  acquireCamera: boolean;
  cancelOneFingerTransient: boolean;
  endCamera: boolean;
  nextState: DrawingRawCameraInputState;
  releaseSuppression: boolean;
  updateCamera: boolean;
}>;

export function resolveDrawingRawCameraInputTransition(input: Readonly<{
  activeTouchCount: number;
  event: DrawingRawCameraTouchEvent;
  state: DrawingRawCameraInputState;
}>): DrawingRawCameraInputTransition {
  const activeTouchCount = Math.max(0, Math.trunc(input.activeTouchCount));
  const hasCameraPair = activeTouchCount >= 2;
  const releaseSuppression = (input.event === "cancel" || input.event === "end")
    && activeTouchCount === 0;

  if (input.event === "cancel") {
    return Object.freeze({
      acquireCamera: false,
      cancelOneFingerTransient: false,
      endCamera: input.state.cameraActive,
      nextState: Object.freeze({
        cameraActive: false,
        suppressionActive: !releaseSuppression && input.state.suppressionActive,
      }),
      releaseSuppression,
      updateCamera: false,
    });
  }

  if (input.event === "start" && hasCameraPair && !input.state.cameraActive) {
    return Object.freeze({
      acquireCamera: true,
      cancelOneFingerTransient: !input.state.suppressionActive,
      endCamera: false,
      nextState: Object.freeze({ cameraActive: true, suppressionActive: true }),
      releaseSuppression: false,
      updateCamera: false,
    });
  }

  if (input.event === "move" && input.state.cameraActive && hasCameraPair) {
    return Object.freeze({
      acquireCamera: false,
      cancelOneFingerTransient: false,
      endCamera: false,
      nextState: input.state,
      releaseSuppression: false,
      updateCamera: true,
    });
  }

  if (input.event === "end" && input.state.cameraActive) {
    if (hasCameraPair) {
      return Object.freeze({
        acquireCamera: false,
        cancelOneFingerTransient: false,
        endCamera: false,
        nextState: input.state,
        releaseSuppression: false,
        updateCamera: true,
      });
    }
    return Object.freeze({
      acquireCamera: false,
      cancelOneFingerTransient: false,
      endCamera: true,
      nextState: Object.freeze({
        cameraActive: false,
        suppressionActive: !releaseSuppression,
      }),
      releaseSuppression,
      updateCamera: false,
    });
  }

  return Object.freeze({
    acquireCamera: false,
    cancelOneFingerTransient: false,
    endCamera: false,
    nextState: Object.freeze({
      cameraActive: input.state.cameraActive,
      suppressionActive: releaseSuppression ? false : input.state.suppressionActive,
    }),
    releaseSuppression,
    updateCamera: false,
  });
}
