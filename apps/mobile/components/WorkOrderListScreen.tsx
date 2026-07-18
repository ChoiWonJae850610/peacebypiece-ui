import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import type { WorkOrderListItem } from "@/lib/apiTypes";

const STATUS_LABEL: Record<WorkOrderListItem["status"], string> = {
  draft: "작성중",
  ready_to_issue: "발행 준비",
  issued: "발행됨",
  revised: "정정 작성중",
  completed: "완료",
  cancelled: "취소",
};

function amountLabel(item: WorkOrderListItem) {
  const numeric = Number(item.estimatedAmountSummary.estimatedTotal);
  const amount = Number.isFinite(numeric) ? numeric.toLocaleString("ko-KR") : item.estimatedAmountSummary.estimatedTotal;
  return `${amount} ${item.estimatedAmountSummary.currency}`;
}

function documentStatusLabel(status: string | null) {
  if (!status) return "없음";
  return ({ pending: "생성 대기", generated: "생성 완료", failed: "생성 실패", revoked: "공유 취소", deleted: "삭제됨" } as Record<string, string>)[status] ?? "상태 확인";
}

type Props = {
  readonly items: readonly WorkOrderListItem[];
  readonly hasMore: boolean;
  readonly selectedId: string | null;
  readonly loading?: boolean;
  readonly onRefresh: () => void;
  readonly onSelect: (item: WorkOrderListItem) => void;
};

export default function WorkOrderListScreen({ items, hasMore, selectedId, loading = false, onRefresh, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>제작 카드</Text>
          <Text style={styles.count}>현재 불러온 카드 {items.length}개{hasMore ? " · 다음 페이지 있음" : ""}</Text>
        </View>
        <Pressable accessibilityLabel="제작 카드 목록 새로고침" accessibilityRole="button" disabled={loading} onPress={onRefresh} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          {loading ? <ActivityIndicator color="#5b4c3d" /> : <RefreshCw color="#5b4c3d" size={20} />}
        </Pressable>
      </View>

      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>제작 카드 목록이 비어 있습니다.</Text>
          <Text style={styles.emptyBody}>현재 회사에서 조회할 수 있는 제작 카드가 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.map((item) => {
            const selected = selectedId === item.workOrderId;
            return (
              <Pressable
                accessibilityLabel={`${item.productName}, ${STATUS_LABEL[item.status]}, 수량 ${item.totalQuantity}`}
                accessibilityRole="button"
                key={item.workOrderId}
                onPress={() => onSelect(item)}
                style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.imagePlaceholder}><Text style={styles.imageMark}>{item.representativeThumbnail ? "이미지 있음" : "이미지 없음"}</Text></View>
                  <View style={styles.cardMain}>
                    <Text numberOfLines={2} style={styles.productName}>{item.productName}</Text>
                    {item.displayDocumentNumber ? <Text numberOfLines={1} style={styles.documentNumber}>{item.displayDocumentNumber}</Text> : null}
                  </View>
                  <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
                </View>
                <View style={styles.primaryMetrics}>
                  <Text style={styles.metricStrong}>수량 {item.totalQuantity.toLocaleString("ko-KR")}</Text>
                  <Text style={styles.metricStrong}>납기 {item.dueDate ?? "미정"}</Text>
                </View>
                <Text style={styles.amount}>예상 금액 {amountLabel(item)}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summary}>미완료 원단 {item.incompleteMaterialSummary.incompleteFabricCount}</Text>
                  <Text style={styles.summary}>부자재 {item.incompleteMaterialSummary.incompleteAccessoryCount}</Text>
                  <Text style={styles.summary}>공정 {item.processCount}</Text>
                  <Text style={styles.summary}>문서 {documentStatusLabel(item.latestDocumentStatus)}</Text>
                </View>
                <Text style={styles.updated}>업데이트 {item.updatedAt.replace("T", " ").slice(0, 16)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  headingRow: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 12 },
  headingText: { flex: 1, minWidth: 0 },
  title: { color: "#17263d", fontFamily: WAFL_FONTS.black, fontSize: 22 },
  count: { color: "#75695d", fontFamily: WAFL_FONTS.regular, fontSize: 12, marginTop: 3 },
  iconButton: { alignItems: "center", backgroundColor: "#fffaf2", borderColor: "#ddd0bf", borderRadius: 12, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  pressed: { opacity: 0.72 },
  list: { gap: 10, paddingBottom: 30 },
  card: { backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 15, borderWidth: 1, gap: 9, padding: 14 },
  cardSelected: { borderColor: "#9b4a27", borderWidth: 2, padding: 13 },
  cardTop: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  imagePlaceholder: { alignItems: "center", backgroundColor: "#eee7dc", borderRadius: 10, height: 48, justifyContent: "center", width: 48 },
  imageMark: { color: "#75695d", fontFamily: WAFL_FONTS.medium, fontSize: 9, textAlign: "center" },
  cardMain: { flex: 1, minWidth: 0 },
  productName: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16, lineHeight: 21 },
  documentNumber: { color: "#7a6f64", fontFamily: WAFL_FONTS.regular, fontSize: 10, marginTop: 3 },
  status: { backgroundColor: "#f2e2d3", borderRadius: 999, color: "#874423", fontFamily: WAFL_FONTS.bold, fontSize: 11, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5 },
  primaryMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricStrong: { color: "#3e3730", fontFamily: WAFL_FONTS.semibold, fontSize: 13 },
  amount: { color: "#5c5044", fontFamily: WAFL_FONTS.medium, fontSize: 12 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  summary: { backgroundColor: "#f4efe7", borderRadius: 999, color: "#675c51", fontFamily: WAFL_FONTS.medium, fontSize: 10, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 4 },
  updated: { color: "#92867a", fontFamily: WAFL_FONTS.regular, fontSize: 10 },
  empty: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 15, borderWidth: 1, gap: 6, padding: 30 },
  emptyTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16 },
  emptyBody: { color: "#75695d", fontFamily: WAFL_FONTS.regular, fontSize: 13, textAlign: "center" },
});
