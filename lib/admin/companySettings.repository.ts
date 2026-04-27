import "server-only";

import { queryDb } from "@/lib/db/client";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import type { AdminCompanySummary, CompanySettings } from "@/lib/admin/companySettings.types";

type CompanyRow = Record<string, unknown> & {
  id: string;
  name: string;
  memo: string | null;
  is_active: boolean;
};

type CompanySettingsRow = Record<string, unknown> & {
  company_id: string;
  theme_color: string | null;
  language: string | null;
  compact_mode: boolean | null;
  soft_delete_enabled: boolean | null;
  include_trash_in_usage: boolean | null;
  trash_retention_days: number | null;
  storage_limit_gb: number | null;
  warning_threshold_percent: number | null;
  review_request_enabled: boolean | null;
  order_ready_enabled: boolean | null;
  storage_warning_enabled: boolean | null;
  purge_result_enabled: boolean | null;
  updated_at: Date | string | null;
};

function mapCompanyRow(row: CompanyRow): AdminCompanySummary {
  return {
    id: row.id,
    name: row.name,
    memo: row.memo,
    isActive: row.is_active,
  };
}

function isThemeColor(value: string | null): value is CompanySettings["ui"]["themeColor"] {
  return value === "blue" || value === "emerald" || value === "violet" || value === "stone";
}

function isLanguage(value: string | null): value is CompanySettings["ui"]["language"] {
  return value === "ko" || value === "en";
}

function mapSettingsRow(row: CompanySettingsRow): CompanySettings {
  const fallback = buildDefaultCompanySettings(row.company_id);

  return {
    companyId: row.company_id,
    ui: {
      themeColor: isThemeColor(row.theme_color) ? row.theme_color : fallback.ui.themeColor,
      language: isLanguage(row.language) ? row.language : fallback.ui.language,
      compactMode: row.compact_mode ?? fallback.ui.compactMode,
    },
    filePolicy: {
      softDeleteEnabled: row.soft_delete_enabled ?? fallback.filePolicy.softDeleteEnabled,
      includeTrashInUsage: row.include_trash_in_usage ?? fallback.filePolicy.includeTrashInUsage,
      trashRetentionDays: row.trash_retention_days ?? fallback.filePolicy.trashRetentionDays,
      storageLimitGb: row.storage_limit_gb ?? fallback.filePolicy.storageLimitGb,
      warningThresholdPercent: row.warning_threshold_percent ?? fallback.filePolicy.warningThresholdPercent,
    },
    notificationPolicy: {
      reviewRequestEnabled: row.review_request_enabled ?? fallback.notificationPolicy.reviewRequestEnabled,
      orderReadyEnabled: row.order_ready_enabled ?? fallback.notificationPolicy.orderReadyEnabled,
      storageWarningEnabled: row.storage_warning_enabled ?? fallback.notificationPolicy.storageWarningEnabled,
      purgeResultEnabled: row.purge_result_enabled ?? fallback.notificationPolicy.purgeResultEnabled,
    },
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export async function listAdminCompanies(): Promise<AdminCompanySummary[]> {
  const result = await queryDb<CompanyRow>(
    `SELECT id, name, memo, is_active
     FROM companies
     ORDER BY is_active DESC, name ASC`,
  );

  return result.rows.map(mapCompanyRow);
}

export async function getCurrentAdminCompany(): Promise<AdminCompanySummary> {
  const result = await queryDb<CompanyRow>(
    `SELECT id, name, memo, is_active
     FROM companies
     WHERE id = $1
     LIMIT 1`,
    [WORKSPACE_COMPANY_ID],
  );

  const row = result.rows[0];
  return row ? mapCompanyRow(row) : { id: WORKSPACE_COMPANY_ID, name: WORKSPACE_COMPANY_NAME, memo: null, isActive: true };
}

export async function getCompanySettings(companyId: string): Promise<CompanySettings> {
  const result = await queryDb<CompanySettingsRow>(
    `SELECT company_id,
            theme_color,
            language,
            compact_mode,
            soft_delete_enabled,
            include_trash_in_usage,
            trash_retention_days,
            storage_limit_gb,
            warning_threshold_percent,
            review_request_enabled,
            order_ready_enabled,
            storage_warning_enabled,
            purge_result_enabled,
            updated_at
     FROM company_settings
     WHERE company_id = $1
     LIMIT 1`,
    [companyId],
  );

  const row = result.rows[0];
  return row ? mapSettingsRow(row) : buildDefaultCompanySettings(companyId);
}
