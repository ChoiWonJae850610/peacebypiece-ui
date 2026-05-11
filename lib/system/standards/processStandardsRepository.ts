import "server-only";

import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";
import {
  toSystemProcessStandardStatus,
  type SystemProcessStandardRow,
  type SystemProcessStandardUpdateInput,
  type SystemProcessStandardUpsertInput,
} from "@/lib/system/standards/systemProcessStandards";

const SYSTEM_PROCESS_CODE_PATTERN = /^[a-z][a-z0-9_-]{1,39}$/;

type SystemProcessStandardDbRow = DbQueryResultRow & {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  example_label: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const text = normalizeText(value);
  return text.length > 0 ? text : null;
}

function normalizeSortOrder(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function normalizeCode(value: unknown): string {
  return normalizeText(value).toLowerCase().replace(/\s+/g, "-");
}

function assertSystemProcessStandardInput(input: SystemProcessStandardUpsertInput | SystemProcessStandardUpdateInput): void {
  if ("code" in input && input.code !== undefined && !SYSTEM_PROCESS_CODE_PATTERN.test(normalizeCode(input.code))) {
    throw new Error("공정 코드는 영문 소문자로 시작하고 영문/숫자/하이픈/밑줄만 사용할 수 있습니다.");
  }

  if ("name" in input && input.name !== undefined && normalizeText(input.name).length === 0) {
    throw new Error("공정명을 입력해야 합니다.");
  }
}

function toSystemProcessStandardRow(row: SystemProcessStandardDbRow): SystemProcessStandardRow {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    description: row.description ?? "",
    example: row.example_label ?? "",
    status: toSystemProcessStandardStatus(row.is_active),
    sortOrder: row.sort_order,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listSystemProcessStandards(): Promise<SystemProcessStandardRow[]> {
  if (!isDatabaseConfigured()) return [];

  const result = await queryDb<SystemProcessStandardDbRow>(
    `SELECT id,
            code,
            name,
            category,
            description,
            example_label,
            is_active,
            sort_order,
            created_at,
            updated_at
       FROM system_outsourcing_process_standards
      ORDER BY sort_order ASC, name ASC`,
  );

  return result.rows.map(toSystemProcessStandardRow);
}

export async function createSystemProcessStandard(
  input: SystemProcessStandardUpsertInput,
): Promise<SystemProcessStandardRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 외주공정 유형을 추가할 수 있습니다.");
  }

  assertSystemProcessStandardInput(input);

  const code = normalizeCode(input.code);
  const id = input.id?.trim() || `system-process-${code}-${randomUUID().slice(0, 8)}`;
  const name = normalizeText(input.name);
  const category = normalizeText(input.category) || "general";
  const description = normalizeOptionalText(input.description);
  const example = normalizeOptionalText(input.example);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const isActive = input.isActive ?? true;

  const result = await queryDb<SystemProcessStandardDbRow>(
    `INSERT INTO system_outsourcing_process_standards (
       id,
       code,
       name,
       category,
       description,
       example_label,
       is_active,
       sort_order,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
     RETURNING id,
               code,
               name,
               category,
               description,
               example_label,
               is_active,
               sort_order,
               created_at,
               updated_at`,
    [id, code, name, category, description, example, isActive, sortOrder],
  );

  const created = result.rows[0];
  if (!created) throw new Error("외주공정 유형 추가 결과를 확인하지 못했습니다.");
  return toSystemProcessStandardRow(created);
}

export async function updateSystemProcessStandard(
  input: SystemProcessStandardUpdateInput,
): Promise<SystemProcessStandardRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 외주공정 유형을 수정할 수 있습니다.");
  }

  assertSystemProcessStandardInput(input);

  const assignments: string[] = [];
  const params: unknown[] = [input.id];

  function pushAssignment(column: string, value: unknown): void {
    params.push(value);
    assignments.push(`${column} = $${params.length}`);
  }

  if (input.code !== undefined) pushAssignment("code", normalizeCode(input.code));
  if (input.name !== undefined) pushAssignment("name", normalizeText(input.name));
  if (input.category !== undefined) pushAssignment("category", normalizeText(input.category) || "general");
  if (input.description !== undefined) pushAssignment("description", normalizeOptionalText(input.description));
  if (input.example !== undefined) pushAssignment("example_label", normalizeOptionalText(input.example));
  if (input.isActive !== undefined) pushAssignment("is_active", input.isActive);
  if (input.sortOrder !== undefined) pushAssignment("sort_order", normalizeSortOrder(input.sortOrder));

  if (assignments.length === 0) {
    throw new Error("수정할 외주공정 유형 값이 없습니다.");
  }

  assignments.push("updated_at = now()");

  const result = await queryDb<SystemProcessStandardDbRow>(
    `UPDATE system_outsourcing_process_standards
        SET ${assignments.join(",\n            ")}
      WHERE id = $1
      RETURNING id,
                code,
                name,
                category,
                description,
                example_label,
                is_active,
                sort_order,
                created_at,
                updated_at`,
    params,
  );

  const updated = result.rows[0];
  if (!updated) throw new Error("수정할 외주공정 유형을 찾지 못했습니다.");
  return toSystemProcessStandardRow(updated);
}
