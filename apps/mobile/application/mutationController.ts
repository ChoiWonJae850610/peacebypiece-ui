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
