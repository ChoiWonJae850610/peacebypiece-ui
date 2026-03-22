import MaterialTable from "@/components/tables/MaterialTable";
import OutsourcingTable from "@/components/tables/OutsourcingTable";

export default function WorkOrderDetail() {
  return (
    <section className="md:col-span-6 p-4">
      <div className="bg-white p-4 rounded-2xl">
        <h2 className="text-lg font-semibold">작업지시 상세</h2>
        <MaterialTable />
        <OutsourcingTable />
      </div>
    </section>
  );
}
