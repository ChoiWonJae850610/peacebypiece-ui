import { WaflBadge } from "@/components/common/ui";
import type { UnifiedTrashRow } from "@/components/admin/files/fileTrashSectionRows";
import { getTrashTypeBadgeTone } from "@/components/admin/files/trash/fileTrashResponsivePresentation";

export function FileTrashTypeBadge({
  row,
  className = "",
}: {
  row: UnifiedTrashRow;
  className?: string;
}) {
  return (
    <WaflBadge
      size="xs"
      tone={getTrashTypeBadgeTone(row)}
      className={`max-w-[104px] truncate ${className}`}
      title={row.typeLabel}
    >
      {row.typeLabel}
    </WaflBadge>
  );
}
