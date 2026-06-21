import "server-only";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";

export type SystemStandardsSeedStatusItem = {
  id: "units" | "processes" | "productTemplates" | "productTemplateCategories";
  label: string;
  tableName: string;
  count: number;
  activeCount: number;
  minimumActiveCount: number;
  required: boolean;
  ready: boolean;
  description: string;
};

export type SystemStandardsSeedStatus = {
  mode: "db" | "unavailable";
  ready: boolean;
  items: SystemStandardsSeedStatusItem[];
  message: string;
};

type CountRow = DbQueryResultRow & {
  total_count: string | number;
  active_count: string | number;
};

function toNumber(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

async function countTable(tableName: string): Promise<{ count: number; activeCount: number }> {
  const result = await queryDb<CountRow>(
    `SELECT count(*)::int AS total_count,
            COALESCE(sum(CASE WHEN is_active THEN 1 ELSE 0 END), 0)::int AS active_count
       FROM ${tableName}`,
  );
  const row = result.rows[0];
  return {
    count: toNumber(row?.total_count),
    activeCount: toNumber(row?.active_count),
  };
}

export async function getSystemStandardsSeedStatus(): Promise<SystemStandardsSeedStatus> {
  if (!isDatabaseConfigured()) {
    return {
      mode: "unavailable",
      ready: false,
      items: [],
      message: "DB가 설정되지 않아 시스템 기준정보 seed 상태를 확인할 수 없습니다.",
    };
  }

  const [units, processes, templates, templateCategories] = await Promise.all([
    countTable("system_unit_standards"),
    countTable("system_outsourcing_process_standards"),
    countTable("system_product_type_templates"),
    countTable("system_product_type_template_categories"),
  ]);

  const items: SystemStandardsSeedStatusItem[] = [
    {
      id: "units",
      label: "단위 표준",
      tableName: "system_unit_standards",
      count: units.count,
      activeCount: units.activeCount,
      minimumActiveCount: 7,
      required: true,
      ready: units.activeCount >= 7,
      description: "고객관리자 단위 표준 선택과 작업지시서 단위/단가 기준 선택지의 원장입니다.",
    },
    {
      id: "processes",
      label: "외주공정 유형",
      tableName: "system_outsourcing_process_standards",
      count: processes.count,
      activeCount: processes.activeCount,
      minimumActiveCount: 5,
      required: true,
      ready: processes.activeCount >= 5,
      description: "고객관리자 외주공정 사용 여부와 협력업체 외주공정 선택지의 원장입니다.",
    },
    {
      id: "productTemplates",
      label: "생산품 유형 기본 템플릿",
      tableName: "system_product_type_templates",
      count: templates.count,
      activeCount: templates.activeCount,
      minimumActiveCount: 1,
      required: true,
      ready: templates.activeCount >= 1,
      description: "고객관리자 생산품 유형 기본값 복원에 사용할 템플릿 원장입니다.",
    },
    {
      id: "productTemplateCategories",
      label: "생산품 유형 템플릿 분류",
      tableName: "system_product_type_template_categories",
      count: templateCategories.count,
      activeCount: templateCategories.activeCount,
      minimumActiveCount: 9,
      required: true,
      ready: templateCategories.activeCount >= 9,
      description: "기본 템플릿의 1차→2차→3차 분류 데이터입니다.",
    },
  ];

  const ready = items.every((item) => !item.required || item.ready);

  return {
    mode: "db",
    ready,
    items,
    message: ready
      ? "시스템 기준정보 seed가 준비되어 있습니다."
      : "시스템 기준정보 seed가 비어 있거나 일부 부족합니다. 기존 DB 유지 시 db/seed/system_standards_seed.sql을 승인된 개발 DB 절차로 실행하세요.",
  };
}
