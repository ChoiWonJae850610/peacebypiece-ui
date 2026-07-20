import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Check, ChevronDown, ChevronUp, FileUp, PencilLine, Plus, RefreshCw, RotateCcw, Trash2, type LucideIcon } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import type { WorkOrderMaterialLine } from "@/lib/apiTypes";

export type MaterialReadStatus = "not-loaded" | "loading" | "loaded" | "empty" | "error" | "retrying" | "loading-more";

export type MaterialReadViewState = {
  readonly status: MaterialReadStatus;
  readonly items: readonly WorkOrderMaterialLine[];
  readonly hasMore: boolean;
  readonly errorMessage: string | null;
};

type Props = {
  readonly state: MaterialReadViewState;
  readonly canEdit: boolean;
  readonly saveNotice: string | null;
  readonly onAdd: () => void;
  readonly onEdit: (line: WorkOrderMaterialLine) => void;
  readonly onRetry: () => void;
  readonly onLoadMore: () => void;
};

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

function formatDecimal(value: string | null, maximumFractionDigits: 0 | 2) {
  const matched = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value?.trim() ?? "");
  if (!matched) return null;
  const [, sign, rawInteger, rawFraction = ""] = matched;
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || "0";
  const scale = maximumFractionDigits === 0 ? 1n : 100n;
  const keptFraction = maximumFractionDigits === 0 ? "" : `${rawFraction}00`.slice(0, 2);
  let scaled = BigInt(integer) * scale + BigInt(keptFraction || "0");
  const roundingDigit = rawFraction[maximumFractionDigits];
  if (roundingDigit && roundingDigit >= "5") scaled += 1n;
  const roundedInteger = (scaled / scale).toString();
  const roundedFraction = maximumFractionDigits === 0
    ? ""
    : (scaled % scale).toString().padStart(2, "0").replace(/0+$/, "");
  const grouped = roundedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const normalizedSign = sign === "-" && scaled !== 0n ? "-" : "";
  return `${normalizedSign}${grouped}${roundedFraction ? `.${roundedFraction}` : ""}`;
}

function quantity(value: string | null, unit: string) {
  const formatted = formatDecimal(value, 2);
  if (formatted === null) return "미입력";
  return `${formatted}${unit.trim() ? ` ${unit.trim()}` : ""}`;
}

function won(value: string | null) {
  const formatted = formatDecimal(value, 0);
  return formatted === null ? "미입력" : `${formatted}원`;
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

function ReadOnlyLine({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.readOnlyLine}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
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

function MaterialCard({ line, expanded, canEdit, onEdit, onToggle }: {
  readonly line: WorkOrderMaterialLine;
  readonly expanded: boolean;
  readonly canEdit: boolean;
  readonly onEdit: () => void;
  readonly onToggle: () => void;
}) {
  const { width } = useWindowDimensions();
  const compactActions = width < 760;
  const actions = materialActions(line.status);
  const swatch = exactHexColor(line.colorOption);
  const colorLabel = line.colorOption?.trim() || "미입력";
  const usageArea = line.usageArea?.trim() || "미입력";
  const memo = line.memo?.trim() || "없음";
  return (
    <View style={[styles.card, materialAccent(line.status)]}>
      <Pressable
        accessibilityLabel={`${line.name}, 원단 상세 ${expanded ? "접기" : "펼치기"}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.summaryButton, pressed && styles.pressed]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.materialIdentity}>
            <View style={styles.materialTitleRow}>
              <Text numberOfLines={2} style={styles.materialName}>{line.name || "원단명 미입력"}</Text>
              <Text style={styles.unitChip}>{line.unitCode || "단위 미입력"}</Text>
            </View>
          </View>
          <View style={styles.headerAside}>
            <Text style={[styles.statusBadge, materialBadge(line.status)]}>{STATUS_LABELS[line.status]}</Text>
            {expanded ? <ChevronUp color="#6b5b4d" size={18} /> : <ChevronDown color="#6b5b4d" size={18} />}
          </View>
        </View>

        <View testID="material-core-row" style={styles.coreRow}>
          <CompactField label="거래처" value="—" />
          <View style={styles.compactField}>
            <Text style={styles.compactLabel}>색상·옵션</Text>
            <View style={styles.colorRow}>
              {swatch ? <View accessibilityLabel={`색상 ${colorLabel}`} style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
              <Text numberOfLines={1} style={styles.compactValue}>{colorLabel}</Text>
            </View>
          </View>
          <CompactField label="단가" value={won(line.unitPrice)} />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expandedPanel}>
          <View style={styles.coreRow}>
            <CompactField label="필요수량" value={quantity(line.requiredQuantity, line.unitCode)} />
            <CompactField label="로스·여유" value={quantity(line.allowanceQuantity, line.unitCode)} />
            <CompactField label="재고사용" value={quantity(line.inventoryUsageQuantity, line.unitCode)} />
          </View>
          <View style={styles.readOnlyRows}>
            <ReadOnlyLine label="사용부위" value={usageArea} />
            <ReadOnlyLine label="메모" value={memo} />
          </View>
        </View>
      ) : null}

      <View testID="material-order-action-row" style={styles.materialOrderActionRow}>
        {compactActions ? (
          <View testID="material-order-summary-lines" style={styles.materialOrderLineStack}>
            <Text testID="material-order-summary-primary" numberOfLines={1} style={styles.materialOrderLineText}>
              발주수량 {quantity(line.orderQuantity, line.unitCode)} · 단가 {won(line.unitPrice)}
            </Text>
            <Text testID="material-order-summary-amount" numberOfLines={1} style={styles.materialOrderLineText}>
              금액 {won(line.amount)}
            </Text>
          </View>
        ) : (
          <Text testID="material-order-summary" numberOfLines={1} style={styles.materialOrderActionSummary}>
            발주수량 {quantity(line.orderQuantity, line.unitCode)} · 단가 {won(line.unitPrice)} · 금액 {won(line.amount)}
          </Text>
        )}
        {actions.length ? (
          <View testID="material-order-actions" style={styles.materialOrderActions}>
            {canEdit && line.status === "editing" ? (
              <Pressable accessibilityLabel={`${line.name} 수정`} accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.editActionButton, pressed && styles.pressed]}>
                <PencilLine color="#ffffff" size={17} strokeWidth={2.25} />
                {!compactActions ? <Text style={styles.editActionCaption}>수정</Text> : null}
              </Pressable>
            ) : null}
            {actions.map((action) => <ReadOnlyActionButton action={action} compact={compactActions} key={action.caption} />)}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function AddMaterialButton({ onPress }: { readonly onPress: () => void }) {
  return (
    <Pressable accessibilityLabel="새 원단 추가" accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
      <Plus color="#ffffff" size={16} strokeWidth={2.4} />
      <Text style={styles.addButtonText}>원단 추가</Text>
    </Pressable>
  );
}

export default function WorkOrderMaterialsReadOnly({ state, canEdit, saveNotice, onAdd, onEdit, onRetry, onLoadMore }: Props) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const waiting = state.status === "loading" || state.status === "retrying";

  if (waiting && state.items.length === 0) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.centerState}>
        <ActivityIndicator color="#9b4a27" />
        <Text style={styles.stateTitle}>{state.status === "retrying" ? "원단 정보를 다시 불러오는 중" : "원단 정보를 불러오는 중"}</Text>
      </View>
    );
  }

  if (state.status === "empty") {
    return <View style={styles.centerState}><Text style={styles.stateTitle}>등록된 원단이 없습니다</Text><Text style={styles.stateCaption}>이 제작 카드에 연결된 원단 내역이 없습니다.</Text>{canEdit ? <AddMaterialButton onPress={onAdd} /> : null}</View>;
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
      {state.items.map((line) => (
        <MaterialCard
          canEdit={canEdit}
          key={line.id}
          expanded={expandedIds.has(line.id)}
          line={line}
          onEdit={() => onEdit(line)}
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
  addButton: { alignItems: "center", backgroundColor: "#17263d", borderRadius: 8, flexDirection: "row", gap: 5, justifyContent: "center", minHeight: 40, paddingHorizontal: 12 },
  addButtonText: { color: "#ffffff", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
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
  unitChip: { backgroundColor: "#f2eadf", borderRadius: 999, color: "#6b5b4d", flexShrink: 0, fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  colorRow: { alignItems: "center", flexDirection: "row", gap: 5, minWidth: 0 },
  swatch: { borderColor: "#aa9d90", borderRadius: 4, borderWidth: 1, flexShrink: 0, height: 18, width: 18 },
  headerAside: { alignItems: "flex-end", gap: 8 },
  statusBadge: { borderRadius: 999, fontFamily: WAFL_FONTS.bold, fontSize: 10, minWidth: 64, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, textAlign: "center" },
  statusBadgeEditing: { backgroundColor: "#ece8e0", color: "#534b43" },
  statusBadgeRequested: { backgroundColor: "#ffe1c8", color: "#9b4a27" },
  statusBadgeCompleted: { backgroundColor: "#e4eadc", color: "#3f5731" },
  statusBadgeCancelled: { backgroundColor: "#f5d8d2", color: "#963d34" },
  statusBadgeUnknown: { backgroundColor: "#eee9e2", color: "#675f58" },
  expandedPanel: { borderTopColor: "#eee3d5", borderTopWidth: 1, paddingHorizontal: 10, paddingTop: 7 },
  coreRow: { alignItems: "flex-start", flexDirection: "row", gap: 5, marginTop: 7, width: "100%" },
  compactField: { flex: 1, minWidth: 0 },
  compactLabel: { color: "#8b7e72", fontFamily: WAFL_FONTS.medium, fontSize: 9, lineHeight: 13 },
  compactValue: { color: "#3f352d", flexShrink: 1, fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 16, marginTop: 1, minWidth: 0 },
  readOnlyRows: { marginTop: 4 },
  readOnlyLine: { alignItems: "flex-start", borderTopColor: "#f0e7dc", borderTopWidth: 1, flexDirection: "row", gap: 10, minHeight: 28, paddingVertical: 5 },
  readOnlyLabel: { color: "#827568", flexShrink: 0, fontFamily: WAFL_FONTS.medium, fontSize: 10, lineHeight: 17, width: 54 },
  readOnlyValue: { color: "#3f352d", flex: 1, fontFamily: WAFL_FONTS.regular, fontSize: 11, lineHeight: 17, minWidth: 0 },
  materialOrderActionRow: { alignItems: "center", borderTopColor: "#eee3d5", borderTopWidth: 1, flexDirection: "row", gap: 6, justifyContent: "space-between", marginHorizontal: 10, minHeight: 38, paddingVertical: 4 },
  materialOrderActionSummary: { color: "#7b4b32", flex: 1, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 11, fontVariant: ["tabular-nums"], lineHeight: 16, minWidth: 0 },
  materialOrderLineStack: { flex: 1, justifyContent: "center", minWidth: 0 },
  materialOrderLineText: { color: "#7b4b32", flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: 11, fontVariant: ["tabular-nums"], lineHeight: 15, minWidth: 0 },
  materialOrderActions: { flexDirection: "row", flexShrink: 0, gap: 3, marginLeft: "auto" },
  iconActionButton: { alignItems: "center", backgroundColor: "#fff", borderColor: "#d8d0c3", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 3, height: 30, justifyContent: "center", minWidth: 58, paddingHorizontal: 8 },
  iconActionButtonCompact: { borderRadius: 7, minWidth: 36, paddingHorizontal: 4, width: 36 },
  iconActionEmphasized: { backgroundColor: "#23375a", borderColor: "#23375a" },
  iconActionDanger: { backgroundColor: "#fff5f0", borderColor: "#e5b7ac" },
  disabledAction: { opacity: 0.46 },
  editActionButton: { alignItems: "center", backgroundColor: "#17263d", borderColor: "#17263d", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 3, height: 30, justifyContent: "center", minWidth: 36, paddingHorizontal: 7 },
  editActionCaption: { color: "#ffffff", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  iconActionCaption: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  iconActionCaptionEmphasized: { color: "#fff" },
  iconActionCaptionDanger: { color: "#9a4035" },
  inlineError: { alignItems: "center", backgroundColor: "#fff8f4", borderRadius: 10, gap: 8, padding: 12 },
  inlineErrorText: { color: "#992f2b", fontFamily: WAFL_FONTS.medium, fontSize: 12, textAlign: "center" },
  inlineRetry: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14 },
  inlineRetryText: { color: "#8b4526", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  moreButton: { alignItems: "center", borderColor: "#cdbdad", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44 },
  moreText: { color: "#6b4a36", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
});
