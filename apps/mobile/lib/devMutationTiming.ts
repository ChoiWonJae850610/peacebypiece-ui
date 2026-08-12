type MutationTimingStage = "visible-complete" | "request-complete" | "busy-release" | "reconcile-complete";

function timingEnabled() {
  return process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true";
}

export function createDevMutationTiming(action: string) {
  const startedAt = Date.now();
  const stageElapsed: Partial<Record<MutationTimingStage, number>> = {};
  const mark = (stage: MutationTimingStage) => { stageElapsed[stage] = Date.now() - startedAt; };
  return {
    markVisibleComplete() { mark("visible-complete"); },
    markRequestComplete() { mark("request-complete"); },
    markBusyRelease() { mark("busy-release"); },
    complete(input: { readonly followUpRequests: number; readonly outcome: "success" | "failure" | "skipped" }) {
      mark("reconcile-complete");
      if (!timingEnabled()) return;
      console.info("[WAFL_MOBILE_MUTATION_TIMING]", {
        action,
        outcome: input.outcome,
        visibleCompleteMs: stageElapsed["visible-complete"] ?? null,
        requestCompleteMs: stageElapsed["request-complete"] ?? null,
        busyReleaseMs: stageElapsed["busy-release"] ?? null,
        reconcileCompleteMs: stageElapsed["reconcile-complete"] ?? null,
        followUpRequests: input.followUpRequests,
      });
    },
  };
}
