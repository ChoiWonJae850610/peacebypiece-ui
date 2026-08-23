import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, History, Repeat2 } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WorkOrderSeriesHistory } from "@/domain/mobileContract";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";

export function WaflWorkActionRow(props: {
  readonly kind: "reorder" | "history";
  readonly label: string;
  readonly onPress: () => void;
}) {
  const Icon = props.kind === "reorder" ? Repeat2 : History;
  return <Pressable accessibilityLabel={props.label} accessibilityRole="button" onPress={props.onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]} testID={`work-action-${props.kind}`}>
    <Icon color={WAFL_THEME.color.brickOrange} size={WAFL_THEME.icon.small} />
    <Text style={styles.actionLabel}>{props.label}</Text>
    <View style={styles.spacer} />
    <ChevronRight color={WAFL_THEME.color.readOnly} size={WAFL_THEME.icon.small} />
  </Pressable>;
}

export function WorkOrderReorderCreateSheet(props: {
  readonly visible: boolean;
  readonly sourceLabel: string;
  readonly expectedRound: number;
  readonly requestError: string | null;
  readonly pending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => Promise<void>;
}) {
  return <WaflInputSheet
    cancelAccessibilityLabel="리오더 만들기 취소"
    cancelActionLabel="아니오"
    confirmAccessibilityLabel="리오더 만들기"
    confirmActionLabel="예"
    onCancel={props.onCancel}
    onConfirm={props.onConfirm}
    pending={props.pending}
    sizing="adaptiveExpandable"
    title="리오더 만들기"
    visible={props.visible}
  >
    <View style={styles.form}>
      <Text style={styles.sourceBasis}>기준 작업 · {props.sourceLabel}</Text>
      <Text style={styles.confirmation}>{props.expectedRound}차 리오더 작업지시서를 작성하시겠습니까?</Text>
      {props.requestError ? <Text accessibilityRole="alert" style={styles.error}>{props.requestError}</Text> : null}
    </View>
  </WaflInputSheet>;
}

export function WorkOrderSeriesHistorySheet(props: {
  readonly visible: boolean;
  readonly history: WorkOrderSeriesHistory | null;
  readonly onClose: () => void;
  readonly onSelect: (workOrderId: string) => void;
}) {
  return <WaflInputSheet onCancel={props.onClose} sizing="adaptiveExpandable" title="작업 이력" visible={props.visible}>
    <View style={styles.historyList} testID="work-order-series-history">
      {props.history?.items.map((item) => <Pressable accessibilityLabel={`${item.reorderRound === 0 ? "본생산" : `${item.reorderRound}차 리오더`}${item.current ? ", 현재" : ""}`} accessibilityRole="button" disabled={item.current} key={item.workOrderId} onPress={() => props.onSelect(item.workOrderId)} style={({ pressed }) => [styles.historyRow, item.current && styles.currentRow, pressed && styles.pressed]}>
        <View style={styles.historyText}>
          <Text style={styles.historyTitle}>{item.reorderRound === 0 ? "본생산" : `${item.reorderRound}차 리오더`}</Text>
          <Text numberOfLines={1} style={styles.historyMeta}>{item.productName} · {item.totalQuantity.toLocaleString("ko-KR")}벌</Text>
        </View>
        {item.current ? <Text style={styles.current}>현재</Text> : <ChevronRight color={WAFL_THEME.color.readOnly} size={WAFL_THEME.icon.small} />}
      </Pressable>)}
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  actionRow: { alignItems: "center", backgroundColor: WAFL_THEME.color.fabricBeige, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardCompact, borderWidth: WAFL_THEME.border.hairline, flexDirection: "row", gap: WAFL_THEME.layout.controlGap, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal },
  actionLabel: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
  spacer: { flex: 1 },
  pressed: { opacity: 0.68 },
  form: { gap: WAFL_THEME.layout.sectionGap, paddingTop: WAFL_THEME.spacing.sm },
  sourceBasis: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight },
  confirmation: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
  error: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize },
  historyList: { gap: WAFL_THEME.layout.tightGap, paddingTop: WAFL_THEME.spacing.sm },
  historyRow: { alignItems: "center", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, flexDirection: "row", gap: WAFL_THEME.layout.controlGap, minHeight: WAFL_THEME.touch.minimum, paddingVertical: WAFL_THEME.spacing.sm },
  currentRow: { backgroundColor: WAFL_THEME.color.paperMuted },
  historyText: { flex: 1, minWidth: 0 },
  historyTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  historyMeta: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, marginTop: 2 },
  current: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.meta.fontSize },
});
