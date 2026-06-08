export type ResponsiveDeviceType = "mobile" | "tablet" | "desktop";

export type ResponsiveInteractionPattern = "stack" | "split" | "workspace";
export type ResponsiveOverlayPattern = "drawer" | "bottomSheet" | "fullScreenModal" | "inlinePanel";

export const RESPONSIVE_BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1279,
  desktopMin: 1280,
  tabletThreePanelMin: 1240,
} as const;

export const RESPONSIVE_MEDIA_QUERIES = {
  mobile: `(max-width: ${RESPONSIVE_BREAKPOINTS.mobileMax}px)`,
  tablet: `(min-width: ${RESPONSIVE_BREAKPOINTS.tabletMin}px) and (max-width: ${RESPONSIVE_BREAKPOINTS.tabletMax}px)`,
  desktop: `(min-width: ${RESPONSIVE_BREAKPOINTS.desktopMin}px)`,
} as const;

export const RESPONSIVE_LAYOUT_POLICY: Record<
  ResponsiveDeviceType,
  {
    interactionPattern: ResponsiveInteractionPattern;
    primaryOverlay: ResponsiveOverlayPattern;
    secondaryOverlay: ResponsiveOverlayPattern;
    workOrderPattern: "listToDetailTabs" | "twoPane" | "threePane";
    materialOrderPattern: "listToDetailTabs" | "twoPane" | "threePane";
    settingsPattern: "drawerMenu" | "twoPane" | "tabbedWorkspace";
  }
> = {
  mobile: {
    interactionPattern: "stack",
    primaryOverlay: "bottomSheet",
    secondaryOverlay: "fullScreenModal",
    workOrderPattern: "listToDetailTabs",
    materialOrderPattern: "listToDetailTabs",
    settingsPattern: "drawerMenu",
  },
  tablet: {
    interactionPattern: "split",
    primaryOverlay: "drawer",
    secondaryOverlay: "bottomSheet",
    workOrderPattern: "twoPane",
    materialOrderPattern: "twoPane",
    settingsPattern: "twoPane",
  },
  desktop: {
    interactionPattern: "workspace",
    primaryOverlay: "inlinePanel",
    secondaryOverlay: "drawer",
    workOrderPattern: "threePane",
    materialOrderPattern: "threePane",
    settingsPattern: "tabbedWorkspace",
  },
} as const;

export function getResponsiveLayoutPolicy(deviceType: ResponsiveDeviceType) {
  return RESPONSIVE_LAYOUT_POLICY[deviceType];
}
