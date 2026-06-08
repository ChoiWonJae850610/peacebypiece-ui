"use client";

import { useEffect, useState } from "react";

export type ResponsiveOrientation = "portrait" | "landscape";

function resolveResponsiveOrientation(): ResponsiveOrientation {
  if (typeof window === "undefined") return "landscape";
  return window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
}

export function useResponsiveOrientation() {
  const [orientation, setOrientation] = useState<ResponsiveOrientation>(resolveResponsiveOrientation);

  useEffect(() => {
    const orientationQuery = window.matchMedia("(orientation: portrait)");
    const handleChange = () => {
      setOrientation(resolveResponsiveOrientation());
    };

    handleChange();
    orientationQuery.addEventListener("change", handleChange);
    window.addEventListener("orientationchange", handleChange);
    window.addEventListener("resize", handleChange);

    return () => {
      orientationQuery.removeEventListener("change", handleChange);
      window.removeEventListener("orientationchange", handleChange);
      window.removeEventListener("resize", handleChange);
    };
  }, []);

  return orientation;
}
