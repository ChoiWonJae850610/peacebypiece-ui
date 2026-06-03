"use client";

import { useEffect, useState, type RefObject } from "react";

export type ElementSize = {
  width: number;
  height: number;
};

const EMPTY_ELEMENT_SIZE: ElementSize = {
  width: 0,
  height: 0,
};

const ORIENTATION_RECHECK_DELAYS = [0, 80, 180, 360] as const;

function readElementSize(element: HTMLElement): ElementSize {
  const rect = element.getBoundingClientRect();

  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function isSameElementSize(previous: ElementSize, next: ElementSize): boolean {
  return previous.width === next.width && previous.height === next.height;
}

export function useElementSize<TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
): ElementSize {
  const [size, setSize] = useState<ElementSize>(EMPTY_ELEMENT_SIZE);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let animationFrameId: number | null = null;
    const timeoutIds = new Set<number>();

    const updateSize = () => {
      const nextSize = readElementSize(element);
      setSize((previous) => isSameElementSize(previous, nextSize) ? previous : nextSize);
    };

    const scheduleSizeUpdate = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateSize();
      });
    };

    const scheduleSettledSizeUpdates = () => {
      scheduleSizeUpdate();

      ORIENTATION_RECHECK_DELAYS.forEach((delay) => {
        const timeoutId = window.setTimeout(() => {
          timeoutIds.delete(timeoutId);
          scheduleSizeUpdate();
        }, delay);
        timeoutIds.add(timeoutId);
      });
    };

    updateSize();

    window.addEventListener("resize", scheduleSettledSizeUpdates);
    window.addEventListener("orientationchange", scheduleSettledSizeUpdates);
    window.visualViewport?.addEventListener("resize", scheduleSettledSizeUpdates);
    window.visualViewport?.addEventListener("scroll", scheduleSettledSizeUpdates);

    const orientationQuery = typeof window.matchMedia === "function"
      ? window.matchMedia("(orientation: portrait)")
      : null;
    orientationQuery?.addEventListener?.("change", scheduleSettledSizeUpdates);

    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          scheduleSizeUpdate();
        });

    observer?.observe(element);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", scheduleSettledSizeUpdates);
      window.removeEventListener("orientationchange", scheduleSettledSizeUpdates);
      window.visualViewport?.removeEventListener("resize", scheduleSettledSizeUpdates);
      window.visualViewport?.removeEventListener("scroll", scheduleSettledSizeUpdates);
      orientationQuery?.removeEventListener?.("change", scheduleSettledSizeUpdates);

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.clear();
    };
  }, [ref]);

  return size;
}
