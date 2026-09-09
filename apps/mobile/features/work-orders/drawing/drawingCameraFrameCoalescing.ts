export type DrawingLatestFrameScheduler<T> = Readonly<{
  cancel: () => void;
  dispose: () => void;
  flush: () => void;
  schedule: (value: T) => void;
}>;

export function createDrawingLatestFrameScheduler<T>(input: Readonly<{
  cancelFrame: (handle: number) => void;
  render: (value: T) => void;
  requestFrame: (callback: () => void) => number;
}>): DrawingLatestFrameScheduler<T> {
  let disposed = false;
  let frameHandle: number | null = null;
  let pending: T | null = null;

  const cancel = () => {
    if (frameHandle !== null) input.cancelFrame(frameHandle);
    frameHandle = null;
    pending = null;
  };
  const flush = () => {
    if (disposed) return;
    if (frameHandle !== null) input.cancelFrame(frameHandle);
    frameHandle = null;
    const latest = pending;
    pending = null;
    if (latest !== null) input.render(latest);
  };
  const schedule = (value: T) => {
    if (disposed) return;
    pending = value;
    if (frameHandle !== null) return;
    frameHandle = input.requestFrame(() => {
      frameHandle = null;
      const latest = pending;
      pending = null;
      if (!disposed && latest !== null) input.render(latest);
    });
  };
  const dispose = () => {
    cancel();
    disposed = true;
  };

  return Object.freeze({ cancel, dispose, flush, schedule });
}
