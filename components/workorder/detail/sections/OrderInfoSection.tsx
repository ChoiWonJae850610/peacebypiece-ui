import type { ReactNode } from "react";

import { AppBadge, AppButton, AppCard } from "@/components/common/ui";
import OrderInfoHubDebugPanel from "@/components/debug/OrderInfoHubDebugPanel";
import { useI18n } from "@/lib/i18n";
import type { OrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { calculateOrderEntryAmount, calculateOrderEntryTotals, calculateOutsourcingAmount } from "@/lib/workorder/detail/detailCalculations";
import { formatCurrencySummary } from "@/lib/workorder/detail/detailFormatting";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import {
  DeleteButton,
  EditableValue,
  type EditableCell,
  type EditableSectionKey,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";
import type { Outsourcing } from "@/types/workorder";

function DetailField({
  label,
  children,
  span = false,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2.5 ${span ? "sm:col-span-2" : ""}`}>
      <div className="mb-1 text-[11px] font-medium leading-4 pbp-text-subtle">{label}</div>
      <div className="min-h-8 text-sm font-medium pbp-text-primary">{children}</div>
    </div>
  );
}

function ReadOnlyAmount({ value, suffix }: { value: number; suffix: string }) {
  return (
    <div className="flex min-h-8 items-center justify-end rounded-xl bg-[var(--pbp-surface-muted)] px-3 text-sm font-semibold tabular-nums pbp-text-primary">
      {value.toLocaleString()}{suffix}
    </div>
  );
}

export default function OrderInfoSection({
  orderEntries,
  factoryOptions,
  orderTypeOptions,
  outsourcing,
  outsourcingVendorOptionsById,
  outsourcingProcessOptions,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  onAddOutsourcing,
  onRemoveOutsourcing,
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
  outsourcingProcessOptions: string[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onAddOutsourcing: () => void;
  onRemoveOutsourcing: (id: string) => void;
  canOpenInspectionModal: boolean;
  locked?: boolean;
  orderHubPolicy: OrderInfoHubPolicy;
  onOpenInspectionModal: () => void;
  showDebugPanel?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const outsourcingCopy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  void onRemove;
  const visibleOrderEntries = orderEntries.slice(0, 1);
  const totals = calculateOrderEntryTotals(visibleOrderEntries);
  const outsourcingTotals = outsourcing.reduce(
    (acc, item) => {
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const unitCost = Math.max(0, Number(item.unitCost) || 0);
      const lossCost = Math.max(0, Number(item.lossCost) || 0);
      acc.quantity += quantity;
      acc.unitCost += quantity * unitCost;
      acc.lossCost += quantity * lossCost;
      acc.totalCost += Number(item.totalCost) || quantity * (unitCost + lossCost);
      return acc;
    },
    { quantity: 0, unitCost: 0, lossCost: 0, totalCost: 0 },
  );
  void canOpenInspectionModal;
  void onOpenInspectionModal;
  void open;
  void onToggle;

  const combinedTotal = totals.totalCost + outsourcingTotals.totalCost;
  const hasRows = visibleOrderEntries.length > 0 || outsourcing.length > 0;

  return (
    <AppCard className="space-y-3 overflow-hidden xl:p-4" padding="sm">
      {showDebugPanel ? <OrderInfoHubDebugPanel policy={orderHubPolicy} /> : null}

      {!hasRows ? (
        <div className="rounded-2xl border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface-muted)] px-4 py-8 text-center text-sm pbp-text-muted">
          {copy.empty}
        </div>
      ) : null}

      <div className="space-y-3">
        {visibleOrderEntries.map((item) => {
          const orderLineAmount = calculateOrderEntryAmount(item);

          return (
            <AppCard key={item.id} variant="subtle" padding="sm" className="rounded-[22px]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold pbp-text-subtle">{copy.fields.lineType}</div>
                  <div className="mt-0.5 text-sm font-semibold pbp-text-primary">{copy.sewingLineTypeLabel}</div>
                </div>
                <AppBadge tone="strong" size="sm" className="shrink-0 tabular-nums">
                  {orderLineAmount.toLocaleString()}{common.currencySuffix}
                </AppBadge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <DetailField label={copy.fields.item}>
                  <EditableValue section="order" rowId={item.id} field="type" value={item.type} displayValue={translateWorkOrderDisplayText(item.type, locale)} options={orderTypeOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.vendor}>
                  <EditableValue section="order" rowId={item.id} field="factory" value={item.factory} displayValue={translateWorkOrderDisplayText(item.factory, locale)} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.quantity}>
                  <EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.laborCost}>
                  <EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.lossCost}>
                  <EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.amount}>
                  <ReadOnlyAmount value={orderLineAmount} suffix={common.currencySuffix} />
                </DetailField>
              </div>
            </AppCard>
          );
        })}

        {outsourcing.map((item, rowIndex) => {
          const outsourcingLineAmount = calculateOutsourcingAmount(item);

          return (
            <AppCard key={item.id} variant="subtle" padding="sm" className="rounded-[22px]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold pbp-text-subtle">{copy.fields.lineType}</div>
                  <div className="mt-0.5 text-sm font-semibold pbp-text-primary">
                    {copy.outsourcingLineTypeLabelPrefix} {copy.outsourcingLineTypeLabelSuffix}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <AppBadge tone="strong" size="sm" className="tabular-nums">
                    {outsourcingLineAmount.toLocaleString()}{common.currencySuffix}
                  </AppBadge>
                  <DeleteButton onClick={() => onRemoveOutsourcing(item.id)} srLabel={`${item.process || outsourcingCopy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                <DetailField label={copy.fields.item}>
                  <EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingProcessOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.vendor}>
                  <EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingVendorOptionsById[item.id] ?? []} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.quantity}>
                  <EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.laborCost}>
                  <EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.lossCost}>
                  <EditableValue section="outsourcing" rowId={item.id} field="lossCost" value={(item.lossCost ?? 0).toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                </DetailField>
                <DetailField label={copy.fields.amount}>
                  <ReadOnlyAmount value={outsourcingLineAmount} suffix={common.currencySuffix} />
                </DetailField>
              </div>
            </AppCard>
          );
        })}
      </div>

      {hasRows ? (
        <AppCard variant="flat" padding="md" className="rounded-[20px] bg-stone-950 px-4 py-3 text-white">
          <div className="grid gap-2 text-xs sm:grid-cols-4">
            <div>
              <div className="text-white/55">{copy.fields.quantity}</div>
              <div className="mt-0.5 font-semibold tabular-nums">{(totals.quantity + outsourcingTotals.quantity).toLocaleString()}{common.quantitySuffix}</div>
            </div>
            <div>
              <div className="text-white/55">{copy.fields.laborCost}</div>
              <div className="mt-0.5 font-semibold tabular-nums">{(totals.laborCost + outsourcingTotals.unitCost).toLocaleString()}{common.currencySuffix}</div>
            </div>
            <div>
              <div className="text-white/55">{copy.fields.lossCost}</div>
              <div className="mt-0.5 font-semibold tabular-nums">{(totals.lossCost + outsourcingTotals.lossCost).toLocaleString()}{common.currencySuffix}</div>
            </div>
            <div className="sm:text-right">
              <div className="text-white/55">{copy.totalRow}</div>
              <div className="mt-0.5 font-semibold tabular-nums">{formatCurrencySummary(combinedTotal, i18n)}</div>
            </div>
          </div>
        </AppCard>
      ) : null}

      {!locked && visibleOrderEntries.length === 0 ? (
        <AppButton
          onClick={onAdd}
          variant="primary"
          size="sm"
          width="full"
        >
          {copy.factoryAddButton}
        </AppButton>
      ) : null}
      {locked ? null : (
        <AppButton
          onClick={onAddOutsourcing}
          variant="secondary"
          size="sm"
          width="full"
          className="border-dashed"
        >
          {copy.outsourcingOrder.addButton}
        </AppButton>
      )}
    </AppCard>
  );
}
