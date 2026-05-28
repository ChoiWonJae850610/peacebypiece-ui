"use client";

import { useResponsiveDeviceType, type ResponsiveDeviceType } from "@/lib/responsive/useResponsiveDeviceType";

export type WorkOrderDeviceType = ResponsiveDeviceType;

export function useWorkOrderDeviceType() {
  return useResponsiveDeviceType();
}
