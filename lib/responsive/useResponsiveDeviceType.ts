"use client";

import { useEffect, useState } from "react";

import { RESPONSIVE_MEDIA_QUERIES, type ResponsiveDeviceType } from "@/lib/responsive/responsiveLayoutPolicy";
export type { ResponsiveDeviceType } from "@/lib/responsive/responsiveLayoutPolicy";

function resolveResponsiveDeviceType(): ResponsiveDeviceType {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  const height = window.innerHeight;
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isCompactTablet =
    shortSide >= RESPONSIVE_BREAKPOINTS.compactTabletMin &&
    longSide >= RESPONSIVE_BREAKPOINTS.compactTabletLongSideMin;

  if (isCompactTablet) return "tablet";
  if (window.matchMedia(RESPONSIVE_MEDIA_QUERIES.mobile).matches) return "mobile";
  if (window.matchMedia(RESPONSIVE_MEDIA_QUERIES.tablet).matches) return "tablet";
  return "desktop";
}

export function useResponsiveDeviceType() {
  const [deviceType, setDeviceType] = useState<ResponsiveDeviceType>(resolveResponsiveDeviceType);

  useEffect(() => {
    const mobileQuery = window.matchMedia(RESPONSIVE_MEDIA_QUERIES.mobile);
    const tabletQuery = window.matchMedia(RESPONSIVE_MEDIA_QUERIES.tablet);

    const handleChange = () => {
      setDeviceType(resolveResponsiveDeviceType());
    };

    handleChange();
    mobileQuery.addEventListener("change", handleChange);
    tabletQuery.addEventListener("change", handleChange);

    return () => {
      mobileQuery.removeEventListener("change", handleChange);
      tabletQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return deviceType;
}
