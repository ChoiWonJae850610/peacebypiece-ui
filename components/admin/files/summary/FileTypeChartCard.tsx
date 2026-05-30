import {
  ADMIN_STORAGE_CARD_CLASS,
  ADMIN_STORAGE_LABEL_CLASS,
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
  ADMIN_STORAGE_VALUE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { AdminFileTypeDistributionItem } from "@/lib/admin/files/types";
import { formatCountWithUnit } from "@/lib/admin/files/storageSummaryPresentation";
import { getAdminFileTypeChartColor } from "@/lib/admin/chartPalette";
import { translateAdminFileTypeTerm } from "@/lib/i18n/adminTermFormatters";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

export function FileTypeChartCard({
  items = [],
}: {
  items?: AdminFileTypeDistributionItem[];
}) {
  const t = useAdminTranslation();
  const normalizedItems = (
    items.length > 0
      ? items
      : [
          { label: t("terms.files.document", "문서"), value: 0, percent: 0 },
          { label: t("terms.files.design", "디자인"), value: 0, percent: 0 },
        ]
  ).map((item) => ({ ...item, label: translateAdminFileTypeTerm(item.label, t) }));
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={`${ADMIN_STORAGE_CARD_CLASS} flex h-full min-h-[138px] flex-col px-4 py-3 md:min-h-[148px] md:px-4 md:py-3.5 2xl:min-h-[156px] 2xl:px-5`}>
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className={ADMIN_STORAGE_LABEL_CLASS}>
            {t("filesSummary.fileTypeLabel", "파일 유형")}
          </p>
          <h3 className={`${ADMIN_STORAGE_VALUE_CLASS} mt-1 text-sm`}>
            {t("filesSummary.fileType", "파일 유형")}
          </h3>
        </div>
        <span className="rounded-full bg-[var(--pbp-surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--pbp-text-muted)]">
          {formatCountWithUnit(total, t)}
        </span>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-7">
        <div className="relative h-[124px] w-[124px] shrink-0 2xl:h-[132px] 2xl:w-[132px]">
          <svg
            viewBox="0 0 148 148"
            className="h-[124px] w-[124px] -rotate-90 2xl:h-[132px] 2xl:w-[132px]"
            aria-hidden="true"
          >
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="none"
              stroke="var(--pbp-border)"
              strokeWidth="16"
            />
            {total > 0
              ? normalizedItems.map((item, index) => {
                  const dash = (item.value / total) * circumference;
                  const strokeDasharray = `${dash} ${circumference - dash}`;
                  const strokeDashoffset = -offset;
                  const segmentColor = getAdminFileTypeChartColor(item.label, index);
                  offset += dash;
                  return (
                    <circle
                      key={item.label}
                      cx="74"
                      cy="74"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="butt"
                      style={{ color: segmentColor }}
                    />
                  );
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`${ADMIN_STORAGE_VALUE_CLASS} text-2xl`}>{total}</span>
            <span className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[11px] font-semibold`}>{t("filesSummary.totalLabel", "전체")}</span>
          </div>
        </div>
        <div className="min-w-0 flex-[0.85] space-y-2">
          {normalizedItems.map((item, index) => (
            <div key={item.label} className="min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} flex min-w-0 items-center gap-2 font-semibold`}>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getAdminFileTypeChartColor(item.label, index) }}
                  />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </span>
                <span className={`${ADMIN_STORAGE_VALUE_CLASS} shrink-0 font-bold`}>
                  {formatCountWithUnit(item.value, t)} · {item.percent}%
                </span>
              </div>
              <div className="mt-1 h-1.5 max-w-[360px] overflow-hidden rounded-full bg-[var(--pbp-surface-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(2, item.percent)}%`, backgroundColor: getAdminFileTypeChartColor(item.label, index) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
