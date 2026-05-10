import type { ComponentProps, RefObject } from "react";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import type { WorkOrderHomeNavigation } from "@/components/workorder/layout/WorkOrderHomeButton";

export type WorkOrderWorkspaceLoadingState = {
  isRepositoryLoading: boolean;
  detailTitle: string;
  detailDescription: string;
  sideTitle: string;
  sideDescription: string;
};

export type SidebarListProps = ComponentProps<typeof SidebarContent>;
export type DetailProps = ComponentProps<typeof WorkOrderDetail>;
export type SidePanelProps = ComponentProps<typeof WorkOrderSidePanel>;
export type MobileTopBarProps = Omit<ComponentProps<typeof MobileTopBar>, "homeNavigation">;
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
  loadingState?: WorkOrderWorkspaceLoadingState;
  homeNavigation: WorkOrderHomeNavigation;
};
