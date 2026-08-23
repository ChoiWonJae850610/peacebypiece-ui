import { useMemo, useState } from "react";
import type { WorkOrderMajorCategoryCode } from "@/domain/workOrderCategoryPolicy";
import {
  composeWorkOrderSeason,
  parseWorkOrderSeason,
  WORK_ORDER_SEASON_TERMS,
  workOrderDetailItemOptions,
  workOrderSeasonYearOptions,
} from "@/domain/workOrderOverviewPickerPolicy";
import WaflInputModeSwitch from "@/features/inputs/WaflInputModeSwitch";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflReelPickerSheet, { WaflPairedOptionReelPickerSheet } from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import { useWaflNestedSheetHandoff } from "@/features/inputs/useWaflNestedSheetHandoff";

type CommonProps = {
  readonly value: string;
  readonly onApply: (value: string) => void;
  readonly onCancel: () => void;
};

export function WorkOrderSeasonPickerSheet({ value, onApply, onCancel }: CommonProps) {
  const parsed = parseWorkOrderSeason(value);
  const years = useMemo(() => workOrderSeasonYearOptions(), []);
  const nested = useWaflNestedSheetHandoff<"picker" | "direct">("picker");
  const [year, setYear] = useState(parsed?.year ?? years[1] ?? String(new Date().getFullYear()));
  const [term, setTerm] = useState<(typeof WORK_ORDER_SEASON_TERMS)[number]>(parsed?.term ?? "SS");
  const [directValue, setDirectValue] = useState(parsed ? "" : value);
  const finishClose = nested.finishClose;

  if (nested.route === "direct") return <WaflInputSheet
    cancelAccessibilityLabel="시즌 변경 취소"
    confirmAccessibilityLabel="시즌 직접 입력 적용"
    confirmDisabled={!directValue.trim()}
    onAfterClose={finishClose}
    onCancel={onCancel}
    onConfirm={() => onApply(directValue.trim())}
    presentationGeneration={nested.presentationGeneration}
    sizing="adaptiveExpandable"
    title="시즌 직접입력"
    visible={nested.visible}
  >
    <WaflSheetValueField label="시즌" maxLength={16} onChange={setDirectValue} placeholder="예: 26FW" value={directValue} />
    <WaflInputModeSwitch mode="direct" onPress={() => nested.transition("picker")} />
  </WaflInputSheet>;

  return <WaflPairedOptionReelPickerSheet
    footer={<WaflInputModeSwitch mode="picker" onPress={() => nested.transition("direct")} testID="season-direct-input-action" />}
    leftAccessibilityLabel="시즌 연도 선택 릴"
    leftLabel="연도"
    leftOptions={years.map((option) => ({ value: option, label: option }))}
    leftValue={year}
    onAfterClose={finishClose}
    onApply={() => onApply(composeWorkOrderSeason(year, term))}
    onCancel={onCancel}
    onSelectLeft={setYear}
    onSelectRight={(next) => setTerm(next as typeof term)}
    presentationGeneration={nested.presentationGeneration}
    rightAccessibilityLabel="시즌 구분 선택 릴"
    rightLabel="시즌"
    rightOptions={WORK_ORDER_SEASON_TERMS.map((option) => ({ value: option, label: option }))}
    rightValue={term}
    title="시즌"
    visible={nested.visible}
  />;
}

export function WorkOrderDetailItemPickerSheet({ categoryCode, value, onApply, onCancel }: CommonProps & { readonly categoryCode: WorkOrderMajorCategoryCode | null }) {
  const nested = useWaflNestedSheetHandoff<"picker" | "direct">("picker");
  const choices = useMemo(() => workOrderDetailItemOptions(categoryCode), [categoryCode]);
  const known = choices.includes(value);
  const selection = known ? value : choices[0] ?? "";
  const [directValue, setDirectValue] = useState(known ? "" : value);

  if (nested.route === "direct") return <WaflInputSheet
    cancelAccessibilityLabel="세부 품목 변경 취소"
    confirmAccessibilityLabel="세부 품목 직접 입력 적용"
    confirmDisabled={!directValue.trim()}
    onAfterClose={nested.finishClose}
    onCancel={onCancel}
    onConfirm={() => onApply(directValue.trim())}
    presentationGeneration={nested.presentationGeneration}
    sizing="adaptiveExpandable"
    title="세부 품목 직접입력"
    visible={nested.visible}
  >
    <WaflSheetValueField label="세부 품목" maxLength={24} onChange={setDirectValue} placeholder="세부 품목을 입력해 주세요" value={directValue} />
    <WaflInputModeSwitch mode="direct" onPress={() => nested.transition("picker")} />
  </WaflInputSheet>;

  return <WaflReelPickerSheet
    field="categoryDetail"
    footer={<WaflInputModeSwitch mode="picker" onPress={() => nested.transition("direct")} testID="detail-item-direct-input-action" />}
    kind="option"
    label="세부 품목"
    onAfterClose={nested.finishClose}
    onCancel={onCancel}
    onApply={(next) => onApply(next)}
    optionItems={choices.map((option) => ({ value: option, label: option }))}
    presentationGeneration={nested.presentationGeneration}
    unitCode=""
    value={selection}
    visible={nested.visible}
  />;
}
