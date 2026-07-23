import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions, type TextInput } from "react-native";
import { Check, ChevronDown, ChevronUp, FileUp, Plus, RefreshCw, RotateCcw, Trash2, type LucideIcon } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import ExpandedInlineField from "@/components/ExpandedInlineField";
import type { MaterialEditorViewState } from "@/features/materials/WorkOrderMaterialEditor";
import type { MaterialDraftFields, WorkOrderMaterialLine } from "@/domain/mobileContract";
import { calculateMaterialAmount, calculateOrderQuantity, formatQuantity, formatWon } from "@/lib/mobileDisplay";

export type MaterialReadStatus = "not-loaded" | "loading" | "loaded" | "empty" | "error" | "retrying" | "loading-more";

export type MaterialReadViewState = {
  readonly status: MaterialReadStatus;
  readonly items: readonly WorkOrderMaterialLine[];
  readonly hasMore: boolean;
  readonly errorMessage: string | null;
};

type Props = {
  readonly state: MaterialReadViewState;
  readonly archivedState: MaterialReadViewState;
  readonly archivedTotalCount: number;
  readonly canEdit: boolean;
  readonly lifecycleBusyId: string | null;
  readonly saveNotice: string | null;
  readonly activeEditor: MaterialEditorViewState | null;
  readonly activeField: keyof MaterialDraftFields | null;
  readonly onAdd: () => void;
  readonly onEdit: (line: WorkOrderMaterialLine, field: keyof MaterialDraftFields) => void;
  readonly onChangeEdit: (field: keyof MaterialDraftFields, value: string) => void;
  readonly onCancelEdit: () => void;
  readonly onSaveEdit: () => void;
  readonly onArchive: (line: WorkOrderMaterialLine) => void;
  readonly onRestore: (line: WorkOrderMaterialLine) => void;
  readonly onRetry: () => void;
  readonly onLoadMore: () => void;
  readonly onLoadMoreArchived: () => void;
  readonly onFieldFocus: (target: TextInput) => void;
};

type MaterialInlineFieldProps = {
  readonly field: keyof MaterialDraftFields;
  readonly label: string;
  readonly line: WorkOrderMaterialLine;
  readonly editor: MaterialEditorViewState | null;
  readonly activeField: keyof MaterialDraftFields | null;
  readonly canEdit: boolean;
  readonly displayValue: string;
  readonly placeholder: string;
  readonly onEdit: (field: keyof MaterialDraftFields) => void;
  readonly onChange: Props["onChangeEdit"];
  readonly onCancel: Props["onCancelEdit"];
  readonly onSave: Props["onSaveEdit"];
  readonly keyboardType?: "default" | "decimal-pad" | "number-pad";
  readonly maxLength: number;
  readonly multiline?: boolean;
  readonly displayStyle?: object;
  readonly containerStyle?: object;
  readonly testID?: string;
  readonly onFieldFocus: Props["onFieldFocus"];
};

function MaterialInlineField({
  field, label, line, editor, activeField, canEdit, displayValue, placeholder,
  onEdit, onChange, onCancel, onSave, keyboardType = "default", maxLength,
  multiline = false, displayStyle, containerStyle, testID, onFieldFocus,
}: MaterialInlineFieldProps) {
  const active = editor?.materialLineId === line.id && activeField === field;
  const editable = canEdit && line.lifecycle === "active" && line.status === "editing" && !line.locked;
  return (
    <ControlledInlineEditValue
      accessibilityLabel={label}
      active={active}
      containerStyle={containerStyle}
      dirty={active ? editor?.draft[field] !== editor?.base[field] : false}
      displayStyle={displayStyle}
      displayValue={displayValue}
      editable={editable}
      errorMessage={active ? editor?.fieldErrors[field] ?? null : null}
      invalid={active ? Boolean(editor?.fieldErrors[field]) : false}
      keyboardType={keyboardType}
      maxLength={maxLength}
      multiline={multiline}
      onActivate={() => onEdit(field)}
      onCancel={onCancel}
      onChange={(value) => onChange(field, value)}
      onSave={onSave}
      onFocusTarget={onFieldFocus}
      placeholder={placeholder}
      saving={active ? editor?.saveState === "saving" : false}
      selectTextOnFocus={!multiline}
      testID={testID}
      value={active ? editor?.draft[field] ?? "" : ""}
    />
  );
}

const STATUS_LABELS = {
  editing: "입력 중",
  requested: "발주 요청",
  completed: "발주 완료",
  cancelled: "요청 취소",
  unknown: "상태 확인 필요",
} as const;

function materialAccent(status: WorkOrderMaterialLine["status"]) {
  switch (status) {
    case "requested": return styles.cardRequested;
    case "completed": return styles.cardCompleted;
    case "cancelled": return styles.cardCancelled;
    case "unknown": return styles.cardUnknown;
    default: return styles.cardEditing;
  }
}

function materialBadge(status: WorkOrderMaterialLine["status"]) {
  switch (status) {
    case "requested": return styles.statusBadgeRequested;
    case "completed": return styles.statusBadgeCompleted;
    case "cancelled": return styles.statusBadgeCancelled;
    case "unknown": return styles.statusBadgeUnknown;
    default: return styles.statusBadgeEditing;
  }
}

function exactHexColor(value: string | null) {
  const candidate = value?.trim() ?? "";
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : null;
}

function CompactField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.compactField}>
      <Text style={styles.compactLabel}>{label}</Text>
      <Text style={styles.compactValue}>{value}</Text>
    </View>
  );
}

type ReadOnlyAction = {
  readonly label: string;
  readonly caption: string;
  readonly Icon: LucideIcon;
  readonly emphasized?: boolean;
  readonly danger?: boolean;
};

function materialActions(status: WorkOrderMaterialLine["status"]): readonly ReadOnlyAction[] {
  if (status === "completed") return [];
  if (status === "requested") {
    return [
      { label: "발주 완료 처리", caption: "완료", Icon: Check, emphasized: true },
      { label: "발주 요청 취소", caption: "취소", Icon: RotateCcw },
      { label: "삭제 예정", caption: "삭제", Icon: Trash2, danger: true },
    ];
  }
  return [
    { label: "발주 요청", caption: "발주", Icon: FileUp, emphasized: true },
    { label: "삭제 예정", caption: "삭제", Icon: Trash2, danger: true },
  ];
}

function ReadOnlyActionButton({ action, compact }: { readonly action: ReadOnlyAction; readonly compact: boolean }) {
  const { Icon } = action;
  const color = action.emphasized ? "#ffffff" : action.danger ? "#9a4035" : "#17263d";
  return (
    <Pressable
      accessibilityLabel={`${action.label}, 읽기 전용`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={[
        styles.iconActionButton,
        compact && styles.iconActionButtonCompact,
        action.emphasized && styles.iconActionEmphasized,
        action.danger && styles.iconActionDanger,
        styles.disabledAction,
      ]}
    >
      <Icon color={color} size={17} strokeWidth={2.25} />
      {!compact ? <Text style={[styles.iconActionCaption, action.emphasized && styles.iconActionCaptionEmphasized, action.danger && styles.iconActionCaptionDanger]}>{action.caption}</Text> : null}
    </Pressable>
  );
}

function MaterialCard({ line, expanded, canEdit, lifecycleBusy, editor, activeField, onEdit, onChangeEdit, onCancelEdit, onSaveEdit, onArchive, onToggle, onFieldFocus }: {
  readonly line: WorkOrderMaterialLine;
  readonly expanded: boolean;
  readonly canEdit: boolean;
  readonly lifecycleBusy: boolean;
  readonly editor: MaterialEditorViewState | null;
  readonly activeField: keyof MaterialDraftFields | null;
  readonly onEdit: (field: keyof MaterialDraftFields) => void;
  readonly onChangeEdit: Props["onChangeEdit"];
  readonly onCancelEdit: Props["onCancelEdit"];
  readonly onSaveEdit: Props["onSaveEdit"];
  readonly onArchive: () => void;
  readonly onToggle: () => void;
  readonly onFieldFocus: Props["onFieldFocus"];
}) {
  const { width } = useWindowDimensions();
  const compactActions = width < 760;
  const actions = materialActions(line.status);
  const swatch = exactHexColor(line.colorOption);
  const colorLabel = line.colorOption?.trim() || "미입력";
  const usageArea = line.usageArea?.trim() || "미입력";
  const memo = line.memo?.trim() || "없음";
  const inlineProps = { line, editor, activeField, canEdit, onEdit, onChange: onChangeEdit, onCancel: onCancelEdit, onSave: onSaveEdit, onFieldFocus };
  const cardActiveField = editor ? activeField : null;
  const activeHeaderField = cardActiveField === "name" || cardActiveField === "unitCode" ? cardActiveField : null;
  const activeSummaryField = cardActiveField === "colorOption" || cardActiveField === "unitPrice" ? cardActiveField : null;
  const activeQuantityField = cardActiveField === "requiredQuantity" || cardActiveField === "allowanceQuantity" || cardActiveField === "inventoryUsageQuantity" ? cardActiveField : null;
  const calculationDraft = editor?.materialLineId === line.id ? editor.draft : {
    requiredQuantity: line.requiredQuantity,
    allowanceQuantity: line.allowanceQuantity,
    inventoryUsageQuantity: line.inventoryUsageQuantity,
    unitPrice: line.unitPrice,
  };
  const calculatedOrderQuantity = calculateOrderQuantity(calculationDraft);
  const calculatedAmount = calculateMaterialAmount(calculatedOrderQuantity, calculationDraft.unitPrice);
  return (
    <View style={[styles.card, materialAccent(line.status)]}>
      <View style={styles.summaryButton}>
        <View style={styles.cardHeader}>
          <View style={styles.materialIdentity}>
            {activeHeaderField ? (
              <ExpandedInlineField label={activeHeaderField === "name" ? "원단명" : "단위"} testID="material-header-expanded-editor">
                {activeHeaderField === "name" ? (
                  <MaterialInlineField {...inlineProps} displayStyle={styles.materialName} displayValue={line.name} field="name" label="원단명" maxLength={200} placeholder="원단명 미입력" testID="material-inline-name" />
                ) : (
                  <MaterialInlineField {...inlineProps} displayStyle={styles.compactValue} displayValue={line.unitCode} field="unitCode" label="단위" maxLength={32} placeholder="단위 미입력" testID="material-inline-unit" />
                )}
              </ExpandedInlineField>
            ) : (
              <View style={styles.materialTitleRow}>
                <MaterialInlineField {...inlineProps} displayStyle={styles.materialName} displayValue={line.name} field="name" label="원단명" maxLength={200} placeholder="원단명 미입력" testID="material-inline-name" />
                <MaterialInlineField {...inlineProps} containerStyle={styles.unitInline} displayStyle={styles.unitChip} displayValue={line.unitCode} field="unitCode" label="단위" maxLength={32} placeholder="단위 미입력" testID="material-inline-unit" />
              </View>
            )}
          </View>
          {!activeHeaderField ? <View style={styles.headerAside}>
            <Text style={[styles.statusBadge, materialBadge(line.status)]}>{STATUS_LABELS[line.status]}</Text>
            <Pressable
              accessibilityLabel={`${line.name}, 원단 상세 ${expanded ? "접기" : "펼치기"}`}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              hitSlop={8}
              onPress={onToggle}
              style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
            >
              {expanded ? <ChevronUp color="#6b5b4d" size={18} /> : <ChevronDown color="#6b5b4d" size={18} />}
            </Pressable>
          </View> : null}
        </View>

        {activeSummaryField ? (
          <View testID="material-core-row-expanded" style={styles.coreRowExpanded}>
            <ExpandedInlineField label={activeSummaryField === "colorOption" ? "색상·옵션" : "단가"} testID="material-summary-expanded-editor">
              {activeSummaryField === "colorOption" ? (
                <MaterialInlineField {...inlineProps} displayStyle={styles.compactValue} displayValue={line.colorOption?.trim() ?? ""} field="colorOption" label="색상·옵션" maxLength={200} placeholder="미입력" testID="material-inline-color-option" />
              ) : (
                <MaterialInlineField {...inlineProps} displayStyle={styles.compactValue} displayValue={formatWon(line.unitPrice)} field="unitPrice" keyboardType="number-pad" label="단가" maxLength={16} placeholder="미입력" testID="material-inline-unit-price" />
              )}
            </ExpandedInlineField>
          </View>
        ) : (
        <View testID="material-core-row" style={styles.coreRow}>
          <CompactField label="거래처" value="—" />
          <View style={styles.compactField}>
            <Text style={styles.compactLabel}>색상·옵션</Text>
            <View style={styles.colorRow}>
              {swatch ? <View accessibilityLabel={`색상 ${colorLabel}`} style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
              <MaterialInlineField {...inlineProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} displayValue={line.colorOption?.trim() ?? ""} field="colorOption" label="색상·옵션" maxLength={200} placeholder="미입력" testID="material-inline-color-option" />
            </View>
          </View>
          <View style={styles.compactField}>
            <Text style={styles.compactLabel}>단가</Text>
            <MaterialInlineField {...inlineProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} displayValue={formatWon(line.unitPrice)} field="unitPrice" keyboardType="number-pad" label="단가" maxLength={16} placeholder="미입력" testID="material-inline-unit-price" />
          </View>
        </View>
        )}
      </View>

      {expanded ? (
        <View style={styles.expandedPanel}>
          {activeQuantityField ? (
            <View style={styles.coreRowExpanded} testID="material-quantity-row-expanded">
              <ExpandedInlineField label={activeQuantityField === "requiredQuantity" ? "필요수량" : activeQuantityField === "allowanceQuantity" ? "로스·여유" : "재고사용"} testID="material-quantity-expanded-editor">
                {activeQuantityField === "requiredQuantity" ? <MaterialInlineField {...inlineProps} displayStyle={styles.compactValue} displayValue={formatQuantity(line.requiredQuantity, line.unitCode)} field="requiredQuantity" keyboardType="decimal-pad" label="필요수량" maxLength={16} placeholder="0" testID="material-inline-required-quantity" /> : null}
                {activeQuantityField === "allowanceQuantity" ? <MaterialInlineField {...inlineProps} displayStyle={styles.compactValue} displayValue={formatQuantity(line.allowanceQuantity, line.unitCode)} field="allowanceQuantity" keyboardType="decimal-pad" label="로스·여유" maxLength={16} placeholder="0" testID="material-inline-allowance-quantity" /> : null}
                {activeQuantityField === "inventoryUsageQuantity" ? <MaterialInlineField {...inlineProps} displayStyle={styles.compactValue} displayValue={formatQuantity(line.inventoryUsageQuantity, line.unitCode)} field="inventoryUsageQuantity" keyboardType="decimal-pad" label="재고사용" maxLength={16} placeholder="0" testID="material-inline-inventory-usage" /> : null}
              </ExpandedInlineField>
            </View>
          ) : (
          <View style={styles.coreRow}>
            <View style={styles.compactField}><Text style={styles.compactLabel}>필요수량</Text><MaterialInlineField {...inlineProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} displayValue={formatQuantity(line.requiredQuantity, line.unitCode)} field="requiredQuantity" keyboardType="decimal-pad" label="필요수량" maxLength={16} placeholder="0" testID="material-inline-required-quantity" /></View>
            <View style={styles.compactField}><Text style={styles.compactLabel}>로스·여유</Text><MaterialInlineField {...inlineProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} displayValue={formatQuantity(line.allowanceQuantity, line.unitCode)} field="allowanceQuantity" keyboardType="decimal-pad" label="로스·여유" maxLength={16} placeholder="0" testID="material-inline-allowance-quantity" /></View>
            <View style={styles.compactField}><Text style={styles.compactLabel}>재고사용</Text><MaterialInlineField {...inlineProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} displayValue={formatQuantity(line.inventoryUsageQuantity, line.unitCode)} field="inventoryUsageQuantity" keyboardType="decimal-pad" label="재고사용" maxLength={16} placeholder="0" testID="material-inline-inventory-usage" /></View>
          </View>
          )}
          <View style={styles.readOnlyRows}>
            <View style={styles.readOnlyLine}><Text style={styles.readOnlyLabel}>사용부위</Text><MaterialInlineField {...inlineProps} containerStyle={styles.readOnlyInline} displayStyle={styles.readOnlyValue} displayValue={usageArea} field="usageArea" label="사용부위" maxLength={1000} multiline placeholder="미입력" testID="material-inline-usage-area" /></View>
            <View style={styles.readOnlyLine}><Text style={styles.readOnlyLabel}>메모</Text><MaterialInlineField {...inlineProps} containerStyle={styles.readOnlyInline} displayStyle={styles.readOnlyValue} displayValue={memo} field="memo" label="메모" maxLength={2000} multiline placeholder="없음" testID="material-inline-memo" /></View>
          </View>
        </View>
      ) : null}

      <View testID="material-order-action-row" style={styles.materialOrderActionRow}>
        <View testID="material-order-summary-lines" style={styles.materialOrderLineStack}>
          <View style={styles.orderInlineRow}>
            <Text style={styles.materialOrderLineText}>발주수량</Text>
            <Text accessibilityLabel="발주수량, 자동 계산, 읽기 전용" testID="material-order-quantity-calculated" style={styles.materialOrderLineText}>{formatQuantity(calculatedOrderQuantity, line.unitCode)}</Text>
            <Text style={styles.materialOrderLineText}>· 단가 {formatWon(calculationDraft.unitPrice)}</Text>
          </View>
          <Text testID="material-order-summary-amount" numberOfLines={1} style={styles.materialOrderLineText}>
            금액 {formatWon(calculatedAmount)}
          </Text>
        </View>
        {actions.length ? (
          <View testID="material-order-actions" style={styles.materialOrderActions}>
            {canEdit && line.status === "editing" ? (
              <Pressable
                accessibilityLabel={`${line.name} 삭제된 원단으로 이동`}
                accessibilityRole="button"
                accessibilityState={{ disabled: lifecycleBusy }}
                disabled={lifecycleBusy}
                onPress={onArchive}
                style={({ pressed }) => [styles.archiveActionButton, lifecycleBusy && styles.disabledAction, pressed && styles.pressed]}
              >
                {lifecycleBusy ? <ActivityIndicator color="#9a4035" size="small" /> : <Trash2 color="#9a4035" size={17} strokeWidth={2.25} />}
                {!compactActions ? <Text style={styles.iconActionCaptionDanger}>삭제</Text> : null}
              </Pressable>
            ) : null}
            {actions.filter((action) => !(canEdit && line.status === "editing" && action.danger)).map((action) => <ReadOnlyActionButton action={action} compact={compactActions} key={action.caption} />)}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ArchivedMaterialCard({ line, busy, onRestore }: {
  readonly line: WorkOrderMaterialLine;
  readonly busy: boolean;
  readonly onRestore: () => void;
}) {
  return (
    <View style={styles.archivedCard}>
      <View style={styles.archivedIdentity}>
        <Text numberOfLines={2} style={styles.archivedName}>{line.name || "원단명 미입력"}</Text>
        <Text numberOfLines={1} style={styles.archivedMeta}>{line.colorOption?.trim() || "색상 미입력"} · {formatQuantity(line.requiredQuantity, line.unitCode)}</Text>
        <Text style={styles.archivedBadge}>삭제됨</Text>
      </View>
      <Pressable
        accessibilityLabel={`${line.name} 복구`}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={onRestore}
        style={({ pressed }) => [styles.restoreButton, busy && styles.disabledAction, pressed && styles.pressed]}
      >
        {busy ? <ActivityIndicator color="#3f5731" size="small" /> : <RotateCcw color="#3f5731" size={16} strokeWidth={2.25} />}
        <Text style={styles.restoreButtonText}>복구</Text>
      </Pressable>
    </View>
  );
}

function AddMaterialButton({ onPress }: { readonly onPress: () => void }) {
  return (
    <Pressable accessibilityHint="새 원단 입력 화면을 엽니다" accessibilityLabel="원단 추가" accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
      <Plus color="#ffffff" size={19} strokeWidth={2.4} />
    </Pressable>
  );
}

export default function WorkOrderMaterialsReadOnly({
  state, archivedState, archivedTotalCount, canEdit, lifecycleBusyId, saveNotice,
  activeEditor, activeField, onAdd, onEdit, onChangeEdit, onCancelEdit, onSaveEdit,
  onArchive, onRestore, onRetry, onLoadMore, onLoadMoreArchived, onFieldFocus,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const waiting = state.status === "loading" || state.status === "retrying";

  if (waiting && state.items.length === 0) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.centerState}>
        <ActivityIndicator color="#9b4a27" />
        <Text style={styles.stateTitle}>{state.status === "retrying" ? "원단 정보를 다시 불러오는 중" : "원단 정보를 불러오는 중"}</Text>
      </View>
    );
  }

  if (state.status === "empty" && (!canEdit || archivedTotalCount === 0)) {
    return <View style={styles.centerState}><Text style={styles.stateTitle}>등록된 원단이 없습니다</Text><Text style={styles.stateCaption}>이 작업지시서에 연결된 원단 내역이 없습니다.</Text>{canEdit ? <AddMaterialButton onPress={onAdd} /> : null}</View>;
  }

  if (state.status === "error" && state.items.length === 0) {
    return (
      <View style={styles.errorState}>
        <Text accessibilityRole="alert" style={styles.errorTitle}>{state.errorMessage ?? "원단 정보를 불러오지 못했습니다"}</Text>
        <Text style={styles.stateCaption}>자동으로 다시 요청하지 않습니다.</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <RefreshCw color="#fff" size={15} />
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {canEdit || saveNotice ? (
        <View style={styles.listToolbar}>
          {saveNotice ? <Text accessibilityRole="alert" style={styles.saveNotice}>{saveNotice}</Text> : <View style={styles.toolbarSpacer} />}
          {canEdit ? <AddMaterialButton onPress={onAdd} /> : null}
        </View>
      ) : null}
      {state.status === "empty" ? (
        <View style={styles.inlineEmpty}><Text style={styles.stateTitle}>등록된 원단이 없습니다</Text><Text style={styles.stateCaption}>삭제된 원단은 아래에서 복구할 수 있습니다.</Text>{canEdit ? <AddMaterialButton onPress={onAdd} /> : null}</View>
      ) : null}
      {state.items.map((line) => (
        <MaterialCard
          activeField={activeField}
          canEdit={canEdit}
          editor={activeEditor?.materialLineId === line.id ? activeEditor : null}
          key={line.id}
          expanded={expandedIds.has(line.id)}
          lifecycleBusy={lifecycleBusyId === line.id}
          line={line}
          onArchive={() => onArchive(line)}
          onCancelEdit={onCancelEdit}
          onChangeEdit={onChangeEdit}
          onEdit={(field) => onEdit(line, field)}
          onSaveEdit={onSaveEdit}
          onFieldFocus={onFieldFocus}
          onToggle={() => setExpandedIds((current) => {
            const next = new Set(current);
            if (next.has(line.id)) next.delete(line.id);
            else next.add(line.id);
            return next;
          })}
        />
      ))}
      {state.status === "error" ? (
        <View style={styles.inlineError}>
          <Text accessibilityRole="alert" style={styles.inlineErrorText}>{state.errorMessage ?? "원단 정보를 더 불러오지 못했습니다"}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.inlineRetry}><Text style={styles.inlineRetryText}>다시 시도</Text></Pressable>
        </View>
      ) : state.hasMore ? (
        <Pressable
          accessibilityRole="button"
          disabled={state.status === "loading-more"}
          onPress={onLoadMore}
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
        >
          {state.status === "loading-more" ? <ActivityIndicator color="#6b4a36" size="small" /> : null}
          <Text style={styles.moreText}>{state.status === "loading-more" ? "더 불러오는 중" : "더 보기"}</Text>
        </Pressable>
      ) : null}
      {canEdit && archivedTotalCount > 0 ? (
        <View style={styles.archivedSection}>
          <Pressable
            accessibilityLabel={`삭제된 원단 ${archivedTotalCount}개 ${archivedExpanded ? "접기" : "펼치기"}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: archivedExpanded }}
            onPress={() => setArchivedExpanded((current) => !current)}
            style={({ pressed }) => [styles.archivedSectionHeader, pressed && styles.pressed]}
          >
            <Text style={styles.archivedSectionTitle}>삭제된 원단 {archivedTotalCount}개</Text>
            {archivedExpanded ? <ChevronUp color="#6b5b4d" size={18} /> : <ChevronDown color="#6b5b4d" size={18} />}
          </Pressable>
          {archivedExpanded ? (
            <View style={styles.archivedList}>
              {archivedState.items.map((line) => (
                <ArchivedMaterialCard busy={lifecycleBusyId === line.id} key={line.id} line={line} onRestore={() => onRestore(line)} />
              ))}
              {archivedState.hasMore ? (
                <Pressable accessibilityRole="button" disabled={archivedState.status === "loading-more"} onPress={onLoadMoreArchived} style={styles.archivedMoreButton}>
                  <Text style={styles.archivedMoreText}>{archivedState.status === "loading-more" ? "불러오는 중" : "삭제된 원단 더 보기"}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centerState: { alignItems: "center", gap: 8, justifyContent: "center", minHeight: 180, padding: 24 },
  stateTitle: { color: "#3f352d", fontFamily: WAFL_FONTS.bold, fontSize: 15, textAlign: "center" },
  stateCaption: { color: "#827568", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 18, textAlign: "center" },
  errorState: { alignItems: "center", backgroundColor: "#fff8f4", borderColor: "#e2c4bc", borderRadius: 12, borderWidth: 1, gap: 8, margin: 12, minHeight: 170, padding: 22 },
  errorTitle: { color: "#992f2b", fontFamily: WAFL_FONTS.bold, fontSize: 15, textAlign: "center" },
  retryButton: { alignItems: "center", backgroundColor: "#9b4a27", borderRadius: 10, flexDirection: "row", gap: 6, minHeight: 44, paddingHorizontal: 16 },
  retryText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  pressed: { opacity: 0.7 },
  list: { gap: 10, padding: 12, paddingBottom: 16 },
  listToolbar: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "space-between", minHeight: 44 },
  toolbarSpacer: { flex: 1 },
  saveNotice: { color: "#4d6a3a", flex: 1, fontFamily: WAFL_FONTS.bold, fontSize: 11, lineHeight: 16, minWidth: 0 },
  addButton: { alignItems: "center", backgroundColor: "#17263d", borderRadius: 8, height: 40, justifyContent: "center", width: 40 },
  card: { backgroundColor: "#fffdf8", borderColor: "#e7ded1", borderLeftWidth: 4, borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  cardEditing: { borderLeftColor: "#a89d90" },
  cardRequested: { borderLeftColor: "#c75f35" },
  cardCompleted: { backgroundColor: "#fbfaf6", borderLeftColor: "#4d6a3a" },
  cardCancelled: { borderLeftColor: "#963d34" },
  cardUnknown: { borderLeftColor: "#7c746d" },
  summaryButton: { minHeight: 84, paddingHorizontal: 10, paddingVertical: 9 },
  cardHeader: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  materialIdentity: { flex: 1, minWidth: 0 },
  materialTitleRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 7 },
  materialName: { color: "#17263d", flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 14, lineHeight: 20, minWidth: 0 },
  unitInline: { flexShrink: 0 },
  unitChip: { backgroundColor: "#f2eadf", borderRadius: 999, color: "#6b5b4d", flexShrink: 0, fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  colorRow: { alignItems: "center", flexDirection: "row", gap: 5, minWidth: 0 },
  swatch: { borderColor: "#aa9d90", borderRadius: 4, borderWidth: 1, flexShrink: 0, height: 18, width: 18 },
  headerAside: { alignItems: "flex-end", gap: 8 },
  expandButton: { alignItems: "center", height: 34, justifyContent: "center", width: 34 },
  statusBadge: { borderRadius: 999, fontFamily: WAFL_FONTS.bold, fontSize: 10, minWidth: 64, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, textAlign: "center" },
  statusBadgeEditing: { backgroundColor: "#ece8e0", color: "#534b43" },
  statusBadgeRequested: { backgroundColor: "#ffe1c8", color: "#9b4a27" },
  statusBadgeCompleted: { backgroundColor: "#e4eadc", color: "#3f5731" },
  statusBadgeCancelled: { backgroundColor: "#f5d8d2", color: "#963d34" },
  statusBadgeUnknown: { backgroundColor: "#eee9e2", color: "#675f58" },
  expandedPanel: { borderTopColor: "#eee3d5", borderTopWidth: 1, paddingHorizontal: 10, paddingTop: 7 },
  coreRow: { alignItems: "flex-start", flexDirection: "row", gap: 5, marginTop: 7, width: "100%" },
  coreRowExpanded: { alignItems: "stretch", marginTop: 7, minWidth: 0, width: "100%" },
  compactField: { flex: 1, minWidth: 0 },
  compactInline: { flex: 1, minWidth: 0 },
  compactLabel: { color: "#8b7e72", fontFamily: WAFL_FONTS.medium, fontSize: 9, lineHeight: 13 },
  compactValue: { color: "#3f352d", flexShrink: 1, fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 16, marginTop: 1, minWidth: 0 },
  readOnlyRows: { marginTop: 4 },
  readOnlyLine: { alignItems: "flex-start", borderTopColor: "#f0e7dc", borderTopWidth: 1, flexDirection: "row", gap: 10, minHeight: 28, paddingVertical: 5 },
  readOnlyLabel: { color: "#827568", flexShrink: 0, fontFamily: WAFL_FONTS.medium, fontSize: 10, lineHeight: 17, width: 54 },
  readOnlyValue: { color: "#3f352d", flex: 1, fontFamily: WAFL_FONTS.regular, fontSize: 11, lineHeight: 17, minWidth: 0 },
  readOnlyInline: { flex: 1, minWidth: 0 },
  materialOrderActionRow: { alignItems: "center", borderTopColor: "#eee3d5", borderTopWidth: 1, flexDirection: "row", gap: 6, justifyContent: "space-between", marginHorizontal: 10, minHeight: 38, paddingVertical: 4 },
  materialOrderActionSummary: { color: "#7b4b32", flex: 1, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 11, fontVariant: ["tabular-nums"], lineHeight: 16, minWidth: 0 },
  materialOrderLineStack: { flex: 1, justifyContent: "center", minWidth: 0 },
  materialOrderLineText: { color: "#7b4b32", flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 11, fontVariant: ["tabular-nums"], lineHeight: 15, minWidth: 0 },
  orderInlineRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 3, minWidth: 0 },
  orderInlineValue: { flexShrink: 1, minWidth: 56 },
  materialOrderActions: { flexDirection: "row", flexShrink: 0, gap: 3, marginLeft: "auto" },
  iconActionButton: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d8d0c3", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 3, height: 30, justifyContent: "center", minWidth: 58, paddingHorizontal: 8 },
  archiveActionButton: { alignItems: "center", backgroundColor: "#fff5f0", borderColor: "#e5b7ac", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 3, height: 30, justifyContent: "center", minWidth: 36, paddingHorizontal: 7 },
  iconActionButtonCompact: { borderRadius: 7, minWidth: 36, paddingHorizontal: 4, width: 36 },
  iconActionEmphasized: { backgroundColor: "#23375a", borderColor: "#23375a" },
  iconActionDanger: { backgroundColor: "#fff5f0", borderColor: "#e5b7ac" },
  disabledAction: { opacity: 0.46 },
  iconActionCaption: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  iconActionCaptionEmphasized: { color: "#fff" },
  iconActionCaptionDanger: { color: "#9a4035" },
  inlineError: { alignItems: "center", backgroundColor: "#fff8f4", borderRadius: 10, gap: 8, padding: 12 },
  inlineEmpty: { alignItems: "center", backgroundColor: "#faf7f1", borderRadius: 8, gap: 7, padding: 14 },
  inlineErrorText: { color: "#992f2b", fontFamily: WAFL_FONTS.medium, fontSize: 12, textAlign: "center" },
  inlineRetry: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14 },
  inlineRetryText: { color: "#8b4526", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  moreButton: { alignItems: "center", borderColor: "#cdbdad", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44 },
  moreText: { color: "#6b4a36", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  archivedSection: { backgroundColor: "#f5f1eb", borderColor: "#ddd3c7", borderRadius: 8, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  archivedSectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 44, paddingHorizontal: 12 },
  archivedSectionTitle: { color: "#5d544c", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  archivedList: { borderTopColor: "#ddd3c7", borderTopWidth: 1, gap: 7, padding: 8 },
  archivedCard: { alignItems: "center", backgroundColor: "#fbf9f5", borderColor: "#ddd5ca", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 8, minHeight: 72, padding: 10 },
  archivedIdentity: { flex: 1, minWidth: 0 },
  archivedName: { color: "#4f4943", fontFamily: WAFL_FONTS.bold, fontSize: 12, lineHeight: 17 },
  archivedMeta: { color: "#817970", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 15, marginTop: 2 },
  archivedBadge: { alignSelf: "flex-start", backgroundColor: "#e9e3dc", borderRadius: 999, color: "#746b62", fontFamily: WAFL_FONTS.bold, fontSize: 9, marginTop: 4, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 2 },
  restoreButton: { alignItems: "center", backgroundColor: "#f0f5eb", borderColor: "#b6c4aa", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 4, minHeight: 38, paddingHorizontal: 10 },
  restoreButtonText: { color: "#3f5731", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  archivedMoreButton: { alignItems: "center", justifyContent: "center", minHeight: 38 },
  archivedMoreText: { color: "#6b5b4d", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
});
