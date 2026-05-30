import {
  ADMIN_STORAGE_CARD_CLASS,
  ADMIN_STORAGE_LABEL_CLASS,
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_SUBTLE_BOX_CLASS,
  ADMIN_STORAGE_VALUE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { FileStatusItem } from "@/lib/admin/files/storageSummaryPresentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

export function FileOperationsCard({ items }: { items: FileStatusItem[] }) {
  const t = useAdminTranslation();
  return (
    <div className={`${ADMIN_STORAGE_CARD_CLASS} flex h-full min-h-[138px] flex-col px-4 py-3 md:min-h-[148px] md:px-4 md:py-3.5 2xl:min-h-[156px] 2xl:px-5`}>
      <div>
        <p className={ADMIN_STORAGE_LABEL_CLASS}>
          {t("filesSummary.fileOperationsLabel", "파일 운영")}
        </p>
        <h3 className={`${ADMIN_STORAGE_VALUE_CLASS} mt-1 text-sm`}>{t("filesSummary.fileOperationsTitle", "파일 운영 요약")}</h3>
      </div>
      <div className="mt-3 grid flex-1 content-center gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${ADMIN_STORAGE_SUBTLE_BOX_CLASS} flex items-center justify-between gap-3 px-3 py-2`}
          >
            <div className="min-w-0">
              <p className={`${ADMIN_STORAGE_VALUE_CLASS} truncate text-[13px] font-semibold`} title={item.label}>
                {item.label}
              </p>
              {item.description ? (
                <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} mt-0.5 truncate text-[11px]`} title={item.description}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 text-sm font-bold ${item.tone === "danger" ? "text-[var(--pbp-status-danger)]" : item.tone === "caution" ? "text-[var(--pbp-status-warning)]" : "text-[var(--pbp-text-primary)]"}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
