import "server-only";

import { performance } from "perf_hooks";

const PERFORMANCE_TIMING_APPROVAL = "2.0.0-alpha.62-dev-test-performance-timing";

export const WAFL_PERFORMANCE_TIMING_HEADERS = {
  routeMs: "X-WAFL-Timing-Route-Ms",
  guardMs: "X-WAFL-Timing-Guard-Ms",
  productMs: "X-WAFL-Timing-Product-Ms",
} as const;

export function isWaflPerformanceTimingEnabled() {
  return process.env.NODE_ENV !== "production"
    && process.env.WAFL_V2_COMMAND_MUTATION_APPROVED?.trim() === "2.0.0-alpha.62-dev-test-size-measurement-runtime";
}

export function startWaflRouteTiming() {
  const routeStartedAt = performance.now();
  let guardCompletedAt = routeStartedAt;
  return {
    markGuardComplete() {
      guardCompletedAt = performance.now();
    },
    headers(productMs?: number): Readonly<Record<string, string>> {
      const routeCompletedAt = performance.now();
      return {
        [WAFL_PERFORMANCE_TIMING_HEADERS.routeMs]: (routeCompletedAt - routeStartedAt).toFixed(2),
        [WAFL_PERFORMANCE_TIMING_HEADERS.guardMs]: (guardCompletedAt - routeStartedAt).toFixed(2),
        [WAFL_PERFORMANCE_TIMING_HEADERS.productMs]: Number.isFinite(productMs) ? Number(productMs).toFixed(2) : "0.00",
      };
    },
  };
}

export const WAFL_PERFORMANCE_TIMING_APPROVAL = PERFORMANCE_TIMING_APPROVAL;
