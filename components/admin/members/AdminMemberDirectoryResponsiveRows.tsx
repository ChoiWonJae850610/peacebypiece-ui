"use client";

import { useRef, type ReactNode } from "react";

import { AdminResponsiveTableShell } from "@/components/admin/common/responsiveTable/AdminResponsiveTableShell";
import {
  ADMIN_RESPONSIVE_COMPACT_CARD_CLASS,
  ADMIN_RESPONSIVE_COMPACT_CARD_CLICKABLE_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_BOX_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS,
  ADMIN_RESPONSIVE_COMPACT_META_VALUE_CLASS,
  ADMIN_RESPONSIVE_TABLE_CLICKABLE_ROW_CLASS,
  ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS,
  ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS,
  ADMIN_RESPONSIVE_TABLE_HEADER_CLASS,
  ADMIN_RESPONSIVE_TABLE_MUTED_TEXT_CLASS,
  ADMIN_RESPONSIVE_TABLE_ROW_CLASS,
} from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import { useElementSize } from "@/lib/responsive/useElementSize";
import type { MemberDirectoryRow } from "@/components/admin/members/AdminMemberDirectoryTableColumns";

type AdminMemberDirectoryResponsiveRowsProps = {
  items: readonly MemberDirectoryRow[];
  columns: AdminTableColumn<MemberDirectoryRow>[];
  isLoading: boolean;
  loadingLabel: string;
  emptyLabel: string;
  emptyDescription: string;
  onOpenMemberDetail: (row: MemberDirectoryRow) => void;
};

const MEMBER_DIRECTORY_TABLE_MIN_WIDTH = 1080;
const MEMBER_DIRECTORY_TABLE_GRID =
  "minmax(120px,1fr) minmax(160px,1.2fr) 110px 110px 96px 110px 110px 120px 140px";

function getColumn(
  columns: AdminTableColumn<MemberDirectoryRow>[],
  key: string,
): AdminTableColumn<MemberDirectoryRow> | undefined {
  return columns.find((column) => column.key === key);
}

function MemberDirectoryEmptyState({ label, description }: { label: string; description?: string }) {
  return (
    <div className={ADMIN_RESPONSIVE_TABLE_EMPTY_CLASS}>
      <div className="max-w-md">
        <p className="font-semibold text-[var(--pbp-text-muted)]">{label}</p>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

function MemberDirectoryWideTableRows({
  items,
  columns,
  isLoading,
  loadingLabel,
  emptyLabel,
  emptyDescription,
  onOpenMemberDetail,
}: AdminMemberDirectoryResponsiveRowsProps) {
  return (
    <AdminResponsiveTableShell>
      <div
        className={ADMIN_RESPONSIVE_TABLE_HEADER_CLASS}
        style={{ gridTemplateColumns: MEMBER_DIRECTORY_TABLE_GRID }}
      >
        {columns.map((column) => (
          <span key={column.key} className={column.headerClassName}>
            {column.label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <MemberDirectoryEmptyState label={loadingLabel} />
      ) : items.length === 0 ? (
        <MemberDirectoryEmptyState label={emptyLabel} description={emptyDescription} />
      ) : (
        <div className={ADMIN_RESPONSIVE_TABLE_DIVIDER_CLASS}>
          {items.map((row) => (
            <div
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenMemberDetail(row)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenMemberDetail(row);
                }
              }}
              className={`${ADMIN_RESPONSIVE_TABLE_ROW_CLASS} ${ADMIN_RESPONSIVE_TABLE_CLICKABLE_ROW_CLASS}`}
              style={{ gridTemplateColumns: MEMBER_DIRECTORY_TABLE_GRID }}
            >
              {columns.map((column) => (
                <div key={column.key} className={`min-w-0 ${column.className ?? ""}`}>
                  {column.render(row)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </AdminResponsiveTableShell>
  );
}

function MemberMetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={ADMIN_RESPONSIVE_COMPACT_META_BOX_CLASS}>
      <p className={ADMIN_RESPONSIVE_COMPACT_META_LABEL_CLASS}>{label}</p>
      <div className={ADMIN_RESPONSIVE_COMPACT_META_VALUE_CLASS}>{value}</div>
    </div>
  );
}

function MemberDirectoryCompactListRows({
  items,
  columns,
  isLoading,
  loadingLabel,
  emptyLabel,
  emptyDescription,
  onOpenMemberDetail,
}: AdminMemberDirectoryResponsiveRowsProps) {
  const nameColumn = getColumn(columns, "name");
  const emailColumn = getColumn(columns, "email");
  const phoneColumn = getColumn(columns, "phone");
  const roleColumn = getColumn(columns, "role");
  const statusColumn = getColumn(columns, "status");
  const requestedAtColumn = getColumn(columns, "requestedAt");
  const approvedAtColumn = getColumn(columns, "approvedAt");
  const lastActiveAtColumn = getColumn(columns, "lastActiveAt");
  const actionsColumn = getColumn(columns, "actions");

  return (
    <section className="flex min-h-fit touch-pan-y flex-col overflow-hidden rounded-[22px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 md:p-4">
      {isLoading ? (
        <MemberDirectoryEmptyState label={loadingLabel} />
      ) : items.length === 0 ? (
        <MemberDirectoryEmptyState label={emptyLabel} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">
          {items.map((row) => (
            <article
              key={row.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenMemberDetail(row)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenMemberDetail(row);
                }
              }}
              className={`${ADMIN_RESPONSIVE_COMPACT_CARD_CLASS} ${ADMIN_RESPONSIVE_COMPACT_CARD_CLICKABLE_CLASS}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  {nameColumn ? nameColumn.render(row) : <span>{row.name || "-"}</span>}
                  <div className={ADMIN_RESPONSIVE_TABLE_MUTED_TEXT_CLASS}>
                    {emailColumn ? emailColumn.render(row) : row.email || "-"}
                  </div>
                </div>
                <div className="shrink-0">{statusColumn?.render(row)}</div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {phoneColumn ? <MemberMetaItem label={phoneColumn.label} value={phoneColumn.render(row)} /> : null}
                {roleColumn ? <MemberMetaItem label={roleColumn.label} value={roleColumn.render(row)} /> : null}
                {lastActiveAtColumn ? (
                  <MemberMetaItem label={lastActiveAtColumn.label} value={lastActiveAtColumn.render(row)} />
                ) : null}
                {requestedAtColumn ? (
                  <MemberMetaItem label={requestedAtColumn.label} value={requestedAtColumn.render(row)} />
                ) : null}
                {approvedAtColumn ? (
                  <MemberMetaItem label={approvedAtColumn.label} value={approvedAtColumn.render(row)} />
                ) : null}
              </div>

              {actionsColumn ? (
                <div className="mt-3 flex justify-end" onClick={(event) => event.stopPropagation()}>
                  {actionsColumn.render(row)}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminMemberDirectoryResponsiveRows(props: AdminMemberDirectoryResponsiveRowsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { width } = useElementSize(containerRef);
  const shouldUseWideTable = width >= MEMBER_DIRECTORY_TABLE_MIN_WIDTH;

  return (
    <div ref={containerRef}>
      {shouldUseWideTable ? (
        <MemberDirectoryWideTableRows {...props} />
      ) : (
        <MemberDirectoryCompactListRows {...props} />
      )}
    </div>
  );
}
