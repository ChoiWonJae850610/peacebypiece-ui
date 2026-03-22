import Sidebar from "@/components/layout/Sidebar";
import RightPanel from "@/components/layout/RightPanel";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";

export default function Page() {
  return (
    <main className="min-h-screen bg-stone-100">
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen">
        <Sidebar />
        <WorkOrderDetail />
        <RightPanel />
      </div>
    </main>
  );
}
