"use client";

import { useEffect, useState } from "react";

export type ResponsiveDeviceType = "mobile" | "tablet" | "desktop";

const MOBILE_MEDIA = "(max-width: 767px)";
const TABLET_MEDIA = "(min-width: 768px) and (max-width: 1279px)";

function resolveResponsiveDeviceType(): ResponsiveDeviceType {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia(MOBILE_MEDIA).matches) return "mobile";
  if (window.matchMedia(TABLET_MEDIA).matches) return "tablet";
  return "desktop";
}

export function useResponsiveDeviceType() {
  const [deviceType, setDeviceType] = useState<ResponsiveDeviceType>(resolveResponsiveDeviceType);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_MEDIA);
    const tabletQuery = window.matchMedia(TABLET_MEDIA);

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
