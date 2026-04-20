import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";

export default function WorkOrderDetailMobileView({
  appShellRef,
  selectedId,
  detailProps,
  sidePanelProps,
  mobileTopBarProps,
  mobileDrawerProps,
}: WorkOrderLayoutViewProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef} className="min-h-screen overflow-x-hidden">
        <MobileTopBar {...mobileTopBarProps} />
        <MobileDrawer {...mobileDrawerProps} />

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-full flex-col gap-3 overflow-x-hidden px-3 py-3 pb-6">
          <section className="min-w-0 overflow-x-hidden">
            <div key={selectedId} className="pbp-mobile-content-switch">
              <WorkOrderDetail {...detailProps} />
            </div>
          </section>

          <aside className="min-w-0 overflow-x-hidden rounded-3xl border border-stone-200 bg-stone-50 px-3 py-3">
            <WorkOrderSidePanel {...sidePanelProps} />
          </aside>
        </div>
      </div>
    </main>
  );
}
