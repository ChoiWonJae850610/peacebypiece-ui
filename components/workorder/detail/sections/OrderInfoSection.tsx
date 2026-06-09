"use client";

import { useState } from "react";

import { AppCard, SectionCountBadge } from "@/components/common/ui";
import { WorkOrderAddIconButton } from "@/components/workorder/common/WorkOrderIconButtons";
import OrderInfoHubDebugPanel from "@/components/debug/OrderInfoHubDebugPanel";
import WorkOrderProcessEditSheet, {
  type WorkOrderProcessSheetDraft,
  type WorkOrderProcessSheetMode,
} from "@/components/workorder/detail/sections/WorkOrderProcessEditSheet";
import {
  DeleteButton,
  type EditableCell,
  type EditableSectionKey,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";
import { useI18n } from "@/lib/i18n";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { OrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import type { Outsourcing } from "@/types/workorder";

type SheetState =
  | { mode: "order"; orderEntry: OrderEntryState | null; outsourcing: null }
  | { mode: "outsourcing"; orderEntry: null; outsourcing: Outsourcing | null };

function SectionAddButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <WorkOrderAddIconButton
      label={label}
      size="md"
      onClick={onClick}
      disabled={disabled}
    />
  );
}

function ProcessCard({
  title,
  meta,
  details,
  locked,
  onEdit,
  onRemove,
}: {
  title: string;
  meta: string;
  details: string[];
  locked: boolean;
  onEdit: () => void;
  onRemove?: () => void;
}) {
  const { i18n } = useI18n();
  const common = i18n.workorder.ui.common;
  return (
    <AppCard variant="subtle" padding="sm" className="rounded-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold pbp-text-subtle">
            {meta}
          </div>
          <div className="mt-1 truncate text-sm font-semibold pbp-text-primary">
            {title}
          </div>
          {details.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs pbp-text-muted">
              {details.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          ) : null}
        </div>
        {!locked ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="pbp-interactive-button rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1 text-[11px] font-semibold pbp-text-secondary shadow-sm"
            >
              수정
            </button>
            {onRemove ? (
              <DeleteButton
                onClick={onRemove}
                srLabel={`${title} ${common.deleteSuffix}`}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </AppCard>
  );
}

export default function OrderInfoSection({
  orderEntries,
  factoryOptions,
  orderTypeOptions,
  outsourcing,
  outsourcingProcessOptions,
  outsourcingVendorOptionsById,
  outsourcingVendorOptions,
  outsourcingVendorOptionsByProcess,
  open,
  onToggle,
  onAdd,
  onRemove,
  onAddOutsourcing,
  onRemoveOutsourcing,
  onSaveOrderEntryDraft,
  onSaveOutsourcingDraft,
  canOpenInspectionModal,
  locked = false,
  orderHubPolicy,
  onOpenInspectionModal,
  showDebugPanel = false,
}: {
  orderEntries: OrderEntryState[];
  factoryOptions: readonly string[];
  orderTypeOptions: readonly string[];
  outsourcing: Outsourcing[];
  outsourcingVendorOptionsById: Record<string, string[]>;
  outsourcingVendorOptions: readonly string[];
  outsourcingVendorOptionsByProcess: Record<string, readonly string[]>;
  outsourcingProcessOptions: readonly string[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (
    section: EditableSectionKey,
    rowId: string,
    field: string,
    value: string,
  ) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onAddOutsourcing: () => void;
  onRemoveOutsourcing: (id: string) => void;
  onSaveOrderEntryDraft: (
    orderEntryId: string | null,
    draft: WorkOrderProcessSheetDraft,
  ) => void;
  onSaveOutsourcingDraft: (
    outsourcingId: string | null,
    draft: WorkOrderProcessSheetDraft,
  ) => void;
  canOpenInspectionModal: boolean;
  locked?: boolean;
  orderHubPolicy: OrderInfoHubPolicy;
  onOpenInspectionModal: () => void;
  showDebugPanel?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const common = i18n.workorder.ui.common;
  const [sheetState, setSheetState] = useState<SheetState | null>(null);
  const visibleOrderEntries = orderEntries.slice(0, 1);
  const processCount = visibleOrderEntries.length + outsourcing.length;
  const hasRows = processCount > 0;
  void open;
  void onToggle;
  void onAdd;
  void onAddOutsourcing;
  void onRemove;

  const openOrderSheet = (orderEntry: OrderEntryState | null) =>
    setSheetState({ mode: "order", orderEntry, outsourcing: null });
  const openOutsourcingSheet = (item: Outsourcing | null) =>
    setSheetState({ mode: "outsourcing", orderEntry: null, outsourcing: item });
  const openPrimaryAddSheet = () => {
    if (visibleOrderEntries.length === 0) {
      openOrderSheet(null);
      return;
    }
    openOutsourcingSheet(null);
  };
  const closeSheet = () => setSheetState(null);
  void outsourcingVendorOptionsById;
  void outsourcingVendorOptions;
  const handleApplySheet = ({
    mode,
    orderEntryId,
    outsourcingId,
    draft,
  }: {
    mode: WorkOrderProcessSheetMode;
    orderEntryId: string | null;
    outsourcingId: string | null;
    draft: WorkOrderProcessSheetDraft;
  }) => {
    if (mode === "order") {
      onSaveOrderEntryDraft(orderEntryId, draft);
      return;
    }
    onSaveOutsourcingDraft(outsourcingId, draft);
  };

  return (
    <section className="mt-5 min-w-0">
      <div className="mb-2.5 flex min-w-0 items-end justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 text-sm font-semibold leading-5 text-stone-900">
            {copy.title}
          </h3>
          <SectionCountBadge>{processCount}건</SectionCountBadge>
        </div>
        {!locked ? (
          <SectionAddButton
            label={
              visibleOrderEntries.length === 0
                ? copy.factoryAddButton
                : copy.outsourcingOrder.addButton
            }
            disabled={locked}
            onClick={openPrimaryAddSheet}
          />
        ) : null}
      </div>
      <AppCard className="space-y-3 overflow-hidden xl:p-4" padding="sm">
        {showDebugPanel ? (
          <OrderInfoHubDebugPanel policy={orderHubPolicy} />
        ) : null}
        {!hasRows ? (
          <div className="rounded-2xl border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface-muted)] px-4 py-8 text-center text-sm pbp-text-muted">
            {copy.empty}
          </div>
        ) : null}

        <div className="space-y-2.5">
          {visibleOrderEntries.map((item) => (
            <ProcessCard
              key={item.id}
              title={translateWorkOrderDisplayText(item.type, locale)}
              meta={copy.sewingLineTypeLabel}
              details={[
                item.factory,
                `${item.quantity.toLocaleString()}장`,
                `${copy.fields.laborCost} ${item.laborCost.toLocaleString()}원`,
                `${copy.fields.lossCost} ${item.lossCost.toLocaleString()}원`,
              ]}
              locked={locked}
              onEdit={() => openOrderSheet(item)}
            />
          ))}
          {outsourcing.map((item) => (
            <ProcessCard
              key={item.id}
              title={item.process || copy.outsourcingLineTypeLabel}
              meta={`${copy.outsourcingLineTypeLabelPrefix} ${copy.outsourcingLineTypeLabelSuffix}`}
              details={[
                item.vendor || "미선택",
                `${item.quantity.toLocaleString()}장`,
                `${copy.fields.laborCost} ${item.unitCost.toLocaleString()}원`,
                `${copy.fields.lossCost} ${(item.lossCost ?? 0).toLocaleString()}원`,
              ]}
              locked={locked}
              onEdit={() => openOutsourcingSheet(item)}
              onRemove={() => onRemoveOutsourcing(item.id)}
            />
          ))}
        </div>

        {canOpenInspectionModal ? (
          <button
            type="button"
            onClick={onOpenInspectionModal}
            className="pbp-interactive-button pbp-action-secondary w-full rounded-xl px-3 py-2 text-sm font-medium"
          >
            {copy.inspectionAction}
          </button>
        ) : null}

        <WorkOrderProcessEditSheet
          open={Boolean(sheetState)}
          mode={sheetState?.mode ?? "order"}
          orderEntry={sheetState?.orderEntry ?? null}
          outsourcing={sheetState?.outsourcing ?? null}
          orderTypeOptions={orderTypeOptions}
          factoryOptions={factoryOptions}
          outsourcingProcessOptions={outsourcingProcessOptions}
          outsourcingVendorOptionsByProcess={outsourcingVendorOptionsByProcess}
          onClose={closeSheet}
          onApply={handleApplySheet}
        />
      </AppCard>
    </section>
  );
}
