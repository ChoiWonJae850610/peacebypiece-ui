"use client";

import { useEffect, useMemo, useState } from "react";

import {
  RESPONSIVE_BREAKPOINTS,
  type ResponsiveDeviceType,
} from "@/lib/responsive/responsiveLayoutPolicy";

export type WorkspaceLayoutMode = "drawer" | "tabletTwoPanel" | "threePanel";
export type WorkspaceOverlayPresentation = "sheet" | "modal";

export type WorkspaceLayoutState = {
  deviceType: ResponsiveDeviceType;
  orientation: "portrait" | "landscape";
  viewportWidth: number;
  viewportHeight: number;
  isLandscape: boolean;
  layoutMode: WorkspaceLayoutMode;
  drawerOverlayPresentation: WorkspaceOverlayPresentation;
  useDrawerNavigation: boolean;
  showListTrigger: boolean;
  useTabletTwoPanel: boolean;
  useThreePanel: boolean;
  useStackedProgress: boolean;
};

function getViewportSize() {
  if (typeof window === "undefined") {
    return getInitialViewportSize();
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

function getInitialViewportSize(): { width: number; height: number } {
  return { width: RESPONSIVE_BREAKPOINTS.desktopMin, height: 900 };
}

export function resolveWorkspaceLayout(
  viewportWidth: number,
  viewportHeight: number,
): WorkspaceLayoutState {
  const width = Math.max(0, viewportWidth);
  const height = Math.max(0, viewportHeight);
  const shortSide = Math.min(width, height);
  const isLandscape = width > height;
  const orientation = isLandscape ? "landscape" : "portrait";
  const hasTabletCanvas = shortSide >= RESPONSIVE_BREAKPOINTS.compactTabletMin;

  const useDesktopThreePanel = width >= RESPONSIVE_BREAKPOINTS.desktopMin;
  const useTabletThreePanel =
    hasTabletCanvas &&
    isLandscape &&
    width >= RESPONSIVE_BREAKPOINTS.tabletThreePanelMin;
  const useThreePanel = useDesktopThreePanel || useTabletThreePanel;
  const useTabletTwoPanel =
    !useThreePanel &&
    hasTabletCanvas &&
    isLandscape &&
    width >= RESPONSIVE_BREAKPOINTS.tabletNarrowTwoPanelMin;

  const layoutMode: WorkspaceLayoutMode = useThreePanel
    ? "threePanel"
    : useTabletTwoPanel
      ? "tabletTwoPanel"
      : "drawer";

  const deviceType: ResponsiveDeviceType =
    width >= RESPONSIVE_BREAKPOINTS.desktopMin
      ? "desktop"
      : hasTabletCanvas
        ? "tablet"
        : "mobile";

  return {
    deviceType,
    orientation,
    viewportWidth: width,
    viewportHeight: height,
    isLandscape,
    layoutMode,
    drawerOverlayPresentation: hasTabletCanvas ? "modal" : "sheet",
    useDrawerNavigation: layoutMode === "drawer",
    showListTrigger: layoutMode !== "threePanel",
    useTabletTwoPanel,
    useThreePanel,
    useStackedProgress: layoutMode === "drawer",
  };
}

export function useWorkspaceLayoutMode(): WorkspaceLayoutState {
  const [viewportSize, setViewportSize] = useState(getInitialViewportSize);

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

  return useMemo(
    () => resolveWorkspaceLayout(viewportSize.width, viewportSize.height),
    [viewportSize.height, viewportSize.width],
  );
}
