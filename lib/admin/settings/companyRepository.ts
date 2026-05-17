import "server-only";

import { queryDb } from "@/lib/db/client";
import { COMPANY_FILE_TRASH_RETENTION_DAYS, buildDefaultCompanySettings } from "@/lib/admin/settings/companyDefaults";
import type {
  AdminCompanySummary,
  CompanyFilePolicySettings,
  CompanyLanguage,
  CompanyNotificationPolicySettings,
  CompanySettings,
  CompanySettingsUpdateInput,
  CompanyThemeColor,
  CompanyUiSettings,
} from "@/lib/admin/settings/companyTypes";

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

function isThemeColor(value: string | null | undefined): value is CompanyThemeColor {
  return value === "blue" || value === "emerald" || value === "violet" || value === "stone";
}

function isLanguage(value: string | null | undefined): value is CompanyLanguage {
  return value === "ko" || value === "en";
}

function normalizeRetentionDays(): number {
  return COMPANY_FILE_TRASH_RETENTION_DAYS;
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const numericValue = Math.trunc(Number(value));
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function normalizePercent(value: unknown, fallback: number): number {
  const numericValue = Math.trunc(Number(value));
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(100, Math.max(1, numericValue));
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "t" || normalized === "1") return true;
    if (normalized === "false" || normalized === "f" || normalized === "0") return false;
  }
  return fallback;
}

function normalizeUiSettings(input: CompanySettingsUpdateInput["ui"] | undefined, fallback: CompanyUiSettings): CompanyUiSettings {
  return {
    themeColor: isThemeColor(input?.themeColor) ? input.themeColor : fallback.themeColor,
    language: isLanguage(input?.language) ? input.language : fallback.language,
    compactMode: normalizeBoolean(input?.compactMode, fallback.compactMode),
  };
}

function normalizeFilePolicySettings(
  input: CompanySettingsUpdateInput["filePolicy"] | undefined,
  fallback: CompanyFilePolicySettings,
): CompanyFilePolicySettings {
  return {
    softDeleteEnabled: true,
    includeTrashInUsage: normalizeBoolean(input?.includeTrashInUsage, fallback.includeTrashInUsage),
    trashRetentionDays: normalizeRetentionDays(),
    storageLimitGb: normalizePositiveInteger(input?.storageLimitGb, fallback.storageLimitGb),
    warningThresholdPercent: normalizePercent(input?.warningThresholdPercent, fallback.warningThresholdPercent),
  };
}

function normalizeNotificationPolicySettings(
  input: CompanySettingsUpdateInput["notificationPolicy"] | undefined,
  fallback: CompanyNotificationPolicySettings,
): CompanyNotificationPolicySettings {
  return {
    reviewRequestEnabled: normalizeBoolean(input?.reviewRequestEnabled, fallback.reviewRequestEnabled),
    orderReadyEnabled: normalizeBoolean(input?.orderReadyEnabled, fallback.orderReadyEnabled),
    storageWarningEnabled: normalizeBoolean(input?.storageWarningEnabled, fallback.storageWarningEnabled),
    purgeResultEnabled: normalizeBoolean(input?.purgeResultEnabled, fallback.purgeResultEnabled),
  };
}

function normalizeSettingsInput(companyId: string, input: CompanySettingsUpdateInput, fallback: CompanySettings): CompanySettings {
  return {
    companyId,
    ui: normalizeUiSettings(input.ui, fallback.ui),
    filePolicy: normalizeFilePolicySettings(input.filePolicy, fallback.filePolicy),
    notificationPolicy: normalizeNotificationPolicySettings(input.notificationPolicy, fallback.notificationPolicy),
    updatedAt: fallback.updatedAt,
  };
}

function mapSettingsRow(row: CompanySettingsRow): CompanySettings {
  const fallback = buildDefaultCompanySettings(row.company_id);

  return {
    companyId: row.company_id,
    ui: {
      themeColor: isThemeColor(row.theme_color) ? row.theme_color : fallback.ui.themeColor,
      language: isLanguage(row.language) ? row.language : fallback.ui.language,
      compactMode: normalizeBoolean(row.compact_mode, fallback.ui.compactMode),
    },
    filePolicy: {
      softDeleteEnabled: true,
      includeTrashInUsage: normalizeBoolean(row.include_trash_in_usage, fallback.filePolicy.includeTrashInUsage),
      trashRetentionDays: normalizeRetentionDays(),
      storageLimitGb: normalizePositiveInteger(row.storage_limit_gb, fallback.filePolicy.storageLimitGb),
      warningThresholdPercent: normalizePercent(row.warning_threshold_percent, fallback.filePolicy.warningThresholdPercent),
    },
    notificationPolicy: {
      reviewRequestEnabled: normalizeBoolean(row.review_request_enabled, fallback.notificationPolicy.reviewRequestEnabled),
      orderReadyEnabled: normalizeBoolean(row.order_ready_enabled, fallback.notificationPolicy.orderReadyEnabled),
      storageWarningEnabled: normalizeBoolean(row.storage_warning_enabled, fallback.notificationPolicy.storageWarningEnabled),
      purgeResultEnabled: normalizeBoolean(row.purge_result_enabled, fallback.notificationPolicy.purgeResultEnabled),
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

export async function getAdminCompanyById(companyId: string): Promise<AdminCompanySummary | null> {
  const result = await queryDb<CompanyRow>(
    `SELECT id, name, memo, is_active
     FROM companies
     WHERE id = $1
     LIMIT 1`,
    [companyId],
  );

  const row = result.rows[0];
  return row ? mapCompanyRow(row) : null;
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

export async function updateCompanySettings(companyId: string, input: CompanySettingsUpdateInput): Promise<CompanySettings> {
  const currentSettings = await getCompanySettings(companyId);
  const normalized = normalizeSettingsInput(companyId, input, currentSettings);
  const result = await queryDb<CompanySettingsRow>(
    `INSERT INTO company_settings (
        company_id,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
      ON CONFLICT (company_id) DO UPDATE SET
        theme_color = EXCLUDED.theme_color,
        language = EXCLUDED.language,
        compact_mode = EXCLUDED.compact_mode,
        soft_delete_enabled = EXCLUDED.soft_delete_enabled,
        include_trash_in_usage = EXCLUDED.include_trash_in_usage,
        trash_retention_days = EXCLUDED.trash_retention_days,
        storage_limit_gb = EXCLUDED.storage_limit_gb,
        warning_threshold_percent = EXCLUDED.warning_threshold_percent,
        review_request_enabled = EXCLUDED.review_request_enabled,
        order_ready_enabled = EXCLUDED.order_ready_enabled,
        storage_warning_enabled = EXCLUDED.storage_warning_enabled,
        purge_result_enabled = EXCLUDED.purge_result_enabled,
        updated_at = now()
      RETURNING company_id,
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
                updated_at`,
    [
      companyId,
      normalized.ui.themeColor,
      normalized.ui.language,
      normalized.ui.compactMode,
      normalized.filePolicy.softDeleteEnabled,
      normalized.filePolicy.includeTrashInUsage,
      normalized.filePolicy.trashRetentionDays,
      normalized.filePolicy.storageLimitGb,
      normalized.filePolicy.warningThresholdPercent,
      normalized.notificationPolicy.reviewRequestEnabled,
      normalized.notificationPolicy.orderReadyEnabled,
      normalized.notificationPolicy.storageWarningEnabled,
      normalized.notificationPolicy.purgeResultEnabled,
    ],
  );

  return result.rows[0] ? mapSettingsRow(result.rows[0]) : normalized;
}
