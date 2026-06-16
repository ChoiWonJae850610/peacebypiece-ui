import type { MaterialOrderStatus } from "@/lib/material-orders/types";

export type MaterialOrderRow = {
  id: string;
  company_id: string;
  supplier_partner_id: string | null;
  supplier_partner_name: string | null;
  material_type: "fabric" | "submaterial" | null;
  status: MaterialOrderStatus;
  workflow_path: string | null;
  requested_by_user_id: string | null;
  requested_by_display_name: string | null;
  approved_by_user_id: string | null;
  ordered_at: Date | string | null;
  due_date: Date | string | null;
  total_amount: string | number;
  note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type MaterialOrderLineRow = {
  id: string;
  company_id: string;
  material_order_id: string;
  partner_item_id: string | null;
  item_name: string;
  item_type: "fabric" | "submaterial";
  color: string | null;
  spec: string | null;
  unit: string;
  order_quantity: string | number;
  unit_price: string | number;
  amount: string | number;
  note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type MaterialOrderSupplierRow = {
  id: string;
  name: string;
  supplier_type: "fabric" | "submaterial";
  is_active: boolean;
};

export type MaterialOrderAllocationRow = {
  id: string;
  company_id: string;
  material_order_line_id: string;
  work_order_id: string;
  source_material_key: string | null;
  allocated_quantity: string | number;
  allocation_note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};
