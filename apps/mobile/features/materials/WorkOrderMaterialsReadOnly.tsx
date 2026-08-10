import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextInput,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Check, ChevronDown, ChevronUp, FileUp, Plus, RefreshCw, RotateCcw, Trash2, type LucideIcon } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import ExpandedInlineField from "@/components/ExpandedInlineField";
import ReelInlineEditValue from "@/features/inputs/reel-picker/ReelInlineEditValue";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import MaterialQuantityValue from "@/features/materials/MaterialQuantityValue";
import { createMaterialMemoDisclosureModel } from "@/features/materials/materialMemoDisclosureModel";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import {
  createMaterialHeaderPresentation,
  MATERIAL_HEADER_NAME_MAX_LINES,
} from "@/features/materials/materialHeaderLayoutModel";
import type { MaterialEditorViewState } from "@/features/materials/WorkOrderMaterialEditor";
import type { MaterialInlineEditSession } from "@/features/materials/materialInlineEditSession";
import { materialReelDraftPatch, type MaterialReelField } from "@/features/materials/materialReelAdapter";
import { MOBILE_MATERIAL_FIELD_LABELS } from "@/features/materials/materialFieldPolicy";
import type { MaterialDraftFields, MaterialDraftUpdate, MaterialType, WorkOrderMaterialLine } from "@/domain/mobileContract";
import type { MaterialOrderAction, MaterialOrderPolicy } from "@/domain/materialOrderPolicy";
import { calculateMaterialAmount, calculateOrderQuantity, formatQuantity, formatWon } from "@/lib/mobileDisplay";

export type MaterialReadStatus = "not-loaded" | "loading" | "loaded" | "empty" | "error" | "retrying" | "loading-more";

export type MaterialReadViewState = {
  readonly status: MaterialReadStatus;
  readonly items: readonly WorkOrderMaterialLine[];
  readonly hasMore: boolean;
  readonly errorMessage: string | null;
};

type Props = {
  readonly materialType: MaterialType;
  readonly state: MaterialReadViewState;
  readonly canEdit: boolean;
  readonly lifecycleBusyId: string | null;
  readonly orderBusyId: string | null;
  readonly orderBusyAction: MaterialOrderAction | null;
  readonly saveNotice: string | null;
  readonly activeEditor: MaterialEditorViewState | null;
  readonly activeField: keyof MaterialDraftFields | null;
  readonly activeInlineSession: MaterialInlineEditSession | null;
  readonly onAdd: () => void;
  readonly onEdit: (line: WorkOrderMaterialLine, field: keyof MaterialDraftFields) => void;
  readonly onChangeEdit: (field: keyof MaterialDraftFields, value: string) => void;
  readonly onChangeInlineEdit: (field: keyof MaterialDraftFields, value: string, owner: MaterialInlineEditSession) => void;
  readonly onCancelEdit: () => void;
  readonly onCancelInlineEdit: (owner: MaterialInlineEditSession) => void;
  readonly onSaveEdit: (draftOverride?: MaterialDraftUpdate) => void;
  readonly onSaveInlineEdit: (draftOverride: MaterialDraftUpdate, owner: MaterialInlineEditSession) => void;
  readonly onDelete: (line: WorkOrderMaterialLine) => void;
  readonly onOrderAction: (line: WorkOrderMaterialLine, action: MaterialOrderAction) => void;
  readonly orderPolicy: (line: WorkOrderMaterialLine) => MaterialOrderPolicy;
  readonly onRetry: () => void;
  readonly onLoadMore: () => void;
  readonly onFieldFocus: (target: TextInput) => void;
};

type MaterialInlineFieldProps = {
  readonly field: keyof MaterialDraftFields;
  readonly label: string;
  readonly line: WorkOrderMaterialLine;
  readonly editor: MaterialEditorViewState | null;
  readonly activeField: keyof MaterialDraftFields | null;
  readonly activeInlineSession: MaterialInlineEditSession | null;
  readonly canEdit: boolean;
  readonly displayValue: string;
  readonly placeholder: string;
  readonly onEdit: (field: keyof MaterialDraftFields) => void;
  readonly onChange: Props["onChangeInlineEdit"];
  readonly onCancel: Props["onCancelInlineEdit"];
  readonly onSave: Props["onSaveInlineEdit"];
  readonly keyboardType?: "default" | "decimal-pad" | "number-pad";
  readonly maxLength: number;
  readonly multiline?: boolean;
  readonly numberOfLines?: number | null;
  readonly displayStyle?: object;
  readonly containerStyle?: object;
  readonly testID?: string;
  readonly onFieldFocus: Props["onFieldFocus"];
};

type ReelTarget = {
  readonly field: MaterialReelField;
  readonly label: string;
  readonly value: string;
  readonly unitCode: string;
};

function MaterialInlineField({
  field, label, line, editor, activeField, activeInlineSession, canEdit, displayValue, placeholder,
  onEdit, onChange, onCancel, onSave, keyboardType = "default", maxLength,
  multiline = false, numberOfLines = 2, displayStyle, containerStyle, testID, onFieldFocus,
}: MaterialInlineFieldProps) {
  const active = editor?.materialLineId === line.id
    && activeField === field
    && activeInlineSession?.itemId === line.id
    && activeInlineSession.field === field;
  const owner = active ? activeInlineSession : null;
  const editable = canEdit;
  return (
    <ControlledInlineEditValue
      accessibilityLabel={label}
      active={active}
      containerStyle={containerStyle}
      commitMode={["name", "colorOption", "unitPrice", "usageArea", "memo"].includes(field) ? "blur-submit" : "explicit"}
      dirty={active ? editor?.draft[field] !== editor?.base[field] : false}
      displayStyle={displayStyle}
      displayValue={displayValue}
      editable={editable}
      errorMessage={active ? editor?.fieldErrors[field] ?? null : null}
      invalid={active ? Boolean(editor?.fieldErrors[field]) : false}
      keyboardType={keyboardType}
      maxLength={maxLength}
      multiline={multiline}
      numberOfLines={numberOfLines}
      onActivate={() => onEdit(field)}
      onCancel={() => { if (owner) onCancel(owner); }}
      onChange={(value) => { if (owner) onChange(field, value, owner); }}
      onSave={(finalizedValue) => { if (owner) onSave({ [field]: finalizedValue } as MaterialDraftUpdate, owner); }}
      onFocusTarget={onFieldFocus}
      placeholder={placeholder}
      saving={active ? editor?.saveState === "saving" : false}
      testID={testID}
      value={active ? editor?.draft[field] ?? "" : ""}
    />
  );
}

function MaterialReelInlineField({
  field,
  label,
  line,
  editor,
  activeField,
  canEdit,
  onEdit,
  onOpen,
  containerStyle,
  displayStyle,
  displayNumberOfLines,
  testID,
}: {
  readonly field: MaterialReelField;
  readonly label: string;
  readonly line: WorkOrderMaterialLine;
  readonly editor: MaterialEditorViewState | null;
  readonly activeField: keyof MaterialDraftFields | null;
  readonly canEdit: boolean;
  readonly onEdit: (field: keyof MaterialDraftFields) => void;
  readonly onOpen: (target: ReelTarget) => void;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly displayStyle?: StyleProp<TextStyle>;
  readonly displayNumberOfLines?: number;
  readonly testID?: string;
}) {
  const active = editor?.materialLineId === line.id && activeField === field;
  const editable = canEdit;
  const draft = editor?.materialLineId === line.id ? editor.draft : null;
  const unitCode = draft?.unitCode ?? line.unitCode;
  const value = field === "unitCode" ? unitCode : draft?.[field] ?? line[field];
  const displayValue = field === "unitCode" ? unitCode : formatQuantity(value, unitCode);
  const displayContent = field === "unitCode" ? undefined : (
    <MaterialQuantityValue textStyle={displayStyle} unitCode={unitCode} value={typeof value === "string" ? value : null} />
  );
  const open = () => onOpen({
    field,
    label,
    value: field === "unitCode" ? draft?.requiredQuantity ?? line.requiredQuantity : value,
    unitCode,
  });
  return (
    <ReelInlineEditValue
      accessibilityLabel={label}
      active={active}
      containerStyle={containerStyle}
      displayStyle={displayStyle}
      displayContent={displayContent}
      displayNumberOfLines={displayNumberOfLines}
      displayValue={displayValue}
      editable={editable}
      errorMessage={active ? editor?.fieldErrors[field] ?? null : null}
      onActivate={() => onEdit(field)}
      onOpenPicker={open}
      placeholder={field === "unitCode" ? "단위 미입력" : "0"}
      saving={active ? editor?.saveState === "saving" : false}
      testID={testID}
    />
  );
}

function materialAccent(tone: MaterialOrderPolicy["tone"]) {
  switch (tone) {
    case "requested": return styles.cardRequested;
    case "completed": return styles.cardCompleted;
    case "legacy-cancelled": return styles.cardCancelled;
    case "unknown": return styles.cardUnknown;
    default: return styles.cardEditing;
  }
}

function materialBadge(tone: MaterialOrderPolicy["tone"]) {
  switch (tone) {
    case "requested": return styles.statusBadgeRequested;
    case "completed": return styles.statusBadgeCompleted;
    case "legacy-cancelled": return styles.statusBadgeCancelled;
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

type MaterialOrderActionView = {
  readonly kind: MaterialOrderAction;
  readonly label: string;
  readonly caption: string;
  readonly Icon: LucideIcon;
  readonly emphasized?: boolean;
  readonly danger?: boolean;
};

const MATERIAL_ORDER_ACTION_VIEW: Record<MaterialOrderAction, MaterialOrderActionView> = {
  request: { kind: "request", label: "발주요청", caption: "발주", Icon: FileUp, emphasized: true },
  complete: { kind: "complete", label: "발주완료", caption: "완료", Icon: Check, emphasized: true },
  cancel: { kind: "cancel", label: "발주취소", caption: "취소", Icon: RotateCcw, danger: true },
};

function MaterialOrderActionButton({
  action,
  busy,
  compact,
  onPress,
}: {
  readonly action: MaterialOrderActionView;
  readonly busy: boolean;
  readonly compact: boolean;
  readonly onPress: () => void;
}) {
  const { Icon } = action;
  const color = action.emphasized ? "#ffffff" : action.danger ? "#9a4035" : "#17263d";
  return (
    <Pressable
      accessibilityLabel={action.label}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconActionButton,
        compact && styles.iconActionButtonCompact,
        action.emphasized && styles.iconActionEmphasized,
        action.danger && styles.iconActionDanger,
        busy && styles.disabledAction,
        pressed && styles.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={color} size="small" /> : <Icon color={color} size={17} strokeWidth={2.25} />}
      {!compact ? <Text style={[styles.iconActionCaption, action.emphasized && styles.iconActionCaptionEmphasized, action.danger && styles.iconActionCaptionDanger]}>{action.caption}</Text> : null}
    </Pressable>
  );
}

function MaterialCard({ line, expanded, canEdit, lifecycleBusy, orderBusyAction, orderPolicy, editor, activeField, activeInlineSession, onEdit, onChangeEdit, onCancelEdit, onSaveEdit, onDelete, onOrderAction, onToggle, onFieldFocus, onOpenReel }: {
  readonly line: WorkOrderMaterialLine;
  readonly expanded: boolean;
  readonly canEdit: boolean;
  readonly lifecycleBusy: boolean;
  readonly orderBusyAction: MaterialOrderAction | null;
  readonly orderPolicy: MaterialOrderPolicy;
  readonly editor: MaterialEditorViewState | null;
  readonly activeField: keyof MaterialDraftFields | null;
  readonly activeInlineSession: MaterialInlineEditSession | null;
  readonly onEdit: (field: keyof MaterialDraftFields) => void;
  readonly onChangeEdit: Props["onChangeInlineEdit"];
  readonly onCancelEdit: Props["onCancelInlineEdit"];
  readonly onSaveEdit: Props["onSaveInlineEdit"];
  readonly onDelete: () => void;
  readonly onOrderAction: (action: MaterialOrderAction) => void;
  readonly onToggle: () => void;
  readonly onFieldFocus: Props["onFieldFocus"];
  readonly onOpenReel: (target: ReelTarget) => void;
}) {
  const { width } = useWindowDimensions();
  const compactActions = width < 760;
  const actions = orderPolicy.actions.map((action) => MATERIAL_ORDER_ACTION_VIEW[action]);
  const swatch = exactHexColor(line.colorOption);
  const colorLabel = line.colorOption?.trim() || "미입력";
  const usageArea = line.usageArea?.trim() || "미입력";
  const memo = line.memo?.trim() || "없음";
  const memoStateKey = `${line.id}\u0000${line.memo ?? ""}`;
  const [memoExpandedKey, setMemoExpandedKey] = useState<string | null>(null);
  const [memoMeasurement, setMemoMeasurement] = useState({ key: "", lineCount: 0 });
  const fieldEditable = canEdit && orderPolicy.canEdit;
  const inlineProps = { line, editor, activeField, activeInlineSession, canEdit: fieldEditable, onEdit, onChange: onChangeEdit, onCancel: onCancelEdit, onSave: onSaveEdit, onFieldFocus };
  const reelProps = { line, editor, activeField, canEdit: fieldEditable, onEdit, onOpen: onOpenReel };
  const cardActiveField = editor ? activeField : null;
  const activeHeaderField = cardActiveField === "unitCode" ? cardActiveField : null;
  const activeQuantityField = cardActiveField === "requiredQuantity" || cardActiveField === "allowanceQuantity" ? cardActiveField : null;
  const memoIsActive = editor?.materialLineId === line.id && cardActiveField === "memo";
  const memoExpanded = expanded && memoExpandedKey === memoStateKey;
  const memoLineCount = memoMeasurement.key === memoStateKey ? memoMeasurement.lineCount : 0;
  const memoDisclosure = createMaterialMemoDisclosureModel(memoLineCount, memoExpanded);
  const calculationDraft = editor?.materialLineId === line.id ? editor.draft : {
    requiredQuantity: line.requiredQuantity,
    allowanceQuantity: line.allowanceQuantity,
    inventoryUsageQuantity: line.inventoryUsageQuantity,
    unitPrice: line.unitPrice,
  };
  const calculatedOrderQuantity = calculateOrderQuantity(calculationDraft);
  const calculatedAmount = calculateMaterialAmount(calculatedOrderQuantity, calculationDraft.unitPrice);
  const materialLabel = line.materialType === "accessory" ? "부자재" : "원단";
  const materialNameLabel = `${materialLabel}명`;
  const headerPresentation = createMaterialHeaderPresentation({
    name: line.name,
    unitCode: line.unitCode,
    statusLabel: orderPolicy.label,
  });
  return (
    <View style={[styles.card, materialAccent(orderPolicy.tone)]}>
      <View style={styles.summaryButton}>
        <View style={styles.cardHeader}>
          <View style={styles.materialIdentity}>
            {activeHeaderField ? (
              <ExpandedInlineField label="단위" testID="material-header-expanded-editor">
                <MaterialReelInlineField {...reelProps} displayStyle={styles.compactValue} field="unitCode" label="단위" testID="material-inline-unit" />
              </ExpandedInlineField>
            ) : (
              <MaterialInlineField
                {...inlineProps}
                displayStyle={styles.materialName}
                displayValue={headerPresentation.name}
                field="name"
                label={materialNameLabel}
                maxLength={200}
                numberOfLines={MATERIAL_HEADER_NAME_MAX_LINES}
                placeholder={`${materialNameLabel} 미입력`}
                testID="material-inline-name"
              />
            )}
          </View>
          {!activeHeaderField ? <View style={styles.headerAside}>
            <View style={styles.headerBadgeCluster} testID="material-header-badge-cluster">
              <MaterialReelInlineField
                {...reelProps}
                containerStyle={styles.unitInline}
                displayNumberOfLines={1}
                displayStyle={styles.unitChip}
                field="unitCode"
                label="단위"
                testID="material-inline-unit"
              />
              <Text
                maxFontSizeMultiplier={1.3}
                numberOfLines={1}
                style={[styles.statusBadge, materialBadge(orderPolicy.tone)]}
              >
                {headerPresentation.badgeCluster[1].text}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={`${line.name}, ${materialLabel} 상세 ${expanded ? "접기" : "펼치기"}`}
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

        <View testID="material-core-row" style={styles.coreRow}>
          <CompactField label={MOBILE_MATERIAL_FIELD_LABELS.partner} value="—" />
          <View style={styles.compactField}>
            <Text style={styles.compactLabel}>색상·옵션</Text>
            <View style={styles.colorRow}>
              {swatch ? <View accessibilityLabel={`색상 ${colorLabel}`} style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
              <MaterialInlineField {...inlineProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} displayValue={line.colorOption?.trim() ?? ""} field="colorOption" label="색상·옵션" maxLength={200} placeholder="미입력" testID="material-inline-color-option" />
            </View>
          </View>
        </View>
      </View>

      {expanded ? (
        <View style={styles.expandedPanel}>
          {activeQuantityField ? (
            <View style={styles.coreRowExpanded} testID="material-quantity-row-expanded">
              <ExpandedInlineField label={activeQuantityField === "requiredQuantity" ? "필요수량" : "로스·여유"} testID="material-quantity-expanded-editor">
                {activeQuantityField === "requiredQuantity" ? <MaterialReelInlineField {...reelProps} displayStyle={styles.compactValue} field="requiredQuantity" label="필요수량" testID="material-inline-required-quantity" /> : null}
                {activeQuantityField === "allowanceQuantity" ? <MaterialReelInlineField {...reelProps} displayStyle={styles.compactValue} field="allowanceQuantity" label="로스·여유" testID="material-inline-allowance-quantity" /> : null}
              </ExpandedInlineField>
            </View>
          ) : (
          <View style={styles.coreRow}>
            <View style={styles.compactField}><Text style={styles.compactLabel}>필요수량</Text><MaterialReelInlineField {...reelProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} field="requiredQuantity" label="필요수량" testID="material-inline-required-quantity" /></View>
            <View style={styles.compactField}><Text style={styles.compactLabel}>단가</Text><MaterialInlineField {...inlineProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} displayValue={formatWon(calculationDraft.unitPrice)} field="unitPrice" keyboardType="number-pad" label="단가" maxLength={16} placeholder="0원" testID="material-inline-unit-price" /></View>
            <View style={styles.compactField}><Text style={styles.compactLabel}>로스·여유</Text><MaterialReelInlineField {...reelProps} containerStyle={styles.compactInline} displayStyle={styles.compactValue} field="allowanceQuantity" label="로스·여유" testID="material-inline-allowance-quantity" /></View>
          </View>
          )}
          <View style={styles.readOnlyRows}>
            <View style={styles.readOnlyLine}><Text style={styles.readOnlyLabel}>사용부위</Text><MaterialInlineField {...inlineProps} containerStyle={styles.readOnlyInline} displayStyle={styles.readOnlyValue} displayValue={usageArea} field="usageArea" label="사용부위" maxLength={1000} multiline placeholder="미입력" testID="material-inline-usage-area" /></View>
            <View style={styles.readOnlyLine}>
              <Text style={styles.readOnlyLabel}>메모</Text>
              <View style={styles.memoColumn}>
                <MaterialInlineField
                  {...inlineProps}
                  containerStyle={styles.readOnlyInline}
                  displayStyle={styles.readOnlyValue}
                  displayValue={memo}
                  field="memo"
                  label="메모"
                  maxLength={2000}
                  multiline
                  numberOfLines={memoDisclosure.numberOfLines}
                  placeholder="없음"
                  testID="material-inline-memo"
                />
                {!memoIsActive ? (
                  <Text
                    accessible={false}
                    importantForAccessibility="no-hide-descendants"
                    onTextLayout={(event) => {
                      const lineCount = event.nativeEvent.lines.length;
                      setMemoMeasurement((current) => (
                        current.key === memoStateKey && current.lineCount === lineCount
                          ? current
                          : { key: memoStateKey, lineCount }
                      ));
                    }}
                    pointerEvents="none"
                    style={[styles.readOnlyValue, styles.memoMeasure]}
                  >
                    {memo}
                  </Text>
                ) : null}
                {!memoIsActive && memoDisclosure.hasOverflow ? (
                  <Pressable
                    accessibilityLabel={`메모 전체 내용 ${memoDisclosure.expanded ? "접기" : "펼치기"}`}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: memoExpanded }}
                    hitSlop={8}
                    onPress={() => setMemoExpandedKey(memoExpanded ? null : memoStateKey)}
                    style={({ pressed }) => [styles.memoDisclosure, pressed && styles.pressed]}
                    testID="material-memo-disclosure"
                  >
                    <Text style={styles.memoDisclosureText}>{memoDisclosure.label}</Text>
                    {memoDisclosure.expanded ? <ChevronUp color="#7b4b32" size={14} /> : <ChevronDown color="#7b4b32" size={14} />}
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <View testID="material-order-action-row" style={styles.materialOrderActionRow}>
        <View testID="material-order-summary-lines" style={styles.materialOrderLineStack}>
          <View style={styles.orderInlineRow}>
            <Text style={styles.materialOrderLineText}>발주수량</Text>
            <MaterialQuantityValue
              accessibilityLabel={`발주수량, 자동 계산, 읽기 전용, ${formatQuantity(calculatedOrderQuantity, line.unitCode)}`}
              testID="material-order-quantity-calculated"
              textStyle={styles.materialOrderLineText}
              unitCode={line.unitCode}
              value={calculatedOrderQuantity}
            />
            <Text style={styles.materialOrderLineText}>· 단가 {formatWon(calculationDraft.unitPrice)}</Text>
          </View>
          <Text testID="material-order-summary-amount" numberOfLines={1} style={styles.materialOrderLineText}>
            금액 {formatWon(calculatedAmount)}
          </Text>
        </View>
        {actions.length || orderPolicy.canEdit ? (
          <View testID="material-order-actions" style={styles.materialOrderActions}>
            {actions.map((action) => (
              <MaterialOrderActionButton
                action={action}
                busy={orderBusyAction === action.kind}
                compact={compactActions}
                key={action.kind}
                onPress={() => onOrderAction(action.kind)}
              />
            ))}
            {orderPolicy.canEdit && line.deletable ? (
              <Pressable
                accessibilityLabel={`${line.name} ${materialLabel} 영구 삭제`}
                accessibilityRole="button"
                accessibilityState={{ disabled: lifecycleBusy }}
                disabled={lifecycleBusy}
                onPress={onDelete}
                style={({ pressed }) => [styles.archiveActionButton, lifecycleBusy && styles.disabledAction, pressed && styles.pressed]}
              >
                {lifecycleBusy ? <ActivityIndicator color="#9a4035" size="small" /> : <Trash2 color="#9a4035" size={17} strokeWidth={2.25} />}
                {!compactActions ? <Text style={styles.iconActionCaptionDanger}>삭제</Text> : null}
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function AddMaterialButton({ materialType, onPress }: { readonly materialType: MaterialType; readonly onPress: () => void }) {
  const materialLabel = materialType === "accessory" ? "부자재" : "원단";
  return (
    <Pressable
      accessibilityHint={`새 ${materialLabel} 입력 화면을 엽니다`}
      accessibilityLabel={`${materialLabel} 추가`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      testID={`material-add-${materialType}`}
    >
      <Plus color="#ffffff" size={19} strokeWidth={2.4} />
      <Text style={styles.addButtonText}>{materialLabel} 추가</Text>
    </Pressable>
  );
}

export default function WorkOrderMaterialsReadOnly({
  materialType, state, canEdit, lifecycleBusyId, orderBusyId, orderBusyAction,
  activeEditor, activeField, activeInlineSession, onAdd, onEdit, onChangeInlineEdit, onCancelEdit, onCancelInlineEdit, onSaveEdit, onSaveInlineEdit,
  onDelete, onOrderAction, orderPolicy, onRetry, onLoadMore, onFieldFocus,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [reelTarget, setReelTarget] = useState<ReelTarget | null>(null);
  const waiting = state.status === "loading" || state.status === "retrying";
  const materialLabel = materialType === "accessory" ? "부자재" : "원단";
  const materialSubject = materialType === "accessory" ? "부자재가" : "원단이";

  if (waiting && state.items.length === 0) {
    return (
      <DelayedLoadingMessage
        identity={`materials:${materialType}`}
        loading
        scope={materialType}
      />
    );
  }

  if (state.status === "empty") {
    return <View style={styles.centerState}><Text style={styles.stateTitle}>등록된 {materialSubject} 없습니다</Text><Text style={styles.stateCaption}>이 작업지시서에 연결된 {materialLabel} 내역이 없습니다.</Text>{canEdit ? <AddMaterialButton materialType={materialType} onPress={onAdd} /> : null}</View>;
  }

  if (state.status === "error" && state.items.length === 0) {
    return (
      <View style={styles.errorState}>
        <Text accessibilityRole="alert" style={styles.errorTitle}>{state.errorMessage ?? `${materialLabel} 정보를 불러오지 못했습니다`}</Text>
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
      {reelTarget ? (
        <WaflReelPickerSheet
          field={reelTarget.field}
          kind={reelTarget.field === "unitCode" ? "unit" : "quantity"}
          label={reelTarget.label}
          onApply={(value, unitCode) => {
            const patch = materialReelDraftPatch({ field: reelTarget.field, value, unitCode, currentUnitCode: reelTarget.unitCode });
            setReelTarget(null);
            onSaveEdit(patch);
          }}
          onCancel={() => {
            setReelTarget(null);
            onCancelEdit();
          }}
          unitCode={reelTarget.unitCode}
          value={reelTarget.value}
          visible
        />
      ) : null}
      {canEdit ? (
        <View style={styles.listToolbar}>
          <AddMaterialButton materialType={materialType} onPress={onAdd} />
        </View>
      ) : null}
      {state.items.map((line) => (
        <MaterialCard
          activeField={activeField}
          activeInlineSession={activeInlineSession}
          canEdit={canEdit}
          editor={activeEditor?.materialLineId === line.id ? activeEditor : null}
          key={line.id}
          expanded={expandedIds.has(line.id)}
          lifecycleBusy={lifecycleBusyId === line.id}
          orderBusyAction={orderBusyId === line.id ? orderBusyAction : null}
          orderPolicy={orderPolicy(line)}
          line={line}
          onDelete={() => onDelete(line)}
          onOrderAction={(action) => onOrderAction(line, action)}
          onCancelEdit={onCancelInlineEdit}
          onChangeEdit={onChangeInlineEdit}
          onEdit={(field) => onEdit(line, field)}
          onOpenReel={setReelTarget}
          onSaveEdit={onSaveInlineEdit}
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
          <Text accessibilityRole="alert" style={styles.inlineErrorText}>{state.errorMessage ?? `${materialLabel} 정보를 더 불러오지 못했습니다`}</Text>
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
  listToolbar: { gap: 8, minHeight: 44, width: "100%" },
  addButton: { alignItems: "center", alignSelf: "stretch", backgroundColor: "#17263d", borderRadius: 8, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44, paddingHorizontal: 14, width: "100%" },
  addButtonText: { color: "#ffffff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  card: { backgroundColor: "#fffdf8", borderColor: "#e7ded1", borderLeftWidth: 4, borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  cardEditing: { borderLeftColor: "#a89d90" },
  cardRequested: { borderLeftColor: "#c75f35" },
  cardCompleted: { backgroundColor: "#fbfaf6", borderLeftColor: "#4d6a3a" },
  cardCancelled: { borderLeftColor: "#963d34" },
  cardUnknown: { borderLeftColor: "#7c746d" },
  summaryButton: { minHeight: 84, paddingHorizontal: 10, paddingVertical: 9 },
  cardHeader: { alignItems: "flex-start", flexDirection: "row", gap: 6, justifyContent: "space-between" },
  materialIdentity: { flex: 1, minWidth: 0 },
  materialName: { color: "#17263d", flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 14, lineHeight: 20, minWidth: 0, width: "100%" },
  unitInline: { flexShrink: 0, minHeight: 0 },
  unitChip: { backgroundColor: "#f2eadf", borderRadius: 999, color: "#6b5b4d", flexShrink: 0, fontFamily: WAFL_FONTS.bold, fontSize: 9, lineHeight: 13, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  colorRow: { alignItems: "center", flexDirection: "row", gap: 5, minWidth: 0 },
  swatch: { borderColor: "#aa9d90", borderRadius: 4, borderWidth: 1, flexShrink: 0, height: 18, width: 18 },
  headerAside: { alignItems: "flex-end", flexShrink: 0, gap: 4 },
  headerBadgeCluster: { alignItems: "center", flexDirection: "row", flexShrink: 0, flexWrap: "nowrap", gap: 6 },
  expandButton: { alignItems: "center", height: 34, justifyContent: "center", width: 34 },
  statusBadge: { borderRadius: 999, flexShrink: 0, fontFamily: WAFL_FONTS.bold, fontSize: 10, lineHeight: 14, minWidth: 64, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, textAlign: "center" },
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
  memoColumn: { flex: 1, minWidth: 0, position: "relative" },
  memoMeasure: { left: 0, opacity: 0, position: "absolute", right: 0, top: 0 },
  memoDisclosure: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 3, minHeight: 28, paddingHorizontal: 2 },
  memoDisclosureText: { color: "#7b4b32", fontFamily: WAFL_FONTS.bold, fontSize: 10, lineHeight: 15 },
  materialOrderActionRow: { alignItems: "center", borderTopColor: "#eee3d5", borderTopWidth: 1, flexDirection: "row", gap: 6, justifyContent: "space-between", marginHorizontal: 10, minHeight: 38, paddingVertical: 4 },
  materialOrderActionSummary: { color: "#7b4b32", flex: 1, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 11, fontVariant: ["tabular-nums"], lineHeight: 16, minWidth: 0 },
  materialOrderLineStack: { flex: 1, justifyContent: "center", minWidth: 0 },
  materialOrderLineText: { color: "#7b4b32", flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 11, fontVariant: ["tabular-nums"], lineHeight: 15, minWidth: 0 },
  orderInlineRow: { alignItems: "baseline", flexDirection: "row", flexWrap: "wrap", gap: 3, minWidth: 0 },
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
});
