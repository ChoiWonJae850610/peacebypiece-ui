import "server-only";

import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";
import {
  toSystemUnitStandardStatus,
  type SystemUnitStandardRow,
  type SystemUnitStandardUpdateInput,
  type SystemUnitStandardUpsertInput,
} from "@/lib/system/standards/systemUnitStandards";

const SYSTEM_UNIT_CODE_PATTERN = /^[a-z][a-z0-9_-]{1,39}$/;

type SystemUnitStandardDbRow = DbQueryResultRow & {
  id: string;
  code: string;
  korean_name: string;
  english_code: string;
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
  const text = normalizeText(value).toLowerCase().replace(/\s+/g, "-");
  return text;
}

function assertSystemUnitStandardInput(input: SystemUnitStandardUpsertInput | SystemUnitStandardUpdateInput): void {
  if ("code" in input && input.code !== undefined && !SYSTEM_UNIT_CODE_PATTERN.test(normalizeCode(input.code))) {
    throw new Error("단위 코드는 영문 소문자로 시작하고 영문/숫자/하이픈/밑줄만 사용할 수 있습니다.");
  }

  if ("koreanName" in input && input.koreanName !== undefined && normalizeText(input.koreanName).length === 0) {
    throw new Error("한글명을 입력해야 합니다.");
  }

  if ("englishCode" in input && input.englishCode !== undefined && normalizeText(input.englishCode).length === 0) {
    throw new Error("영문 코드/약어를 입력해야 합니다.");
  }
}

function toSystemUnitStandardRow(row: SystemUnitStandardDbRow): SystemUnitStandardRow {
  return {
    id: row.id,
    code: row.code,
    koreanName: row.korean_name,
    englishCode: row.english_code,
    category: row.category,
    description: row.description ?? "",
    example: row.example_label ?? "",
    status: toSystemUnitStandardStatus(row.is_active),
    sortOrder: row.sort_order,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listSystemUnitStandards(): Promise<SystemUnitStandardRow[]> {
  if (!isDatabaseConfigured()) return [];

  const result = await queryDb<SystemUnitStandardDbRow>(
    `SELECT id,
            code,
            korean_name,
            english_code,
            category,
            description,
            example_label,
            is_active,
            sort_order,
            created_at,
            updated_at
       FROM system_unit_standards
      ORDER BY sort_order ASC, korean_name ASC`,
  );

  return result.rows.map(toSystemUnitStandardRow);
}

export async function createSystemUnitStandard(input: SystemUnitStandardUpsertInput): Promise<SystemUnitStandardRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 단위 표준을 추가할 수 있습니다.");
  }

  assertSystemUnitStandardInput(input);

  const code = normalizeCode(input.code);
  const id = input.id?.trim() || `system-unit-${code}-${randomUUID().slice(0, 8)}`;
  const koreanName = normalizeText(input.koreanName);
  const englishCode = normalizeText(input.englishCode);
  const category = normalizeText(input.category) || "general";
  const description = normalizeOptionalText(input.description);
  const example = normalizeOptionalText(input.example);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const isActive = input.isActive ?? true;

  const result = await queryDb<SystemUnitStandardDbRow>(
    `INSERT INTO system_unit_standards (
       id,
       code,
       korean_name,
       english_code,
       category,
       description,
       example_label,
       is_active,
       sort_order,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
     RETURNING id,
               code,
               korean_name,
               english_code,
               category,
               description,
               example_label,
               is_active,
               sort_order,
               created_at,
               updated_at`,
    [id, code, koreanName, englishCode, category, description, example, isActive, sortOrder],
  );

  const created = result.rows[0];
  if (!created) throw new Error("단위 표준 추가 결과를 확인하지 못했습니다.");
  return toSystemUnitStandardRow(created);
}

export async function updateSystemUnitStandard(input: SystemUnitStandardUpdateInput): Promise<SystemUnitStandardRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 단위 표준을 수정할 수 있습니다.");
  }

  assertSystemUnitStandardInput(input);

  const assignments: string[] = [];
  const params: unknown[] = [input.id];

  function pushAssignment(column: string, value: unknown): void {
    params.push(value);
    assignments.push(`${column} = $${params.length}`);
  }

  if (input.code !== undefined) pushAssignment("code", normalizeCode(input.code));
  if (input.koreanName !== undefined) pushAssignment("korean_name", normalizeText(input.koreanName));
  if (input.englishCode !== undefined) pushAssignment("english_code", normalizeText(input.englishCode));
  if (input.category !== undefined) pushAssignment("category", normalizeText(input.category) || "general");
  if (input.description !== undefined) pushAssignment("description", normalizeOptionalText(input.description));
  if (input.example !== undefined) pushAssignment("example_label", normalizeOptionalText(input.example));
  if (input.isActive !== undefined) pushAssignment("is_active", input.isActive);
  if (input.sortOrder !== undefined) pushAssignment("sort_order", normalizeSortOrder(input.sortOrder));

  if (assignments.length === 0) {
    throw new Error("수정할 단위 표준 값이 없습니다.");
  }

  assignments.push("updated_at = now()");

  const result = await queryDb<SystemUnitStandardDbRow>(
    `UPDATE system_unit_standards
        SET ${assignments.join(",\n            ")}
      WHERE id = $1
      RETURNING id,
                code,
                korean_name,
                english_code,
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
  if (!updated) throw new Error("수정할 단위 표준을 찾지 못했습니다.");
  return toSystemUnitStandardRow(updated);
}
