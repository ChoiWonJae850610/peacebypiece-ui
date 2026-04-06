import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import PartnerFactoryRegistryModal, { type RegistryType } from "@/components/workorder/PartnerFactoryRegistryModal";
import { CATEGORY1_OPTIONS, CATEGORY2_OPTIONS_MAP, CATEGORY3_OPTIONS_MAP, DEFAULT_BASIC_YEAR, DEFAULT_FACTORY_OPTION, DEFAULT_MATERIAL_TYPE, DEFAULT_MATERIAL_UNIT, DEFAULT_OUTSOURCING_PROCESS, DEFAULT_OUTSOURCING_UNIT, DEFAULT_PARTNER_OPTION, FACTORY_OPTIONS, MATERIAL_TYPE_OPTIONS, MATERIAL_UNIT_OPTIONS, OUTSOURCING_PROCESS_OPTIONS, OUTSOURCING_UNIT_OPTIONS, PARTNER_OPTIONS, PRIORITY_OPTIONS, SEASON_OPTIONS, YEAR_OPTIONS } from "@/lib/constants/workorderOptions";
import type { DisplayStage } from "@/types/workflow";
import { getStageTone } from "@/lib/constants/workflow";
import { toDisplayValue } from "@/lib/utils/display";
import type { Material, Outsourcing, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

type RowValue = string | number | null | undefined;
type EditableSectionKey = "basic" | "material" | "outsourcing";
type EditableCell = { section: EditableSectionKey; rowId: string; field: string } | null;
type SelectOption = readonly string[];
type BasicInfoState = {
  category1: string;
  category2: string;
  category3: string;
  partner: string;
  factory: string;
  season: string;
  year: string;
  priority: string;
  dueDate: string;
  quantity: number;
};

function SectionHeader({
  title,
  summary,
  open,
  onToggle,
  rightSlot,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-stone-300 hover:bg-stone-50"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-900 md:text-base">{title}</div>
          <div className="mt-1 truncate text-xs text-stone-500 md:text-sm">{summary}</div>
        </div>
        <span
          aria-hidden="true"
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        >
          ▾
        </span>
      </button>
      {rightSlot ? <div className="hidden shrink-0 md:block">{rightSlot}</div> : null}
    </div>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNumericField(field: string) {
  return field === "quantity" || field === "unitCost";
}

function formatNumericDisplay(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return "0";
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString();
}

function getEditingInitialValue(field: string, value: string) {
  return isNumericField(field) ? value.replace(/,/g, "") : value;
}

function getDisplayValue(field: string, value: string) {
  return isNumericField(field) ? formatNumericDisplay(value) : value;
}

function recalculateMaterial(item: Material): Material {
  return {
    ...item,
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

function recalculateOutsourcing(item: Outsourcing): Outsourcing {
  return {
    ...item,
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

function isEditingCell(editingCell: EditableCell, section: EditableSectionKey, rowId: string, field: string) {
  return editingCell?.section === section && editingCell.rowId === rowId && editingCell.field === field;
}

function DeleteButton({ onClick, srLabel }: { onClick: () => void; srLabel: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={srLabel}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-base font-semibold text-rose-600 transition hover:bg-rose-50"
    >
      -
    </button>
  );
}

function EditableValue({
  section,
  rowId,
  field,
  value,
  editingCell,
  editingValue,
  inputMode,
  inputType = "text",
  alignRight,
  options,
  onStartEdit,
  onCommit,
  onCancel,
}: {
  section: EditableSectionKey;
  rowId: string;
  field: string;
  value: string;
  editingCell: EditableCell;
  editingValue: string;
  inputMode?: "text" | "decimal" | "numeric";
  inputType?: "text" | "date";
  alignRight?: boolean;
  options?: SelectOption;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommit: (nextValue?: string) => void;
  onCancel: () => void;
}) {
  const editing = isEditingCell(editingCell, section, rowId, field);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  const handleSelectKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit((event.currentTarget as HTMLSelectElement).value);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  if (editing && options) {
    return (
      <select
        autoFocus
        value={editingValue}
        onChange={(event) => onCommit(event.target.value)}
        onBlur={(event) => onCommit(event.target.value)}
        onKeyDown={handleSelectKeyDown}
        className={`h-9 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-stone-900 outline-none ring-0 transition focus:border-stone-400 ${alignRight ? "text-right tabular-nums" : "text-left"}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={inputType}
        inputMode={inputType === "date" ? undefined : inputMode}
        value={editingValue}
        onChange={(event) => onStartEdit(section, rowId, field, event.target.value)}
        onBlur={() => onCommit()}
        onKeyDown={handleInputKeyDown}
        className={`h-9 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-stone-900 outline-none ring-0 transition focus:border-stone-400 ${alignRight ? "text-right tabular-nums" : "text-left"}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onStartEdit(section, rowId, field, getEditingInitialValue(field, value))}
      className={`flex h-9 w-full min-w-0 items-center rounded-lg border border-transparent px-2.5 text-sm text-stone-900 transition hover:border-stone-200 hover:bg-stone-50 ${alignRight ? "justify-end text-right tabular-nums" : "text-left"}`}
    >
      <span className="block w-full truncate">{getDisplayValue(field, value) || "-"}</span>
    </button>
  );
}



function getCategory2Options(category1: string) {
  return CATEGORY2_OPTIONS_MAP[category1] ?? CATEGORY2_OPTIONS_MAP[CATEGORY1_OPTIONS[0]] ?? [];
}

function getCategory3Options(category2: string) {
  return CATEGORY3_OPTIONS_MAP[category2] ?? CATEGORY3_OPTIONS_MAP[getCategory2Options(CATEGORY1_OPTIONS[0])[0] ?? ""] ?? [];
}

function sanitizeSelectValue(value: string, options: readonly string[], fallback?: string) {
  if (value && options.includes(value)) return value;
  return fallback ?? options[0] ?? "";
}

function appendOption(options: string[], value: string) {
  const trimmed = value.trim();
  if (!trimmed) return options;
  if (options.includes(trimmed)) return options;
  return [...options, trimmed];
}

function parseSeasonYear(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(SS|FW|NOS|ALL)(?:\s+(\d{4}))?$/i);
  if (match) {
    return {
      season: match[1].toUpperCase(),
      year: match[2] ?? DEFAULT_BASIC_YEAR,
    };
  }

  const [first = "", second = ""] = trimmed.split(/\s+/);
  return {
    season: first || SEASON_OPTIONS[0],
    year: second || DEFAULT_BASIC_YEAR,
  };
}

function getInitialBasicInfo(workOrder: WorkOrder): BasicInfoState {
  const parsedSeason = parseSeasonYear(workOrder.season);
  const category1 = workOrder.category1 || CATEGORY1_OPTIONS[0];
  const category2Options = getCategory2Options(category1);
  const category2 = workOrder.category2 || category2Options[0] || "";
  const category3Options = getCategory3Options(category2);
  const category3 = workOrder.category3 || category3Options[0] || "";

  return {
    category1,
    category2,
    category3,
    partner: DEFAULT_PARTNER_OPTION,
    factory: workOrder.vendor || DEFAULT_FACTORY_OPTION,
    season: parsedSeason.season || SEASON_OPTIONS[0],
    year: parsedSeason.year || DEFAULT_BASIC_YEAR,
    priority: workOrder.priority || PRIORITY_OPTIONS[0],
    dueDate: workOrder.dueDate || "",
    quantity: Number.isFinite(workOrder.quantity) ? workOrder.quantity : 0,
  };
}

function StageProgressBar({
  stages,
  currentStage,
  actions,
  onAction,
}: {
  stages: DisplayStage[];
  currentStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
}) {
  const currentIndex = stages.indexOf(currentStage);
  const primaryActionIndex = actions.findIndex((action) => !action.label.includes("반려"));

  const getDotTone = (stage: DisplayStage) => {
    const tone = getStageTone(stage);
    return tone.includes("bg-") ? tone : "bg-stone-900 text-white";
  };

  const getTrackTone = (stage: DisplayStage) => {
    const tone = getStageTone(stage);
    return tone.includes("bg-violet")
      ? "bg-violet-300"
      : tone.includes("bg-fuchsia")
      ? "bg-fuchsia-300"
      : tone.includes("bg-amber")
      ? "bg-amber-300"
      : tone.includes("bg-blue")
      ? "bg-blue-300"
      : tone.includes("bg-emerald")
      ? "bg-emerald-300"
      : tone.includes("bg-stone")
      ? "bg-stone-400"
      : "bg-stone-300";
  };

  const currentStageTone = getStageTone(currentStage);
  const currentStageDotTone = currentStageTone.includes("bg-") ? currentStageTone : "bg-stone-900 text-white";
  const currentStageTrackTone = currentStageTone.includes("bg-violet")
    ? "bg-violet-300"
    : currentStageTone.includes("bg-fuchsia")
    ? "bg-fuchsia-300"
    : currentStageTone.includes("bg-amber")
    ? "bg-amber-300"
    : currentStageTone.includes("bg-blue")
    ? "bg-blue-300"
    : currentStageTone.includes("bg-emerald")
    ? "bg-emerald-300"
    : currentStageTone.includes("bg-stone")
    ? "bg-stone-400"
    : "bg-stone-300";
  const stageGroups: Array<{ label: string; stages: DisplayStage[] }> = [
    { label: "제작", stages: ["작성중", "검토요청", "검토완료"] },
    { label: "생산", stages: ["발주요청"] },
    { label: "검수", stages: ["검수", "완료"] },
  ];
  const currentGroupIndex = stageGroups.findIndex((group) => group.stages.includes(currentStage));
  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 md:mt-5 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-stone-900 md:text-sm">진행 단계</div>
        </div>
        {actions.length > 0 ? (
          <div className="hidden flex-wrap justify-end gap-2 md:flex">
            {actions.map((action, index) => {
              const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
              return (
                <button
                  key={`${currentStage}-${action.nextState}-${action.label}-desktop`}
                  type="button"
                  onClick={() => onAction(action)}
                  className={isPrimary
                    ? "rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800"
                    : "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100"
                  }
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-stone-200 bg-white p-2 md:px-3 md:py-2.5">
          {stageGroups.map((group, index) => {
            const isCurrentGroup = index === currentGroupIndex;
            const isCompletedGroup = currentGroupIndex > index;
            return (
              <div
                key={group.label}
                className={`rounded-xl border px-2 py-2 text-center ${
                  isCurrentGroup
                    ? "border-stone-900 bg-stone-900 text-white"
                    : isCompletedGroup
                    ? "border-stone-300 bg-stone-100 text-stone-700"
                    : "border-stone-200 bg-stone-50 text-stone-400"
                }`}
              >
                <div className="text-[11px] font-semibold md:text-xs">{group.label}</div>
                <div className="mt-1 text-[10px] leading-3 opacity-80 md:text-[11px]">
                  {group.stages.join(" · ")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 md:hidden">
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {stages.map((stage, index) => {
              const isCurrent = stage === currentStage;
              const isDone = currentIndex >= 0 && index < currentIndex;
              const isUpcoming = !isCurrent && !isDone;
              const dotTone = getDotTone(stage);
              const trackTone = getTrackTone(stage);
              return (
                <div key={`${stage}-mobile`} className="flex items-center gap-1.5">
                  <div className="flex min-w-[48px] flex-col items-center text-center">
                    <div
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                        isCurrent
                          ? dotTone
                          : isDone
                          ? `${trackTone} text-transparent`
                          : "bg-stone-300 text-transparent"
                      }`}
                    >
                      •
                    </div>
                    <div className={`mt-1 text-[10px] leading-3 ${isCurrent ? "font-semibold text-stone-900" : isUpcoming ? "text-stone-400" : "text-stone-600"}`}>
                      {stage}
                    </div>
                  </div>
                  {index < stages.length - 1 ? <div className={`h-0.5 w-5 shrink-0 rounded-full ${index < currentIndex ? trackTone : "bg-stone-200"}`} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 hidden overflow-x-auto pb-1 md:block">
        <div className="flex min-w-max items-center gap-2">
          {stages.map((stage, index) => {
            const isCurrent = stage === currentStage;
            const isDone = currentIndex >= 0 && index < currentIndex;
            const isUpcoming = !isCurrent && !isDone;
            const dotTone = getDotTone(stage);
            const trackTone = getTrackTone(stage);

            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="flex min-w-[82px] flex-col items-center text-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isCurrent
                        ? dotTone
                        : isDone
                        ? `${trackTone} text-white`
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>
                  <div
                    className={`mt-1.5 text-[11px] leading-4 ${
                      isCurrent
                        ? "font-semibold text-stone-900"
                        : isUpcoming
                        ? "text-stone-500"
                        : "text-stone-700"
                    }`}
                  >
                    {stage}
                  </div>
                </div>
                {index < stages.length - 1 ? <div className={`h-px w-6 shrink-0 ${index < currentIndex ? trackTone : "bg-stone-300"}`} /> : null}
              </div>
            );
          })}
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 md:hidden">
          {actions.map((action, index) => {
            const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
            return (
              <button
                key={`${currentStage}-${action.nextState}-${action.label}-mobile`}
                type="button"
                onClick={() => onAction(action)}
                className={isPrimary
                  ? "flex-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800 sm:flex-none"
                  : "flex-1 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 sm:flex-none"
                }
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function BasicInfoSection({
  basicInfo,
  factoryOptions,
  open,
  onToggle,
  onOpenRegistryModal,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: {
  basicInfo: BasicInfoState;
  factoryOptions: readonly string[];
  open: boolean;
  onToggle: () => void;
  onOpenRegistryModal: (type: RegistryType) => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
}) {
  const category2Options = getCategory2Options(basicInfo.category1);
  const category3Options = getCategory3Options(basicInfo.category2);
  const infoItems = [
    { label: "대분류", field: "category1", value: basicInfo.category1, options: CATEGORY1_OPTIONS },
    { label: "중분류", field: "category2", value: basicInfo.category2, options: category2Options },
    { label: "소분류", field: "category3", value: basicInfo.category3, options: category3Options },
    { label: "공장", field: "factory", value: basicInfo.factory, options: factoryOptions, registerType: "공장" as RegistryType },
    { label: "시즌", field: "season", value: basicInfo.season, options: SEASON_OPTIONS },
    { label: "연도", field: "year", value: basicInfo.year, options: YEAR_OPTIONS },
    { label: "우선순위", field: "priority", value: basicInfo.priority, options: PRIORITY_OPTIONS },
    { label: "납기일", field: "dueDate", value: basicInfo.dueDate, inputType: "date" as const },
    { label: "발주 수량", field: "quantity", value: basicInfo.quantity.toLocaleString(), inputMode: "numeric" as const, alignRight: true },
  ];

  const summary = [
    basicInfo.category1,
    basicInfo.category2,
    basicInfo.factory !== DEFAULT_FACTORY_OPTION ? basicInfo.factory : "",
    `${basicInfo.season} ${basicInfo.year}`.trim(),
    `${basicInfo.quantity.toLocaleString()}장`,
    basicInfo.dueDate,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader title="기본 정보" summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {infoItems.map((item) => (
              <div key={item.field} className="min-w-0 rounded-xl border border-stone-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-stone-500">{item.label}</div>
                  {item.registerType ? (
                    <button
                      type="button"
                      onClick={() => onOpenRegistryModal(item.registerType)}
                      className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-stone-200 px-2.5 text-[11px] font-medium text-stone-700 transition hover:bg-stone-50"
                    >
                      등록
                    </button>
                  ) : null}
                </div>
                <div className="mt-2">
                  <EditableValue
                    section="basic"
                    rowId="basic"
                    field={item.field}
                    value={String(item.value)}
                    editingCell={editingCell}
                    editingValue={editingValue}
                    inputMode={item.inputMode}
                    inputType={item.inputType}
                    alignRight={item.alignRight}
                    options={item.options}
                    onStartEdit={onStartEdit}
                    onCommit={onCommitEdit}
                    onCancel={onCancelEdit}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MaterialSection({
  materials,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
}: {
  materials: Material[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = materials.length > 0
    ? `${materials[0].name}${materials.length > 1 ? ` 외 ${materials.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 원단/부자재가 없습니다.";

  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader
        title="원단 / 부자재 구성"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {materials.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{item.name || `자재 ${index + 1}`}</div>
                    <div className="mt-1 text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${index + 1}`} 삭제`} />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["구분", "type", item.type, "text"],
                    ["자재명", "name", item.name, "text"],
                    ["거래처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["단위", "unit", item.unit, "text"],
                    ["단가", "unitCost", item.unitCost.toLocaleString(), "decimal"],
                    ["상태", "status", item.status, "text"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className="flex items-center justify-between gap-4">
                      <span className="shrink-0 text-xs text-stone-500">{label}</span>
                      <div className="min-w-0 flex-1">
                        <EditableValue
                          section="material"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={inputMode as "text" | "decimal"}
                          options={field === "type" ? MATERIAL_TYPE_OPTIONS : field === "unit" ? MATERIAL_UNIT_OPTIONS : undefined}
                          alignRight={field === "quantity" || field === "unitCost"}
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4">
                    <span className="shrink-0 text-xs text-stone-500">금액</span>
                    <span className="text-sm font-medium text-stone-900">{(item.totalCost ?? 0).toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              + 항목 추가
            </button>
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[19%]" />
                <col className="w-[18%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[60px]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["구분", "자재명", "거래처", "수량", "단위", "단가", "금액", "상태", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`px-2 py-3 text-xs font-medium ${header === "수량" || header === "단가" || header === "금액" ? "text-right" : header === "" ? "text-center" : "text-left"}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((item, rowIndex) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="type" value={item.type} options={MATERIAL_TYPE_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="name" value={item.name} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="vendor" value={item.vendor} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} options={MATERIAL_UNIT_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 text-right align-middle font-medium tabular-nums">{(item.totalCost ?? 0).toLocaleString()}원</td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="status" value={item.status} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="px-2 py-2 text-center align-middle">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${rowIndex + 1}`} 삭제`} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={9} className="px-2 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                    >
                      + 항목 추가
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function OutsourcingSection({
  outsourcing,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
}: {
  outsourcing: Outsourcing[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = outsourcing.length > 0
    ? `${outsourcing[0].process}${outsourcing.length > 1 ? ` 외 ${outsourcing.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 외주 공정이 없습니다.";

  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader
        title="외주 공정"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {outsourcing.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{item.process || `공정 ${index + 1}`}</div>
                    <div className="mt-1 text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${index + 1}`} 삭제`} />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["공정", "process", item.process, "text"],
                    ["외주처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["단가기준", "unitType", item.unitType, "text"],
                    ["단가", "unitCost", item.unitCost.toLocaleString(), "decimal"],
                    ["상태", "status", item.status, "text"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className="flex items-center justify-between gap-4">
                      <span className="shrink-0 text-xs text-stone-500">{label}</span>
                      <div className="min-w-0 flex-1">
                        <EditableValue
                          section="outsourcing"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={inputMode as "text" | "decimal"}
                          options={field === "process" ? OUTSOURCING_PROCESS_OPTIONS : field === "unitType" ? OUTSOURCING_UNIT_OPTIONS : undefined}
                          alignRight={field === "quantity" || field === "unitCost"}
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4">
                    <span className="shrink-0 text-xs text-stone-500">금액</span>
                    <span className="text-sm font-medium text-stone-900">{(item.totalCost ?? 0).toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              + 공정 추가
            </button>
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[60px]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["공정", "외주처", "수량", "단가기준", "단가", "금액", "상태", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`px-2 py-3 text-xs font-medium ${header === "수량" || header === "단가" || header === "금액" ? "text-right" : header === "" ? "text-center" : "text-left"}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outsourcing.map((item, rowIndex) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} options={OUTSOURCING_PROCESS_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} options={OUTSOURCING_UNIT_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 text-right align-middle font-medium tabular-nums">{(item.totalCost ?? 0).toLocaleString()}원</td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="status" value={item.status} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="px-2 py-2 text-center align-middle">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${rowIndex + 1}`} 삭제`} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={8} className="px-2 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                    >
                      + 공정 추가
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function WorkOrderDetail({
  workOrder,
  currentWorkflowState,
  saveStatus,
  lastSavedAt,
  currentInventoryQuantity,
  currentUserName,
  currentRole,
  canEditInventory,
  canSeeProductionSections,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  onSave,
  onOpenInventoryEditor,
  onToggleBasicInfo,
  onToggleMaterial,
  onToggleOutsourcing,
  visibleStages,
  currentDisplayStage,
  actions,
  onAction,
}: {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  saveStatus: "saved" | "dirty" | "saving";
  lastSavedAt: string | null;
  currentInventoryQuantity: number;
  currentUserName: string;
  currentRole: string;
  canEditInventory: boolean;
  canSeeProductionSections: boolean;
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onSave: () => void;
  onOpenInventoryEditor: () => void;
  onToggleBasicInfo: () => void;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  visibleStages: DisplayStage[];
  currentDisplayStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
}) {
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [partnerOptions, setPartnerOptions] = useState<string[]>(() => Array.from(new Set(PARTNER_OPTIONS)));
  const [factoryOptions, setFactoryOptions] = useState<string[]>(() => appendOption(Array.from(new Set(FACTORY_OPTIONS)), workOrder.vendor || ""));
  const [registryModalOpen, setRegistryModalOpen] = useState(false);
  const [registryType, setRegistryType] = useState<RegistryType>("거래처");
  const [materialItems, setMaterialItems] = useState<Material[]>(() => (workOrder.materials ?? []).map(recalculateMaterial));
  const [outsourcingItems, setOutsourcingItems] = useState<Outsourcing[]>(() => (workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    setBasicInfo((current) => {
      const next = getInitialBasicInfo(workOrder);
      return {
        ...next,
        partner: sanitizeSelectValue(current.partner, partnerOptions, next.partner),
        factory: sanitizeSelectValue(current.factory, appendOption(factoryOptions, workOrder.vendor || ""), next.factory),
      };
    });
    setFactoryOptions((current) => appendOption(current, workOrder.vendor || ""));
  }, [workOrder, partnerOptions, factoryOptions]);

  useEffect(() => {
    setMaterialItems((workOrder.materials ?? []).map(recalculateMaterial));
  }, [workOrder.materials]);

  useEffect(() => {
    setOutsourcingItems((workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  }, [workOrder.outsourcing]);

  const startEdit = (section: EditableSectionKey, rowId: string, field: string, value: string) => {
    setEditingCell({ section, rowId, field });
    setEditingValue(value);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const commitEdit = (nextValueOverride?: string) => {
    if (!editingCell) return;

    const nextValue = (nextValueOverride ?? editingValue).trim();

    if (editingCell.section === "basic") {
      setBasicInfo((current) => {
        if (editingCell.field === "category1") {
          const category1 = nextValue || CATEGORY1_OPTIONS[0];
          const nextCategory2Options = getCategory2Options(category1);
          const category2 = nextCategory2Options[0] ?? "";
          const nextCategory3Options = getCategory3Options(category2);
          return {
            ...current,
            category1,
            category2,
            category3: nextCategory3Options[0] ?? "",
          };
        }
        if (editingCell.field === "category2") {
          const category2 = nextValue || getCategory2Options(current.category1)[0] || "";
          const nextCategory3Options = getCategory3Options(category2);
          return {
            ...current,
            category2,
            category3: nextCategory3Options[0] ?? "",
          };
        }
        if (editingCell.field === "category3") {
          return { ...current, category3: nextValue || getCategory3Options(current.category2)[0] || "" };
        }
        if (editingCell.field === "season") {
          return { ...current, season: nextValue || SEASON_OPTIONS[0] };
        }
        if (editingCell.field === "year") {
          return { ...current, year: nextValue || DEFAULT_BASIC_YEAR };
        }
        if (editingCell.field === "priority") {
          return { ...current, priority: nextValue || PRIORITY_OPTIONS[0] };
        }
        if (editingCell.field === "partner") {
          return { ...current, partner: sanitizeSelectValue(nextValue, partnerOptions, DEFAULT_PARTNER_OPTION) };
        }
        if (editingCell.field === "factory") {
          return { ...current, factory: sanitizeSelectValue(nextValue, factoryOptions, DEFAULT_FACTORY_OPTION) };
        }
        if (editingCell.field === "dueDate") {
          return { ...current, dueDate: nextValue };
        }
        if (editingCell.field === "quantity") {
          return { ...current, quantity: toNumber(nextValue) };
        }
        return current;
      });
    }

    if (editingCell.section === "material") {
      setMaterialItems((current) =>
        current.map((item) => {
          if (item.id !== editingCell.rowId) return item;

          if (editingCell.field === "quantity") {
            return recalculateMaterial({ ...item, quantity: toNumber(nextValue) });
          }
          if (editingCell.field === "unitCost") {
            return recalculateMaterial({ ...item, unitCost: toNumber(nextValue) });
          }
          if (editingCell.field === "type") {
            return { ...item, type: (nextValue || "원단") as Material["type"] };
          }

          return { ...item, [editingCell.field]: nextValue } as Material;
        }),
      );
    }

    if (editingCell.section === "outsourcing") {
      setOutsourcingItems((current) =>
        current.map((item) => {
          if (item.id !== editingCell.rowId) return item;

          if (editingCell.field === "quantity") {
            return recalculateOutsourcing({ ...item, quantity: toNumber(nextValue) });
          }
          if (editingCell.field === "unitCost") {
            return recalculateOutsourcing({ ...item, unitCost: toNumber(nextValue) });
          }

          return { ...item, [editingCell.field]: nextValue } as Outsourcing;
        }),
      );
    }

    cancelEdit();
  };

  const addMaterial = () => {
    setMaterialItems((current) => [
      ...current,
      recalculateMaterial({
        id: createId("material"),
        type: DEFAULT_MATERIAL_TYPE,
        name: "새 자재",
        vendor: "",
        quantity: 0,
        unit: DEFAULT_MATERIAL_UNIT,
        unitCost: 0,
        totalCost: 0,
        status: "준비",
      }),
    ]);
  };

  const removeMaterial = (id: string) => {
    setMaterialItems((current) => current.filter((item) => item.id !== id));
    if (editingCell?.section === "material" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const addOutsourcing = () => {
    setOutsourcingItems((current) => [
      ...current,
      recalculateOutsourcing({
        id: createId("outsourcing"),
        process: DEFAULT_OUTSOURCING_PROCESS,
        vendor: "",
        quantity: 0,
        unitType: DEFAULT_OUTSOURCING_UNIT,
        unitCost: 0,
        totalCost: 0,
        status: "대기",
      }),
    ]);
  };

  const removeOutsourcing = (id: string) => {
    setOutsourcingItems((current) => current.filter((item) => item.id !== id));
    if (editingCell?.section === "outsourcing" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const openRegistryModal = (type: RegistryType) => {
    setRegistryType(type);
    setRegistryModalOpen(true);
  };

  const closeRegistryModal = () => {
    setRegistryModalOpen(false);
  };

  const handleRegistrySave = ({ type, name }: { type: RegistryType; name: string }) => {
    if (type === "거래처") {
      setPartnerOptions((current) => appendOption(current, name));
      setBasicInfo((current) => ({ ...current, partner: name }));
      return;
    }

    setFactoryOptions((current) => appendOption(current, name));
    setBasicInfo((current) => ({ ...current, factory: name }));
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
      <div className="border-b border-stone-200 pb-4">
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3 md:block">
                <h2 className="mt-1 break-keep text-2xl font-semibold">{workOrder.title}</h2>
                <button
                  type="button"
                  onClick={onSave}
                  className="shrink-0 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800 md:hidden"
                >
                  저장
                </button>
              </div>
              <div className="mt-3 text-xs text-stone-400">최근 변경 {lastSavedAt || "-"}</div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pr-2 text-sm text-stone-600 md:hidden">
                <span className="truncate">담당자 <span className="font-medium text-stone-900">{workOrder.manager || "-"}</span></span>
                {canEditInventory ? (
                  <button
                    type="button"
                    onClick={onOpenInventoryEditor}
                    className="inline-flex items-center bg-transparent p-0 text-sm font-medium text-stone-700 underline-offset-2 transition hover:text-stone-900 hover:underline"
                  >
                    현재 재고 <span className="ml-1 tabular-nums text-stone-900">{currentInventoryQuantity.toLocaleString()}장</span>
                  </button>
                ) : (
                  <span>현재 재고 <span className="font-medium tabular-nums text-stone-900">{currentInventoryQuantity.toLocaleString()}장</span></span>
                )}
              </div>
            </div>
            <div className="hidden shrink-0 md:flex md:min-w-[220px] md:flex-col md:items-end md:gap-3 md:text-right">
              <button
                type="button"
                onClick={onSave}
                className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800"
              >
                저장
              </button>
              <div className="flex flex-col items-end gap-3 text-right">
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm text-stone-600">
                  <span>담당자 <span className="font-medium text-stone-900">{workOrder.manager || "-"}</span></span>
                  {canEditInventory ? (
                    <button
                      type="button"
                      onClick={onOpenInventoryEditor}
                      className="inline-flex items-center bg-transparent p-0 text-sm font-medium text-stone-700 underline-offset-2 transition hover:text-stone-900 hover:underline"
                    >
                      현재 재고 <span className="ml-1 tabular-nums text-stone-900">{currentInventoryQuantity.toLocaleString()}장</span>
                    </button>
                  ) : (
                    <span>현재 재고 <span className="font-medium tabular-nums text-stone-900">{currentInventoryQuantity.toLocaleString()}장</span></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StageProgressBar stages={visibleStages} currentStage={currentDisplayStage} actions={actions} onAction={onAction} />

      <div className="mt-6 grid gap-6">
        <BasicInfoSection
          basicInfo={basicInfo}
          factoryOptions={factoryOptions}
          open={basicInfoOpen}
          onToggle={onToggleBasicInfo}
          onOpenRegistryModal={openRegistryModal}
          editingCell={editingCell}
          editingValue={editingValue}
          onStartEdit={startEdit}
          onCommitEdit={commitEdit}
          onCancelEdit={cancelEdit}
        />

        {canSeeProductionSections ? (
          <MaterialSection
            materials={materialItems}
            open={materialOpen}
            onToggle={onToggleMaterial}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onAdd={addMaterial}
            onRemove={removeMaterial}
          />
        ) : null}
        {canSeeProductionSections ? (
          <OutsourcingSection
            outsourcing={outsourcingItems}
            open={outsourcingOpen}
            onToggle={onToggleOutsourcing}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onAdd={addOutsourcing}
            onRemove={removeOutsourcing}
          />
        ) : null}

        <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
          <h3 className="text-base font-semibold">작업 메모</h3>
          <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{workOrder.memo}</div>
        </div>
      </div>

      <PartnerFactoryRegistryModal
        open={registryModalOpen}
        initialType={registryType}
        onClose={closeRegistryModal}
        onSave={handleRegistrySave}
      />
    </div>
  );
}
