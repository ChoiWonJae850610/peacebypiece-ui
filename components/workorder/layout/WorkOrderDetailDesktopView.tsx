import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";

export default function WorkOrderDetailDesktopView({
  appShellRef,
  selectedId,
  sidebarListProps,
  detailProps,
  sidePanelProps,
}: WorkOrderLayoutViewProps) {
  return (
    <main className="h-screen overflow-hidden bg-stone-100 text-stone-900">
      <div ref={appShellRef} className="flex h-full flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden">
          <aside className="col-span-3 min-h-0 border-r border-stone-200 bg-white">
            <SidebarContent {...sidebarListProps} />
          </aside>

          <section className="col-span-6 min-h-0 overflow-y-auto px-6 py-6">
            <div key={selectedId}>
              <WorkOrderDetail {...detailProps} />
            </div>
          </section>

          <aside className="col-span-3 min-h-0 overflow-y-auto border-l border-stone-200 bg-stone-50 px-6 py-6">
            <WorkOrderSidePanel {...sidePanelProps} />
          </aside>
        </div>
      </div>
    </main>
  );
}
