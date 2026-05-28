import type { WorkflowPathValue } from "@/lib/constants/workflowPaths";

export const MATERIAL_ORDER_STATUS = {
  draft: "draft",
  reviewRequested: "review_requested",
  approved: "approved",
  orderPlaced: "order_placed",
  rejected: "rejected",
  cancelled: "cancelled",
} as const;

export const MATERIAL_ORDER_STATUSES = [
  MATERIAL_ORDER_STATUS.draft,
  MATERIAL_ORDER_STATUS.reviewRequested,
  MATERIAL_ORDER_STATUS.approved,
  MATERIAL_ORDER_STATUS.orderPlaced,
  MATERIAL_ORDER_STATUS.rejected,
  MATERIAL_ORDER_STATUS.cancelled,
] as const;

export type MaterialOrderStatus = (typeof MATERIAL_ORDER_STATUSES)[number];

export type MaterialOrderLineItemType = "fabric" | "submaterial";

export type MaterialOrderAllocation = {
  id: string;
  companyId: string;
  materialOrderLineId: string;
  workOrderId: string;
  allocatedQuantity: number;
  allocationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaterialOrderLine = {
  id: string;
  companyId: string;
  materialOrderId: string;
  partnerItemId: string | null;
  itemName: string;
  itemType: MaterialOrderLineItemType;
  color: string | null;
  spec: string | null;
  unit: string;
  orderQuantity: number;
  unitPrice: number;
  amount: number;
  note: string | null;
  allocations: MaterialOrderAllocation[];
  createdAt: string;
  updatedAt: string;
};

export type MaterialOrder = {
  id: string;
  companyId: string;
  supplierPartnerId: string | null;
  supplierPartnerName: string | null;
  status: MaterialOrderStatus;
  workflowPath: WorkflowPathValue;
  requestedByUserId: string | null;
  requestedByDisplayName: string | null;
  approvedByUserId: string | null;
  orderedAt: string | null;
  totalAmount: number;
  note: string | null;
  lines: MaterialOrderLine[];
  createdAt: string;
  updatedAt: string;
};

export type MaterialOrderVisibilityScope =
  | { mode: "company" }
  | { mode: "assigned"; userId: string; companyMemberId?: string | null };

export type MaterialOrderListParams = {
  companyId: string;
  status?: MaterialOrderStatus | null;
  visibility?: MaterialOrderVisibilityScope;
};

export type MaterialOrderSupplier = {
  id: string;
  name: string;
  type: MaterialOrderLineItemType;
  isActive: boolean;
};

export type MaterialOrderSupplierListParams = {
  companyId: string;
  type?: MaterialOrderLineItemType | null;
};

export type MaterialOrderSupplierListResult = {
  suppliers: MaterialOrderSupplier[];
};

export type MaterialOrderAllocationInput = {
  workOrderId: string;
  allocatedQuantity: number;
  allocationNote?: string | null;
};

export type MaterialOrderLineInput = {
  partnerItemId?: string | null;
  itemName: string;
  itemType: MaterialOrderLineItemType;
  color?: string | null;
  spec?: string | null;
  unit: string;
  orderQuantity: number;
  unitPrice?: number | null;
  amount?: number | null;
  note?: string | null;
  allocations?: MaterialOrderAllocationInput[];
};

export type MaterialOrderCreateInput = {
  companyId: string;
  visibility?: MaterialOrderVisibilityScope;
  supplierPartnerId?: string | null;
  requestedByUserId: string;
  status?: MaterialOrderStatus;
  note?: string | null;
  lines?: MaterialOrderLineInput[];
};

export type MaterialOrderUpdateInput = {
  companyId: string;
  visibility?: MaterialOrderVisibilityScope;
  materialOrderId: string;
  supplierPartnerId?: string | null;
  note?: string | null;
  lines: MaterialOrderLineInput[];
};

export type MaterialOrderStatusUpdateInput = {
  companyId: string;
  visibility?: MaterialOrderVisibilityScope;
  materialOrderId: string;
  status: MaterialOrderStatus;
  actorUserId: string;
};

export type MaterialOrderListResult = {
  materialOrders: MaterialOrder[];
};

export type MaterialOrderMutationResult = MaterialOrderListResult & {
  materialOrder: MaterialOrder | null;
};
