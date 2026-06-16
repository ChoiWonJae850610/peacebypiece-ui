import type { DbTransactionClient } from "@/lib/db/client";
import type { MaterialOrderLineInput } from "@/lib/material-orders/types";
import {
  normalizeMaterialOrderMoney,
  normalizeMaterialOrderQuantity,
  normalizeMaterialOrderText,
  resolveMaterialOrderLineAmount,
} from "@/lib/material-orders/repository/normalizers";

export async function insertMaterialOrderLine(
  client: DbTransactionClient,
  companyId: string,
  materialOrderId: string,
  line: MaterialOrderLineInput,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO material_order_lines (
       company_id, material_order_id, partner_item_id, item_name, item_type,
       color, spec, unit, order_quantity, unit_price, amount, note
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      companyId,
      materialOrderId,
      normalizeMaterialOrderText(line.partnerItemId),
      line.itemName.trim(),
      line.itemType,
      normalizeMaterialOrderText(line.color),
      normalizeMaterialOrderText(line.spec),
      line.unit.trim(),
      normalizeMaterialOrderQuantity(line.orderQuantity),
      normalizeMaterialOrderMoney(line.unitPrice),
      resolveMaterialOrderLineAmount(line),
      normalizeMaterialOrderText(line.note),
    ],
  );
  return result.rows[0]?.id ?? "";
}

export async function insertMaterialOrderAllocations(
  client: DbTransactionClient,
  companyId: string,
  materialOrderLineId: string,
  line: MaterialOrderLineInput,
): Promise<void> {
  for (const allocation of line.allocations ?? []) {
    const workOrderId = allocation.workOrderId.trim();
    if (!workOrderId) continue;
    await client.query(
      `INSERT INTO material_order_allocations (
         company_id, material_order_line_id, work_order_id, source_material_key,
         allocated_quantity, allocation_note
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        companyId,
        materialOrderLineId,
        workOrderId,
        normalizeMaterialOrderText(allocation.sourceMaterialKey),
        normalizeMaterialOrderQuantity(allocation.allocatedQuantity),
        normalizeMaterialOrderText(allocation.allocationNote),
      ],
    );
  }
}
