import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";

export default function WorkOrderDetailTabletView({
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
          <aside className="col-span-4 min-h-0 border-r border-stone-200 bg-white">
            <SidebarContent {...sidebarListProps} />
          </aside>

          <section className="col-span-8 min-h-0 overflow-y-auto px-4 py-4">
            <div className="grid min-h-full grid-cols-1 gap-4">
              <div key={selectedId}>
                <WorkOrderDetail {...detailProps} />
              </div>
              <aside className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <WorkOrderSidePanel {...sidePanelProps} />
              </aside>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
