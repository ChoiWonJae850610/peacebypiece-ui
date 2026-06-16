import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrderCompanyScope } from "@/lib/workorder/service/workOrderService";
import {
  createEmptyWorkOrderFactoryInstruction,
  normalizeWorkOrderFactoryInstructionContent,
  type WorkOrderFactoryInstruction,
} from "@/lib/workorder/factoryInstruction/types";

type FactoryInstructionRow = {
  work_order_id: string;
  content: string | null;
  include_in_factory_pdf: boolean | null;
  updated_at: string | Date | null;
};

function toIsoString(value: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapRow(row: FactoryInstructionRow): WorkOrderFactoryInstruction {
  return {
    workOrderId: row.work_order_id,
    content: normalizeWorkOrderFactoryInstructionContent(row.content),
    includeInFactoryPdf: row.include_in_factory_pdf !== false,
    updatedAt: toIsoString(row.updated_at),
  };
}

export async function getWorkOrderFactoryInstruction(
  workOrderId: string,
  scope: WorkOrderCompanyScope,
): Promise<WorkOrderFactoryInstruction> {
  const result = await queryDb<FactoryInstructionRow>(
    `
      SELECT
        instruction.work_order_id,
        instruction.content,
        instruction.include_in_factory_pdf,
        instruction.updated_at
      FROM workorder_factory_instructions instruction
      INNER JOIN spec_sheets work_order
        ON work_order.id = instruction.work_order_id
       AND work_order.company_id = instruction.company_id
      WHERE instruction.work_order_id = $1
        AND instruction.company_id = $2
        AND work_order.is_active = TRUE
        AND work_order.deleted_at IS NULL
      LIMIT 1
    `,
    [workOrderId, scope.companyId],
  );

  return result.rows[0]
    ? mapRow(result.rows[0])
    : createEmptyWorkOrderFactoryInstruction(workOrderId);
}

export async function saveWorkOrderFactoryInstruction(input: {
  workOrderId: string;
  companyId: string;
  content: string;
  includeInFactoryPdf: boolean;
  updatedByUserId: string;
}): Promise<WorkOrderFactoryInstruction> {
  const content = normalizeWorkOrderFactoryInstructionContent(input.content);

  if (!content) {
    await queryDb(
      `
        DELETE FROM workorder_factory_instructions
        WHERE work_order_id = $1
          AND company_id = $2
      `,
      [input.workOrderId, input.companyId],
    );

    return createEmptyWorkOrderFactoryInstruction(input.workOrderId);
  }

  const result = await queryDb<FactoryInstructionRow>(
    `
      INSERT INTO workorder_factory_instructions (
        work_order_id,
        company_id,
        content,
        include_in_factory_pdf,
        updated_by_user_id,
        created_at,
        updated_at
      )
      SELECT
        work_order.id,
        work_order.company_id,
        $3,
        $4,
        $5,
        now(),
        now()
      FROM spec_sheets work_order
      WHERE work_order.id = $1
        AND work_order.company_id = $2
        AND work_order.is_active = TRUE
        AND work_order.deleted_at IS NULL
      ON CONFLICT (work_order_id)
      DO UPDATE SET
        content = EXCLUDED.content,
        include_in_factory_pdf = EXCLUDED.include_in_factory_pdf,
        updated_by_user_id = EXCLUDED.updated_by_user_id,
        updated_at = now()
      RETURNING
        work_order_id,
        content,
        include_in_factory_pdf,
        updated_at
    `,
    [
      input.workOrderId,
      input.companyId,
      content,
      input.includeInFactoryPdf,
      input.updatedByUserId,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("WORKORDER_NOT_FOUND");
  }

  return mapRow(row);
}
