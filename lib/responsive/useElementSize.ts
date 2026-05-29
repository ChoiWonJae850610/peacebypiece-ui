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

export function useElementSize<TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
): ElementSize {
  const [size, setSize] = useState<ElementSize>(EMPTY_ELEMENT_SIZE);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        updateSize();
        return;
      }

      const { width, height } = entry.contentRect;
      setSize({
        width: Math.round(width),
        height: Math.round(height),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
