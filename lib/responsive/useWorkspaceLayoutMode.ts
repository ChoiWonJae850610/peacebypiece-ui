"use client";

import { useEffect, useMemo, useState } from "react";

import {
  RESPONSIVE_BREAKPOINTS,
  type ResponsiveDeviceType,
} from "@/lib/responsive/responsiveLayoutPolicy";
import { useResponsiveDeviceType } from "@/lib/responsive/useResponsiveDeviceType";
import { useResponsiveOrientation } from "@/lib/responsive/useResponsiveOrientation";

export type WorkspaceLayoutMode = "drawer" | "tabletTwoPanel" | "threePanel";

export type WorkspaceLayoutState = {
  deviceType: ResponsiveDeviceType;
  orientation: "portrait" | "landscape";
  viewportWidth: number;
  viewportHeight: number;
  isLandscape: boolean;
  layoutMode: WorkspaceLayoutMode;
  useDrawerNavigation: boolean;
  useTabletTwoPanel: boolean;
  useThreePanel: boolean;
  useStackedProgress: boolean;
};

function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: RESPONSIVE_BREAKPOINTS.desktopMin, height: 900 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

export function useWorkspaceLayoutMode(): WorkspaceLayoutState {
  const deviceType = useResponsiveDeviceType();
  const orientation = useResponsiveOrientation();
  const [viewportSize, setViewportSize] = useState(getViewportSize);

  useEffect(() => {
    const handleResize = () => setViewportSize(getViewportSize());
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return useMemo(() => {
    const isLandscape =
      orientation === "landscape" || viewportSize.width > viewportSize.height;
    const tabletCanUseThreePanel =
      deviceType === "tablet" &&
      isLandscape &&
      viewportSize.width >= RESPONSIVE_BREAKPOINTS.tabletThreePanelMin;
    const tabletCanUseTwoPanel =
      deviceType === "tablet" &&
      isLandscape &&
      viewportSize.width >= RESPONSIVE_BREAKPOINTS.tabletNarrowTwoPanelMin &&
      !tabletCanUseThreePanel;
    const useThreePanel = deviceType === "desktop" || tabletCanUseThreePanel;
    const layoutMode: WorkspaceLayoutMode = useThreePanel
      ? "threePanel"
      : tabletCanUseTwoPanel
        ? "tabletTwoPanel"
        : "drawer";

    return {
      deviceType,
      orientation,
      viewportWidth: viewportSize.width,
      viewportHeight: viewportSize.height,
      isLandscape,
      layoutMode,
      useDrawerNavigation: layoutMode !== "threePanel",
      useTabletTwoPanel: layoutMode === "tabletTwoPanel",
      useThreePanel,
      useStackedProgress: deviceType === "mobile",
    };
  }, [deviceType, orientation, viewportSize.height, viewportSize.width]);
}
