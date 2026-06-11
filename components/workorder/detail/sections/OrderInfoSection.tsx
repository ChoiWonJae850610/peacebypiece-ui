"use client";

import { useState } from "react";

import {
  AppCard,
  SectionCountBadge,
  WaflAddCardButton,
  WaflAddIconBubble,
  WaflButton,
  WaflEmptyCard,
  WaflSurface,
} from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import OrderInfoHubDebugPanel from "@/components/debug/OrderInfoHubDebugPanel";
import WorkOrderProcessEditSheet, {
  type WorkOrderProcessSheetDraft,
  type WorkOrderProcessSheetMode,
} from "@/components/workorder/detail/sections/WorkOrderProcessEditSheet";
import {
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
    <WaflSurface
      component="process-list-card"
      shape="control"
      tone="muted"
      className="p-3"
    >
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
          <WorkOrderCardActionMenu
            menuLabel={`${title} ${common.actionMenuSuffix}`}
            editLabel={`${title} ${common.editSuffix}`}
            editText={common.editSuffix}
            onEdit={onEdit}
            deleteLabel={
              onRemove ? `${title} ${common.deleteSuffix}` : undefined
            }
            deleteText={onRemove ? common.deleteSuffix : undefined}
            onDelete={onRemove}
          />
        ) : null}
      </div>
    </WaflSurface>
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
  variant = "desktop",
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
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const [sheetState, setSheetState] = useState<SheetState | null>(null);
  const visibleOrderEntries = orderEntries.slice(0, 1);
  const processCount = visibleOrderEntries.length + outsourcing.length;
  const hasRows = processCount > 0;
  const isFlatDevice = variant === "mobile" || variant === "tablet";
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

  const rows = (
    <>
      {showDebugPanel ? (
        <OrderInfoHubDebugPanel policy={orderHubPolicy} />
      ) : null}
      {!hasRows ? (
        <WaflEmptyCard density="spacious" className="pbp-text-muted">
          {copy.empty}
        </WaflEmptyCard>
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

      {!locked ? (
        <WaflAddCardButton
          component="process-add-button"
          density="default"
          onClick={openPrimaryAddSheet}
          className="w-full"
          aria-label={
            visibleOrderEntries.length === 0
              ? copy.factoryAddButton
              : copy.outsourcingOrder.addButton
          }
          title={
            visibleOrderEntries.length === 0
              ? copy.factoryAddButton
              : copy.outsourcingOrder.addButton
          }
        >
          <WaflAddIconBubble />
        </WaflAddCardButton>
      ) : null}

      {canOpenInspectionModal ? (
        <WaflButton
          variant="secondary"
          width="full"
          onClick={onOpenInspectionModal}
        >
          {copy.inspectionAction}
        </WaflButton>
      ) : null}
    </>
  );

  return (
    <section className={isFlatDevice ? "min-w-0 space-y-2.5" : "mt-5 min-w-0"}>
      {!isFlatDevice ? (
        <div className="mb-2.5 flex min-w-0 items-end justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 text-sm font-semibold leading-5 text-[var(--pbp-text-primary)]">
              {copy.title}
            </h3>
            <SectionCountBadge>{processCount}건</SectionCountBadge>
          </div>
        </div>
      ) : null}

      {isFlatDevice ? (
        rows
      ) : (
        <AppCard className="space-y-3 overflow-hidden xl:p-4" padding="sm">
          {rows}
        </AppCard>
      )}

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
    </section>
  );
}
