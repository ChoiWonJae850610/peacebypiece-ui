import type { ComponentProps, RefObject } from "react";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";

type SidebarListProps = ComponentProps<typeof SidebarContent>;
type DetailProps = ComponentProps<typeof WorkOrderDetail>;
type SidePanelProps = ComponentProps<typeof WorkOrderSidePanel>;
type MobileTopBarProps = ComponentProps<typeof MobileTopBar>;
type MobileDrawerProps = ComponentProps<typeof MobileDrawer>;

type WorkOrderLayoutProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  selectedId: string;
  sidebarListProps: SidebarListProps;
  detailProps: DetailProps;
  sidePanelProps: SidePanelProps;
  mobileTopBarProps: MobileTopBarProps;
  mobileDrawerProps: Omit<MobileDrawerProps, "open" | "onClose"> & {
    open: boolean;
    onClose: () => void;
  };
};

export default function WorkOrderLayout({
  appShellRef,
  selectedId,
  sidebarListProps,
  detailProps,
  sidePanelProps,
  mobileTopBarProps,
  mobileDrawerProps,
}: WorkOrderLayoutProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900 md:h-screen md:overflow-hidden">
      <div ref={appShellRef} className="overflow-x-hidden md:flex md:h-full md:flex-col">
        <MobileTopBar {...mobileTopBarProps} />
        <MobileDrawer {...mobileDrawerProps} />

        <div className="grid min-h-screen w-full max-w-full grid-cols-1 overflow-x-hidden md:min-h-0 md:flex-1 md:grid-cols-12">
          <aside className="hidden min-w-0 border-r border-stone-200 bg-white md:block md:h-full md:col-span-3 md:min-h-0">
            <SidebarContent {...sidebarListProps} />
          </aside>

          <section className="min-w-0 overflow-x-hidden px-3 py-3 md:col-span-6 md:min-h-0 md:overflow-y-auto md:p-6">
            <div key={selectedId} className="pbp-mobile-content-switch md:contents">
              <WorkOrderDetail {...detailProps} />
            </div>
          </section>

          <aside className="min-w-0 overflow-x-hidden border-t border-stone-200 bg-stone-50 px-3 py-3 md:col-span-3 md:min-h-0 md:overflow-y-auto md:border-l md:border-t-0 md:p-6">
            <WorkOrderSidePanel {...sidePanelProps} />
          </aside>
        </div>
      </div>
    </main>
  );
}
