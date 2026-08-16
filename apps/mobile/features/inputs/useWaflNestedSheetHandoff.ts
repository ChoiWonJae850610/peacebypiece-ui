import { useCallback, useEffect, useRef, useState } from "react";

import {
  canPresentWaflNestedSheet,
  canTransitionWaflNestedSheet,
  nextWaflNestedSheetPresentationGeneration,
} from "@/domain/waflNestedSheetTransitionPolicy";

export function useWaflNestedSheetHandoff<Route extends string>(
  initialRoute: Route,
  options: { readonly initialVisible?: boolean } = {},
) {
  const initialVisible = options.initialVisible ?? true;
  const mountedRef = useRef(true);
  const pendingRouteRef = useRef<Route | null>(null);
  const presentationFrameRef = useRef<number | null>(null);
  const visibleRef = useRef(initialVisible);
  const [route, setRoute] = useState<Route>(initialRoute);
  const [visible, setVisibleState] = useState(initialVisible);
  const [presentationGeneration, setPresentationGeneration] = useState(initialVisible ? 1 : 0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (presentationFrameRef.current !== null) cancelAnimationFrame(presentationFrameRef.current);
    };
  }, []);

  const setVisible = useCallback((nextVisible: boolean) => {
    visibleRef.current = nextVisible;
    setVisibleState(nextVisible);
  }, []);

  const queuePresentation = useCallback((nextRoute: Route) => {
    setRoute(nextRoute);
    presentationFrameRef.current = requestAnimationFrame(() => {
      presentationFrameRef.current = requestAnimationFrame(() => {
        presentationFrameRef.current = null;
        if (!mountedRef.current) return;
        setPresentationGeneration(nextWaflNestedSheetPresentationGeneration);
        setVisible(true);
      });
    });
  }, [setVisible]);

  const present = useCallback((nextRoute: Route) => {
    if (!canPresentWaflNestedSheet({
      currentVisible: visibleRef.current,
      hasPendingRoute: pendingRouteRef.current !== null,
      hasQueuedPresentation: presentationFrameRef.current !== null,
    })) return false;
    queuePresentation(nextRoute);
    return true;
  }, [queuePresentation]);

  const transition = useCallback((nextRoute: Route) => {
    if (!canTransitionWaflNestedSheet({
      currentVisible: visibleRef.current,
      hasPendingRoute: pendingRouteRef.current !== null,
    })) return false;
    pendingRouteRef.current = nextRoute;
    setVisible(false);
    return true;
  }, [setVisible]);

  const dismiss = useCallback(() => {
    pendingRouteRef.current = null;
    if (presentationFrameRef.current !== null) {
      cancelAnimationFrame(presentationFrameRef.current);
      presentationFrameRef.current = null;
    }
    setVisible(false);
  }, [setVisible]);

  const finishClose = useCallback(() => {
    const nextRoute = pendingRouteRef.current;
    if (nextRoute === null || !mountedRef.current) return;
    pendingRouteRef.current = null;
    queuePresentation(nextRoute);
  }, [queuePresentation]);

  return { route, visible, presentationGeneration, present, transition, dismiss, finishClose } as const;
}
