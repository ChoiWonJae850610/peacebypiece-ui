import type {
  AdminFileUsageCard,
  AdminStorageUsageSummary,
} from "@/lib/admin/files/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatAdminTermCount } from "@/lib/i18n/adminTermFormatters";

export type FileStatusItem = {
  label: string;
  value: string;
  description?: string;
  tone?: "neutral" | "danger" | "caution";
};

export function translateStorageValue(
  value: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  const countMatch = value.match(/^(\d+)\s*(개|items?)$/i);
  if (countMatch) {
    const unit = t("terms.units.item", "개");
    return unit === "개" ? `${countMatch[1]}${unit}` : `${countMatch[1]} ${unit}`;
  }
  const dayMatch = value.match(/^(\d+)일$/);
  if (dayMatch) {
    const unit = t("terms.units.day", "일");
    return unit === "일" ? `${dayMatch[1]}${unit}` : `${dayMatch[1]} ${unit}`;
  }
  return value;
}

export function translateStorageDescription(
  value: string | undefined,
  t: ReturnType<typeof useAdminTranslation>,
  fallbackKey: string,
  fallback: string,
): string {
  const text = (value || fallback).trim();
  const normalized = text.toLowerCase();
  if (!text) return t(fallbackKey, fallback);
  if (normalized.includes("checking plan") || text === "요금제 용량 확인 중")
    return t("filesSummary.planCapacityLoading", "요금제 용량 확인 중");
  if (text.endsWith("처리 대기") || normalized.endsWith("waiting"))
    return `${text.replace(/\s*(처리 대기|waiting)$/i, "").trim()} ${t("filesSummary.waitingSuffix", "처리 대기")}`;
  if (text.endsWith("보관") || normalized.endsWith("stored"))
    return `${text.replace(/\s*(보관|stored)$/i, "").trim()} ${t("filesSummary.storedSuffix", "보관")}`;
  if (text.endsWith("사용") || normalized.endsWith("used"))
    return `${text.replace(/\s*(사용|used)$/i, "").trim()} ${t("filesSummary.usedSuffix", "사용")}`;
  return text;
}

export function translateStorageStatus(
  tone: AdminStorageUsageSummary["statusTone"],
  fallback: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  if (tone === "danger") return t("filesSummary.statuses.danger", fallback);
  if (tone === "caution") return t("filesSummary.statuses.caution", fallback);
  return t("filesSummary.statuses.normal", fallback);
}

export function formatCountWithUnit(
  count: number,
  t: ReturnType<typeof useAdminTranslation>,
): string {
  return formatAdminTermCount(t, count, "item");
}

export function formatStorageBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0MB";
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  if (bytes >= 1024 * 1024)
    return `${Math.max(0.01, bytes / 1024 / 1024).toFixed(2)}MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)}KB`;
  return `${bytes}B`;
}

export function buildFileStatusItems(input: {
  usageCards: AdminFileUsageCard[];
  t: ReturnType<typeof useAdminTranslation>;
}): FileStatusItem[] {
  const { usageCards, t } = input;
  const attachmentCard = usageCards[1];
  const trashCard = usageCards[2];
  const purgeRequestCard = usageCards[3];
  const rawAttachmentCount = attachmentCard?.value ?? "0개";
  const rawTrashCount = trashCard?.value ?? "0개";
  const rawPurgeRequestCount = purgeRequestCard?.value ?? "0개";
  const isTrashEmpty = rawTrashCount.trim().startsWith("0");
  const isPurgeRequestEmpty = rawPurgeRequestCount.trim().startsWith("0");

  const attachmentCount = translateStorageValue(rawAttachmentCount, t);
  const trashCount = translateStorageValue(rawTrashCount, t);
  const purgeRequestCount = translateStorageValue(rawPurgeRequestCount, t);
  const attachmentSizeLabel = translateStorageDescription(
    attachmentCard?.description,
    t,
    "filesSummary.zeroActiveSize",
    "0MB 사용",
  );
  const trashSizeLabel = translateStorageDescription(
    trashCard?.description,
    t,
    "filesSummary.zeroTrashSize",
    "0MB 보관",
  );
  const purgeRequestSizeLabel = translateStorageDescription(
    purgeRequestCard?.description,
    t,
    "filesSummary.zeroPurgeRequestSize",
    "0MB 처리 대기",
  );

  return [
    {
      label: t("filesSummary.activeFiles", "사용중 파일"),
      value: attachmentCount,
      description: attachmentSizeLabel,
    },
    {
      label: t("filesSummary.trashFiles", "휴지통 파일"),
      value: trashCount,
      description: isTrashEmpty
        ? t("filesSummary.zeroTrashSize", "0MB 보관")
        : trashSizeLabel,
      tone: isTrashEmpty ? "neutral" : "caution",
    },
    {
      label: t("filesSummary.purgeRequestedFiles", "삭제 요청"),
      value: purgeRequestCount,
      description: isPurgeRequestEmpty
        ? t("filesSummary.zeroPurgeRequestSize", "0MB 처리 대기")
        : purgeRequestSizeLabel,
      tone: isPurgeRequestEmpty ? "neutral" : "danger",
    },
  ];
}
