import {
  WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP,
  type WaflMobileDeviceClass,
} from "./mobileOrientationPolicy.ts";

export const WORK_ORDER_RESPONSIVE_PANE_IDENTITY = Object.freeze({
  list: "work-order-responsive-list-host",
  detail: "work-order-responsive-detail-host",
});

export type WorkOrderResponsiveWorkspacePlan = Readonly<{
  showList: boolean;
  showDetail: boolean;
  listKey: typeof WORK_ORDER_RESPONSIVE_PANE_IDENTITY.list;
  detailKey: typeof WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail;
}>;

export function resolveWorkOrderTabletPresentation(input: Readonly<{
  deviceClass: WaflMobileDeviceClass;
  windowWidth: number;
}>) {
  if (input.deviceClass === "handset" || input.deviceClass === "compact-tablet") {
    return false;
  }
  if (input.deviceClass === "regular-tablet") {
    return true;
  }
  return Number.isFinite(input.windowWidth)
    && input.windowWidth >= WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP;
}

export function resolveWorkOrderResponsiveWorkspacePlan(input: Readonly<{
  tablet: boolean;
  selected: boolean;
}>): WorkOrderResponsiveWorkspacePlan {
  return Object.freeze({
    showList: input.tablet || !input.selected,
    showDetail: input.tablet || input.selected,
    listKey: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.list,
    detailKey: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail,
  });
}
