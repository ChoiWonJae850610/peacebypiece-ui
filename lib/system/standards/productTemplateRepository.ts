import "server-only";

import { randomUUID } from "crypto";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";
import {
  toSystemProductTemplateStatus,
  type SystemProductTemplateCategoryCreateInput,
  type SystemProductTemplateCategoryUpdateInput,
  type SystemProductTemplateLeaf,
  type SystemProductTemplateRow,
  type SystemProductTemplateSecondLevel,
  type SystemProductTemplateTopLevel,
  type SystemProductTemplateUpdateInput,
  type SystemProductTemplateUpsertInput,
} from "@/lib/system/standards/systemProductTemplateStandards";

const SYSTEM_TEMPLATE_CODE_PATTERN = /^[a-z][a-z0-9_-]{1,59}$/;

type SystemProductTemplateDbRow = DbQueryResultRow & {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
};

type SystemProductTemplateCategoryDbRow = DbQueryResultRow & {
  id: string;
  template_id: string;
  parent_id: string | null;
  level: number;
  name: string;
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

function assertTemplateInput(input: SystemProductTemplateUpsertInput | SystemProductTemplateUpdateInput): void {
  if ("code" in input && input.code !== undefined && !SYSTEM_TEMPLATE_CODE_PATTERN.test(normalizeCode(input.code))) {
    throw new Error("템플릿 코드는 영문 소문자로 시작하고 영문/숫자/하이픈/밑줄만 사용할 수 있습니다.");
  }

  if ("name" in input && input.name !== undefined && normalizeText(input.name).length === 0) {
    throw new Error("템플릿명을 입력해야 합니다.");
  }
}

function assertCategoryInput(input: SystemProductTemplateCategoryCreateInput | SystemProductTemplateCategoryUpdateInput): void {
  if ("name" in input && input.name !== undefined && normalizeText(input.name).length === 0) {
    throw new Error("분류명을 입력해야 합니다.");
  }

  if ("level" in input && input.level !== undefined && ![1, 2, 3].includes(input.level)) {
    throw new Error("생산품 유형 템플릿 분류 단계는 1차, 2차, 3차만 사용할 수 있습니다.");
  }
}

function toTemplateRow(template: SystemProductTemplateDbRow, categories: SystemProductTemplateCategoryDbRow[]): SystemProductTemplateRow {
  const topLevelRows = categories
    .filter((category) => category.template_id === template.id && category.level === 1)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko"));

  const tree: SystemProductTemplateTopLevel[] = topLevelRows.map((top): SystemProductTemplateTopLevel => {
    const secondRows = categories
      .filter((category) => category.template_id === template.id && category.parent_id === top.id && category.level === 2)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko"));

    const children: SystemProductTemplateSecondLevel[] = secondRows.map((second): SystemProductTemplateSecondLevel => {
      const leafRows = categories
        .filter((category) => category.template_id === template.id && category.parent_id === second.id && category.level === 3)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko"));

      const leaves: SystemProductTemplateLeaf[] = leafRows.map((leaf) => ({
        id: leaf.id,
        name: leaf.name,
        description: "",
        isActive: leaf.is_active,
        sortOrder: leaf.sort_order,
      }));

      return {
        id: second.id,
        name: second.name,
        isActive: second.is_active,
        sortOrder: second.sort_order,
        children: leaves,
      };
    });

    return {
      id: top.id,
      name: top.name,
      isActive: top.is_active,
      sortOrder: top.sort_order,
      children,
    };
  });

  return {
    id: template.id,
    code: template.code,
    name: template.name,
    description: template.description ?? "",
    isDefault: template.is_default,
    status: toSystemProductTemplateStatus(template.is_active),
    sortOrder: template.sort_order,
    tree,
    createdAt: toIso(template.created_at),
    updatedAt: toIso(template.updated_at),
  };
}

async function listTemplateCategories(): Promise<SystemProductTemplateCategoryDbRow[]> {
  const result = await queryDb<SystemProductTemplateCategoryDbRow>(
    `SELECT id,
            template_id,
            parent_id,
            level,
            name,
            is_active,
            sort_order,
            created_at,
            updated_at
       FROM system_product_type_template_categories
      ORDER BY template_id ASC, level ASC, sort_order ASC, name ASC`,
  );

  return result.rows;
}

export async function listSystemProductTemplates(): Promise<SystemProductTemplateRow[]> {
  if (!isDatabaseConfigured()) return [];

  const [templateResult, categories] = await Promise.all([
    queryDb<SystemProductTemplateDbRow>(
      `SELECT id,
              code,
              name,
              description,
              is_default,
              is_active,
              sort_order,
              created_at,
              updated_at
         FROM system_product_type_templates
        ORDER BY sort_order ASC, name ASC`,
    ),
    listTemplateCategories(),
  ]);

  return templateResult.rows.map((template) => toTemplateRow(template, categories));
}

export async function createSystemProductTemplate(input: SystemProductTemplateUpsertInput): Promise<SystemProductTemplateRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 생산품 유형 템플릿을 추가할 수 있습니다.");
  }

  assertTemplateInput(input);

  const code = normalizeCode(input.code);
  const id = input.id?.trim() || `template-${code}-${randomUUID().slice(0, 8)}`;
  const name = normalizeText(input.name);
  const description = normalizeOptionalText(input.description);
  const isDefault = input.isDefault ?? false;
  const isActive = input.isActive ?? true;
  const sortOrder = normalizeSortOrder(input.sortOrder);

  const result = await queryDb<SystemProductTemplateDbRow>(
    `INSERT INTO system_product_type_templates (
       id,
       code,
       name,
       description,
       is_default,
       is_active,
       sort_order,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     RETURNING id,
               code,
               name,
               description,
               is_default,
               is_active,
               sort_order,
               created_at,
               updated_at`,
    [id, code, name, description, isDefault, isActive, sortOrder],
  );

  const created = result.rows[0];
  if (!created) throw new Error("생산품 유형 템플릿 추가 결과를 확인하지 못했습니다.");
  return toTemplateRow(created, []);
}

export async function updateSystemProductTemplate(input: SystemProductTemplateUpdateInput): Promise<SystemProductTemplateRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 생산품 유형 템플릿을 수정할 수 있습니다.");
  }

  assertTemplateInput(input);

  const assignments: string[] = [];
  const params: unknown[] = [input.id];

  function pushAssignment(column: string, value: unknown): void {
    params.push(value);
    assignments.push(`${column} = $${params.length}`);
  }

  if (input.code !== undefined) pushAssignment("code", normalizeCode(input.code));
  if (input.name !== undefined) pushAssignment("name", normalizeText(input.name));
  if (input.description !== undefined) pushAssignment("description", normalizeOptionalText(input.description));
  if (input.isDefault !== undefined) pushAssignment("is_default", input.isDefault);
  if (input.isActive !== undefined) pushAssignment("is_active", input.isActive);
  if (input.sortOrder !== undefined) pushAssignment("sort_order", normalizeSortOrder(input.sortOrder));

  if (assignments.length === 0) {
    throw new Error("수정할 생산품 유형 템플릿 값이 없습니다.");
  }

  assignments.push("updated_at = now()");

  const result = await queryDb<SystemProductTemplateDbRow>(
    `UPDATE system_product_type_templates
        SET ${assignments.join(",\n            ")}
      WHERE id = $1
      RETURNING id,
                code,
                name,
                description,
                is_default,
                is_active,
                sort_order,
                created_at,
                updated_at`,
    params,
  );

  const updated = result.rows[0];
  if (!updated) throw new Error("수정할 생산품 유형 템플릿을 찾지 못했습니다.");

  const categories = await listTemplateCategories();
  return toTemplateRow(updated, categories);
}

export async function createSystemProductTemplateCategory(
  input: SystemProductTemplateCategoryCreateInput,
): Promise<SystemProductTemplateRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 생산품 유형 템플릿 분류를 추가할 수 있습니다.");
  }

  assertCategoryInput(input);

  const templateId = normalizeText(input.templateId);
  const parentId = input.parentId ? normalizeText(input.parentId) : null;
  const name = normalizeText(input.name);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const isActive = input.isActive ?? true;
  const id = `${templateId}:${parentId ? `${parentId.split(":").pop()}:` : ""}${name}-${randomUUID().slice(0, 6)}`;

  await queryDb(
    `INSERT INTO system_product_type_template_categories (
       id,
       template_id,
       parent_id,
       level,
       name,
       is_active,
       sort_order,
       created_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
    [id, templateId, parentId, input.level, name, isActive, sortOrder],
  );

  const templates = await listSystemProductTemplates();
  const template = templates.find((item) => item.id === templateId);
  if (!template) throw new Error("분류를 추가한 템플릿을 찾지 못했습니다.");
  return template;
}

export async function updateSystemProductTemplateCategory(
  input: SystemProductTemplateCategoryUpdateInput,
): Promise<SystemProductTemplateRow> {
  if (!isDatabaseConfigured()) {
    throw new Error("DB 연결 후 생산품 유형 템플릿 분류를 수정할 수 있습니다.");
  }

  assertCategoryInput(input);

  const assignments: string[] = [];
  const params: unknown[] = [input.id];

  function pushAssignment(column: string, value: unknown): void {
    params.push(value);
    assignments.push(`${column} = $${params.length}`);
  }

  if (input.name !== undefined) pushAssignment("name", normalizeText(input.name));
  if (input.isActive !== undefined) pushAssignment("is_active", input.isActive);
  if (input.sortOrder !== undefined) pushAssignment("sort_order", normalizeSortOrder(input.sortOrder));

  if (assignments.length === 0) {
    throw new Error("수정할 생산품 유형 템플릿 분류 값이 없습니다.");
  }

  assignments.push("updated_at = now()");

  const result = await queryDb<SystemProductTemplateCategoryDbRow>(
    `UPDATE system_product_type_template_categories
        SET ${assignments.join(",\n            ")}
      WHERE id = $1
      RETURNING id,
                template_id,
                parent_id,
                level,
                name,
                is_active,
                sort_order,
                created_at,
                updated_at`,
    params,
  );

  const updated = result.rows[0];
  if (!updated) throw new Error("수정할 생산품 유형 템플릿 분류를 찾지 못했습니다.");

  const templates = await listSystemProductTemplates();
  const template = templates.find((item) => item.id === updated.template_id);
  if (!template) throw new Error("분류를 수정한 템플릿을 찾지 못했습니다.");
  return template;
}
