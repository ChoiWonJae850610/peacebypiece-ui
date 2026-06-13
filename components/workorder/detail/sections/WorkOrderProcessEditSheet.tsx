"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  MODAL_ACTION_LABELS,
  renderModalFooterActions,
} from "@/components/common/modal/modalActions";
import { blurActiveModalElement } from "@/components/common/modal/modalUtils";
import {
  AppNumberInput,
  AppSelect,
  WAFL_FIELD_INPUT_CLASS,
  type AppSelectOption,
} from "@/components/common/ui";
import { useI18n, type Locale } from "@/lib/i18n";
import { DEFAULT_ORDER_TYPE } from "@/lib/constants/workorderOptions";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Outsourcing } from "@/types/workorder";

export type WorkOrderProcessSheetMode = "order" | "outsourcing";

export type WorkOrderOrderProcessDraft = {
  type: string;
  factory: string;
  quantity: number;
  laborCost: number;
  lossCost: number;
};

export type WorkOrderOutsourcingProcessDraft = {
  process: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  lossCost: number;
};

export type WorkOrderProcessSheetDraft =
  | WorkOrderOrderProcessDraft
  | WorkOrderOutsourcingProcessDraft;

type Props = {
  open: boolean;
  mode: WorkOrderProcessSheetMode;
  orderEntry: OrderEntryState | null;
  outsourcing: Outsourcing | null;
  orderTypeOptions: readonly string[];
  factoryOptions: readonly string[];
  outsourcingProcessOptions: readonly string[];
  outsourcingVendorOptionsByProcess: Record<string, readonly string[]>;
  onClose: () => void;
  onApply: (payload: {
    mode: WorkOrderProcessSheetMode;
    orderEntryId: string | null;
    outsourcingId: string | null;
    draft: WorkOrderProcessSheetDraft;
  }) => void;
};

const fieldPanelClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold text-[var(--pbp-text-muted)]";
const inputClass = `${WAFL_FIELD_INPUT_CLASS} font-semibold text-right tabular-nums`;

function toOrderDraft(
  orderEntry: OrderEntryState | null,
): WorkOrderOrderProcessDraft {
  return {
    type: orderEntry?.type ?? DEFAULT_ORDER_TYPE,
    factory: orderEntry?.factory ?? "",
    quantity: orderEntry?.quantity ?? 0,
    laborCost: orderEntry?.laborCost ?? 0,
    lossCost: orderEntry?.lossCost ?? 0,
  };
}

function toOutsourcingDraft(
  outsourcing: Outsourcing | null,
): WorkOrderOutsourcingProcessDraft {
  return {
    process: outsourcing?.process ?? "",
    vendor: outsourcing?.vendor ?? "",
    quantity: outsourcing?.quantity ?? 0,
    unitCost: outsourcing?.unitCost ?? 0,
    lossCost: outsourcing?.lossCost ?? 0,
  };
}

function isSelectNoneValue(value: string, locale: Locale) {
  const normalizedValue = value.trim();
  const translatedValue = translateWorkOrderDisplayText(value, locale).trim();
  return !normalizedValue || normalizedValue === "선택 안함" || translatedValue === "선택 안함";
}

function buildOptions(
  values: readonly string[],
  locale: Locale,
): AppSelectOption[] {
  return values
    .filter((value) => !isSelectNoneValue(value, locale))
    .map((value) => ({
      value,
      label: translateWorkOrderDisplayText(value, locale),
    }));
}

function buildOptionsWithCurrent(
  values: readonly string[],
  currentValue: string,
  locale: Locale,
): AppSelectOption[] {
  const current = currentValue.trim();
  const resolvedValues = Array.from(
    new Set([...values, ...(current && !isSelectNoneValue(current, locale) ? [current] : [])]),
  );
  return buildOptions(resolvedValues, locale);
}

function buildFactorySelectOptions(
  values: readonly string[],
  currentValue: string,
  locale: Locale,
): AppSelectOption[] {
  const options = buildOptionsWithCurrent(values, currentValue, locale);
  if (options.length === 0) {
    return [{ value: "", label: "선택 가능한 업체 없음", disabled: true }];
  }
  return [{ value: "", label: "업체 선택" }, ...options];
}

function buildOutsourcingProcessSelectOptions(
  values: readonly string[],
  currentValue: string,
  locale: Locale,
): AppSelectOption[] {
  return [
    { value: "", label: "선택 안함" },
    ...buildOptionsWithCurrent(values, currentValue, locale),
  ];
}

function buildOutsourcingVendorSelectOptions(
  values: readonly string[],
  currentValue: string,
  process: string,
  locale: Locale,
): AppSelectOption[] {
  if (!process.trim()) {
    return [{ value: "", label: "항목을 먼저 선택", disabled: true }];
  }
  const options = buildOptionsWithCurrent(values, currentValue, locale);
  if (options.length === 0) {
    return [{ value: "", label: "선택 가능한 업체 없음", disabled: true }];
  }
  return [{ value: "", label: "업체 선택" }, ...options];
}

function normalizeProcessKey(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function selectVendorOptionsByProcess(
  valuesByProcess: Record<string, readonly string[]>,
  process: string,
): readonly string[] {
  const processKey = normalizeProcessKey(process);
  if (!processKey) return [];
  return valuesByProcess[processKey] ?? [];
}

function handleProcessInputPointerDown() {
  blurActiveModalElement();
}

export default function WorkOrderProcessEditSheet({
  open,
  mode,
  orderEntry,
  outsourcing,
  orderTypeOptions,
  factoryOptions,
  outsourcingProcessOptions,
  outsourcingVendorOptionsByProcess,
  onClose,
  onApply,
}: Props) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const [orderDraft, setOrderDraft] = useState<WorkOrderOrderProcessDraft>(() =>
    toOrderDraft(orderEntry),
  );
  const [outsourcingDraft, setOutsourcingDraft] =
    useState<WorkOrderOutsourcingProcessDraft>(() =>
      toOutsourcingDraft(outsourcing),
    );

  useEffect(() => {
    if (!open) return;
    setOrderDraft(toOrderDraft(orderEntry));
    setOutsourcingDraft(toOutsourcingDraft(outsourcing));
  }, [open, orderEntry, outsourcing]);

  void orderTypeOptions;
  const factorySelectOptions = useMemo(
    () => buildFactorySelectOptions(factoryOptions, orderDraft.factory, locale),
    [factoryOptions, locale, orderDraft.factory],
  );
  const outsourcingProcessSelectOptions = useMemo(
    () =>
      buildOutsourcingProcessSelectOptions(
        outsourcingProcessOptions,
        outsourcingDraft.process,
        locale,
      ),
    [locale, outsourcingDraft.process, outsourcingProcessOptions],
  );
  const activeOutsourcingVendorOptions = useMemo(
    () =>
      selectVendorOptionsByProcess(
        outsourcingVendorOptionsByProcess,
        outsourcingDraft.process,
      ),
    [outsourcingDraft.process, outsourcingVendorOptionsByProcess],
  );
  const outsourcingVendorSelectOptions = useMemo(
    () =>
      buildOutsourcingVendorSelectOptions(
        activeOutsourcingVendorOptions,
        outsourcingDraft.vendor,
        outsourcingDraft.process,
        locale,
      ),
    [
      activeOutsourcingVendorOptions,
      locale,
      outsourcingDraft.process,
      outsourcingDraft.vendor,
    ],
  );
  const isFactorySelectDisabled =
    factorySelectOptions.length === 1 &&
    Boolean(factorySelectOptions[0]?.disabled);
  const isOutsourcingVendorSelectDisabled =
    !outsourcingDraft.process.trim() ||
    (outsourcingVendorSelectOptions.length === 1 &&
      Boolean(outsourcingVendorSelectOptions[0]?.disabled));

  const isOrderMode = mode === "order";
  const isApplyDisabled = isOrderMode
    ? orderDraft.factory.trim().length === 0
    : outsourcingDraft.process.trim().length === 0;

  const handleApply = () => {
    if (isApplyDisabled) return;

    blurActiveModalElement();

    if (isOrderMode) {
      onApply({
        mode,
        orderEntryId: orderEntry?.id ?? null,
        outsourcingId: null,
        draft: {
          ...orderDraft,
          quantity: Math.max(0, Number(orderDraft.quantity) || 0),
          laborCost: Math.max(0, Number(orderDraft.laborCost) || 0),
          lossCost: Math.max(0, Number(orderDraft.lossCost) || 0),
        },
      });
    } else {
      onApply({
        mode,
        orderEntryId: null,
        outsourcingId: outsourcing?.id ?? null,
        draft: {
          ...outsourcingDraft,
          process: outsourcingDraft.process.trim(),
          vendor: outsourcingDraft.vendor.trim(),
          quantity: Math.max(0, Number(outsourcingDraft.quantity) || 0),
          unitCost: Math.max(0, Number(outsourcingDraft.unitCost) || 0),
          lossCost: Math.max(0, Number(outsourcingDraft.lossCost) || 0),
        },
      });
    }
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={
        isOrderMode
          ? orderEntry
            ? copy.editOrderSheetTitle
            : copy.addOrderSheetTitle
          : outsourcing
            ? copy.editOutsourcingSheetTitle
            : copy.addOutsourcingSheetTitle
      }
      description={
        isOrderMode
          ? copy.editOrderSheetDescription
          : copy.editOutsourcingSheetDescription
      }
      maxWidthClass="md:max-w-lg"
      bodyClassName="pbp-mobile-no-zoom"
      footer={renderModalFooterActions({
        layout: "end",
        primary: {
          label: MODAL_ACTION_LABELS.apply,
          onClick: handleApply,
          disabled: isApplyDisabled,
          tone: "primary",
        },
      })}
    >
      {isOrderMode ? (
        <div className="grid gap-4">
          <div className={fieldPanelClass}>
            <label className={labelClass}>{copy.fields.vendor}</label>
            <AppSelect
              value={orderDraft.factory}
              options={factorySelectOptions}
              onValueChange={(value) => {
                blurActiveModalElement();
                setOrderDraft((current) => ({ ...current, factory: value }));
              }}
              ariaLabel={copy.fields.vendor}
              disabled={isFactorySelectDisabled}
              contentClassName="z-[4000]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.quantity}</span>
              <AppNumberInput
                inputMode="numeric"
                onBeforeInteract={handleProcessInputPointerDown}
                value={orderDraft.quantity}
                component="process-quantity-input"
                onValueChange={(value) =>
                  setOrderDraft((current) => ({ ...current, quantity: value }))
                }
                className={inputClass}
              />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.laborCost}</span>
              <AppNumberInput
                inputMode="numeric"
                onBeforeInteract={handleProcessInputPointerDown}
                value={orderDraft.laborCost}
                component="process-unit-cost-input"
                onValueChange={(value) =>
                  setOrderDraft((current) => ({ ...current, laborCost: value }))
                }
                className={inputClass}
              />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.lossCost}</span>
              <AppNumberInput
                inputMode="numeric"
                onBeforeInteract={handleProcessInputPointerDown}
                value={orderDraft.lossCost}
                component="process-loss-cost-input"
                onValueChange={(value) =>
                  setOrderDraft((current) => ({ ...current, lossCost: value }))
                }
                className={inputClass}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className={fieldPanelClass}>
            <label className={labelClass}>{copy.fields.item}</label>
            <AppSelect
              value={outsourcingDraft.process}
              options={outsourcingProcessSelectOptions}
              onValueChange={(value) => {
                blurActiveModalElement();
                setOutsourcingDraft((current) => ({
                  ...current,
                  process: value,
                  vendor: "",
                }));
              }}
              ariaLabel={copy.fields.item}
              contentClassName="z-[4000]"
            />
          </div>
          <div className={fieldPanelClass}>
            <label className={labelClass}>{copy.fields.vendor}</label>
            <AppSelect
              value={outsourcingDraft.vendor}
              options={outsourcingVendorSelectOptions}
              onValueChange={(value) => {
                blurActiveModalElement();
                setOutsourcingDraft((current) => ({
                  ...current,
                  vendor: value,
                }));
              }}
              ariaLabel={copy.fields.vendor}
              disabled={isOutsourcingVendorSelectDisabled}
              contentClassName="z-[4000]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.quantity}</span>
              <AppNumberInput
                inputMode="numeric"
                onBeforeInteract={handleProcessInputPointerDown}
                value={outsourcingDraft.quantity}
                component="process-quantity-input"
                onValueChange={(value) =>
                  setOutsourcingDraft((current) => ({
                    ...current,
                    quantity: value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.laborCost}</span>
              <AppNumberInput
                inputMode="numeric"
                onBeforeInteract={handleProcessInputPointerDown}
                value={outsourcingDraft.unitCost}
                component="process-unit-cost-input"
                onValueChange={(value) =>
                  setOutsourcingDraft((current) => ({
                    ...current,
                    unitCost: value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.lossCost}</span>
              <AppNumberInput
                inputMode="numeric"
                onBeforeInteract={handleProcessInputPointerDown}
                value={outsourcingDraft.lossCost}
                component="process-loss-cost-input"
                onValueChange={(value) =>
                  setOutsourcingDraft((current) => ({
                    ...current,
                    lossCost: value,
                  }))
                }
                className={inputClass}
              />
            </label>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
