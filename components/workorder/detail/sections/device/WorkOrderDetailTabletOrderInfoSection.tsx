import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type OrderInfoProps = WorkOrderDetailViewModel["orderInfoProps"];

export default function WorkOrderDetailTabletOrderInfoSection(props: OrderInfoProps) {
  return <OrderInfoSection {...props} />;
}
