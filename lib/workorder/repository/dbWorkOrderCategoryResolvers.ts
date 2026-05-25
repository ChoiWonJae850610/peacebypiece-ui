import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrder } from "@/types/workorder";
import {
  resolveWorkOrderCompanyId,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

type DbItemCategoryRow = {
  id: string;
  parent_id: string | null;
  level: number;
  name: string;
};

export async function resolveCategoryIdsForDb(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<Pick<WorkOrder, "category1Id" | "category2Id" | "category3Id">> {
  if (workOrder.category1Id || workOrder.category2Id || workOrder.category3Id) {
    return {
      category1Id: workOrder.category1Id ?? null,
      category2Id: workOrder.category2Id ?? null,
      category3Id: workOrder.category3Id ?? null,
    };
  }

  const companyId = resolveWorkOrderCompanyId(scope);
  const result = await queryDb<DbItemCategoryRow>(
    `SELECT id, parent_id, level, name
       FROM item_categories
      WHERE (company_id = $1 OR company_id IS NULL)
        AND is_active = true
      ORDER BY level ASC, sort_order ASC, name ASC`,
    [companyId],
  );

  const category1 =
    result.rows.find(
      (item) => item.level === 1 && item.name === workOrder.category1,
    ) ?? null;
  const category2 =
    result.rows.find(
      (item) =>
        item.level === 2 &&
        item.name === workOrder.category2 &&
        (!category1 || item.parent_id === category1.id),
    ) ?? null;
  const category3 =
    result.rows.find(
      (item) =>
        item.level === 3 &&
        item.name === workOrder.category3 &&
        (!category2 || item.parent_id === category2.id),
    ) ?? null;

  return {
    category1Id: category1?.id ?? null,
    category2Id: category2?.id ?? null,
    category3Id: category3?.id ?? null,
  };
}
