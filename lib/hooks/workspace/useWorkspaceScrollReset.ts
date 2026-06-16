"use client";

import { useEffect, type RefObject } from "react";

export function useWorkspaceScrollReset(
  resetKey: string,
  refs: Array<RefObject<HTMLElement | null>>,
) {
  useEffect(() => {
    refs.forEach((ref) => {
      ref.current?.scrollTo({ top: 0, left: 0 });
    });
    // Ref objects are stable; resetKey is the intended reset boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
}
