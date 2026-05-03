import type { ComponentProps, RefObject } from "react";
import type MobileDrawer from "@/components/layout/MobileDrawer";
import type MobileTopBar from "@/components/layout/MobileTopBar";
import type SidebarContent from "@/components/layout/SidebarContent";
import type WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import type WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";

export type SidebarListProps = ComponentProps<typeof SidebarContent>;
export type DetailProps = ComponentProps<typeof WorkOrderDetail>;
export type SidePanelProps = ComponentProps<typeof WorkOrderSidePanel>;
export type MobileTopBarProps = ComponentProps<typeof MobileTopBar>;
export type MobileDrawerProps = Omit<ComponentProps<typeof MobileDrawer>, "open" | "onClose"> & {
  open: boolean;
  onClose: () => void;
};

export type WorkOrderLayoutViewProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  selectedId: string;
  hasSelection: boolean;
  sidebarListProps: SidebarListProps;
  detailProps: DetailProps;
  sidePanelProps: SidePanelProps;
  mobileTopBarProps: MobileTopBarProps;
  mobileDrawerProps: MobileDrawerProps;
};
