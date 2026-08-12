export type ExplicitMutationResult<T> =
  | { readonly kind: "skipped" }
  | { readonly kind: "duplicate-blocked" }
  | { readonly kind: "success"; readonly value: T };

export function createExplicitMutationController() {
  let inFlight = false;
  return {
    get inFlight() { return inFlight; },
    tryBegin(changed = true): "started" | "skipped" | "duplicate-blocked" {
      if (!changed) return "skipped";
      if (inFlight) return "duplicate-blocked";
      inFlight = true;
      return "started";
    },
    complete(): void {
      inFlight = false;
    },
    async execute<T>(changed: boolean, request: () => Promise<T>): Promise<ExplicitMutationResult<T>> {
      const begin = this.tryBegin(changed);
      if (begin === "skipped") return { kind: "skipped" };
      if (begin === "duplicate-blocked") return { kind: "duplicate-blocked" };
      try {
        return { kind: "success", value: await request() };
      } finally {
        this.complete();
      }
    },
  };
}

export type SerializedMutationQueue = {
  readonly pendingCount: number;
  enqueue<T>(request: () => Promise<T>): Promise<T>;
};

/**
 * Canonical client-side ordering owner for independent UI edits that share one
 * server-side entity version. A rejected request does not poison the queue;
 * later requests still run, in tap order, after the failure is observed.
 */
export function createSerializedMutationQueue(): SerializedMutationQueue {
  let tail: Promise<void> = Promise.resolve();
  let pendingCount = 0;
  return {
    get pendingCount() { return pendingCount; },
    enqueue<T>(request: () => Promise<T>): Promise<T> {
      pendingCount += 1;
      const result = tail.then(request, request);
      tail = result.then(
        () => { pendingCount -= 1; },
        () => { pendingCount -= 1; },
      );
      return result;
    },
  };
}
