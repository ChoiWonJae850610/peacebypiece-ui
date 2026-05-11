import "server-only";

import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";

export type SystemStandardsRegressionCheckId =
  | "dbConnection"
  | "unitSeed"
  | "processSeed"
  | "defaultProductTemplate"
  | "templateCategorySeed"
  | "unitCompanyLinks"
  | "processCompanyLinks";

export type SystemStandardsRegressionCheck = {
  id: SystemStandardsRegressionCheckId;
  label: string;
  status: "pass" | "warn" | "fail";
  valueLabel: string;
  detail: string;
};

export type SystemStandardsRegressionSnapshot = {
  mode: "db" | "unavailable";
  ready: boolean;
  generatedAt: string;
  checks: SystemStandardsRegressionCheck[];
  summary: string;
};

type CountRow = DbQueryResultRow & {
  total_count: string | number;
  active_count?: string | number;
};

type OrphanCountRow = DbQueryResultRow & {
  orphan_count: string | number;
};

function toNumber(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function toStatus(ok: boolean, warn = false): "pass" | "warn" | "fail" {
  if (ok) return "pass";
  return warn ? "warn" : "fail";
}

async function countWithActive(tableName: string): Promise<{ total: number; active: number }> {
  const result = await queryDb<CountRow>(
    `SELECT count(*)::int AS total_count,
            COALESCE(sum(CASE WHEN is_active THEN 1 ELSE 0 END), 0)::int AS active_count
       FROM ${tableName}`,
  );
  const row = result.rows[0];
  return {
    total: toNumber(row?.total_count),
    active: toNumber(row?.active_count),
  };
}

async function countDefaultTemplate(): Promise<{ total: number; active: number }> {
  const result = await queryDb<CountRow>(
    `SELECT count(*)::int AS total_count,
            COALESCE(sum(CASE WHEN is_active AND is_default THEN 1 ELSE 0 END), 0)::int AS active_count
       FROM system_product_type_templates`,
  );
  const row = result.rows[0];
  return {
    total: toNumber(row?.total_count),
    active: toNumber(row?.active_count),
  };
}

async function countDefaultTemplateCategories(): Promise<{ total: number; active: number }> {
  const result = await queryDb<CountRow>(
    `SELECT count(c.*)::int AS total_count,
            COALESCE(sum(CASE WHEN c.is_active THEN 1 ELSE 0 END), 0)::int AS active_count
       FROM system_product_type_template_categories c
       JOIN system_product_type_templates t ON t.id = c.template_id
      WHERE t.is_default = true
        AND t.is_active = true`,
  );
  const row = result.rows[0];
  return {
    total: toNumber(row?.total_count),
    active: toNumber(row?.active_count),
  };
}

async function countUnitOrphans(): Promise<number> {
  const result = await queryDb<OrphanCountRow>(
    `SELECT count(*)::int AS orphan_count
       FROM company_enabled_unit_standards enabled
       LEFT JOIN system_unit_standards standard ON standard.id = enabled.unit_standard_id
      WHERE standard.id IS NULL`,
  );
  return toNumber(result.rows[0]?.orphan_count);
}

async function countProcessOrphans(): Promise<number> {
  const result = await queryDb<OrphanCountRow>(
    `SELECT count(*)::int AS orphan_count
       FROM company_enabled_process_standards enabled
       LEFT JOIN system_outsourcing_process_standards standard ON standard.id = enabled.process_standard_id
      WHERE standard.id IS NULL`,
  );
  return toNumber(result.rows[0]?.orphan_count);
}

export async function getSystemStandardsRegressionSnapshot(): Promise<SystemStandardsRegressionSnapshot> {
  const generatedAt = new Date().toISOString();

  if (!isDatabaseConfigured()) {
    return {
      mode: "unavailable",
      ready: false,
      generatedAt,
      checks: [
        {
          id: "dbConnection",
          label: "DB 연결",
          status: "fail",
          valueLabel: "DB 미설정",
          detail: "기준정보는 DB-only 정책이므로 DB 연결이 없으면 기준정보를 표시하지 않습니다.",
        },
      ],
      summary: "DB가 설정되지 않아 기준정보 DB-only 회귀 점검을 실행할 수 없습니다.",
    };
  }

  const [units, processes, defaultTemplates, defaultTemplateCategories, unitOrphans, processOrphans] = await Promise.all([
    countWithActive("system_unit_standards"),
    countWithActive("system_outsourcing_process_standards"),
    countDefaultTemplate(),
    countDefaultTemplateCategories(),
    countUnitOrphans(),
    countProcessOrphans(),
  ]);

  const checks: SystemStandardsRegressionCheck[] = [
    {
      id: "dbConnection",
      label: "DB 연결",
      status: "pass",
      valueLabel: "DB 연결됨",
      detail: "기준정보 조회가 DB 전용 경로로 실행됩니다.",
    },
    {
      id: "unitSeed",
      label: "단위 표준 seed",
      status: toStatus(units.active >= 7),
      valueLabel: `활성 ${units.active}개 / 전체 ${units.total}개`,
      detail: "작업지시서 단위와 단가 기준 선택지의 기준 원장입니다. 최소 활성 7개를 권장합니다.",
    },
    {
      id: "processSeed",
      label: "외주공정 유형 seed",
      status: toStatus(processes.active >= 5),
      valueLabel: `활성 ${processes.active}개 / 전체 ${processes.total}개`,
      detail: "협력업체 외주공정 선택지의 기준 원장입니다. 최소 활성 5개를 권장합니다.",
    },
    {
      id: "defaultProductTemplate",
      label: "기본 생산품 템플릿",
      status: toStatus(defaultTemplates.active === 1, defaultTemplates.active > 1),
      valueLabel: `기본 활성 ${defaultTemplates.active}개 / 전체 ${defaultTemplates.total}개`,
      detail: "고객관리자 생산품 유형 기본값 복원은 시스템관리자가 기본으로 지정한 활성 템플릿 1개만 사용합니다.",
    },
    {
      id: "templateCategorySeed",
      label: "기본 템플릿 분류",
      status: toStatus(defaultTemplateCategories.active >= 9),
      valueLabel: `활성 ${defaultTemplateCategories.active}개 / 전체 ${defaultTemplateCategories.total}개`,
      detail: "기본 템플릿의 1차→2차→3차 분류입니다. 최소 활성 9개를 권장합니다.",
    },
    {
      id: "unitCompanyLinks",
      label: "고객사 단위 연결 무결성",
      status: toStatus(unitOrphans === 0),
      valueLabel: `누락 원장 연결 ${unitOrphans}건`,
      detail: "company_enabled_unit_standards가 존재하지 않는 system_unit_standards를 참조하지 않아야 합니다.",
    },
    {
      id: "processCompanyLinks",
      label: "고객사 외주공정 연결 무결성",
      status: toStatus(processOrphans === 0),
      valueLabel: `누락 원장 연결 ${processOrphans}건`,
      detail: "company_enabled_process_standards가 존재하지 않는 system_outsourcing_process_standards를 참조하지 않아야 합니다.",
    },
  ];

  const ready = checks.every((check) => check.status === "pass");
  const warnCount = checks.filter((check) => check.status === "warn").length;
  const failCount = checks.filter((check) => check.status === "fail").length;

  return {
    mode: "db",
    ready,
    generatedAt,
    checks,
    summary:
      failCount === 0 && warnCount === 0
        ? "기준정보 DB-only 회귀 점검이 통과했습니다."
        : `기준정보 DB-only 회귀 점검에서 경고 ${warnCount}건, 실패 ${failCount}건이 확인되었습니다.`,
  };
}
