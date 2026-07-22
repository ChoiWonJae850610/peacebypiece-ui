import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RefreshCw, Search } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import type { WorkOrderListItem, WorkOrderListStatusFilter } from "@/lib/apiTypes";

const STATUS_LABEL: Record<WorkOrderListItem["status"], string> = {
  draft: "작성중",
  ready_to_issue: "발행 준비",
  issued: "발행됨",
  revised: "정정 작성중",
  completed: "완료",
  cancelled: "취소",
};

type Props = {
  readonly items: readonly WorkOrderListItem[];
  readonly hasMore: boolean;
  readonly selectedId: string | null;
  readonly loading?: boolean;
  readonly loadingMore?: boolean;
  readonly query: string;
  readonly statusFilter: WorkOrderListStatusFilter;
  readonly onRefresh: () => void;
  readonly onLoadMore: () => void;
  readonly onSearch: (query: string) => void;
  readonly onStatusFilter: (status: WorkOrderListStatusFilter) => void;
  readonly onSelect: (item: WorkOrderListItem) => void;
};

const STATUS_FILTERS: readonly { readonly id: WorkOrderListStatusFilter; readonly label: string }[] = [
  { id: "all", label: "전체" },
  { id: "draft", label: "작성 중" },
  { id: "delivery", label: "전달·발행" },
  { id: "progress", label: "진행 중" },
  { id: "completed", label: "완료" },
  { id: "hold_cancel", label: "보류·취소" },
];

export default function WorkOrderListScreen({
  items, hasMore, selectedId, loading = false, loadingMore = false, query, statusFilter,
  onRefresh, onLoadMore, onSearch, onStatusFilter, onSelect,
}: Props) {
  const [searchDraft, setSearchDraft] = useState(query);
  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>작업지시서</Text>
          <Text style={styles.count}>현재 불러온 작업지시서 {items.length}개{hasMore ? " · 다음 페이지 있음" : ""}</Text>
        </View>
        <Pressable accessibilityLabel="작업지시서 목록 새로고침" accessibilityRole="button" disabled={loading} onPress={onRefresh} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          {loading ? <ActivityIndicator color="#5b4c3d" /> : <RefreshCw color="#5b4c3d" size={20} />}
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Search color="#75695d" size={17} />
          <TextInput
            accessibilityLabel="작업지시서 검색"
            autoCapitalize="none"
            onChangeText={setSearchDraft}
            onSubmitEditing={() => onSearch(searchDraft)}
            placeholder="제품명·작업지시서 번호·품목·시즌 검색"
            returnKeyType="search"
            style={styles.searchInput}
            value={searchDraft}
          />
        </View>
        <Pressable accessibilityLabel="작업지시서 검색 실행" accessibilityRole="button" disabled={loading} onPress={() => onSearch(searchDraft)} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
          <Search color="#fff" size={18} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((filter) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: statusFilter === filter.id }}
            disabled={loading}
            key={filter.id}
            onPress={() => onStatusFilter(filter.id)}
            style={[styles.filter, statusFilter === filter.id && styles.filterSelected]}
          >
            <Text style={[styles.filterText, statusFilter === filter.id && styles.filterTextSelected]}>{filter.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>작업지시서 목록이 비어 있습니다.</Text>
          <Text style={styles.emptyBody}>현재 회사에서 조회할 수 있는 작업지시서가 없습니다.</Text>
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
                  </View>
                  <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
                </View>
                <View style={styles.primaryMetrics}>
                  <Text style={styles.metricStrong}>수량 {item.totalQuantity.toLocaleString("ko-KR")}벌</Text>
                  <Text style={styles.metricStrong}>납기 {item.dueDate ?? "미정"}</Text>
                </View>
              </Pressable>
            );
          })}
          {hasMore ? (
            <Pressable accessibilityLabel="작업지시서 더 보기" accessibilityRole="button" disabled={loadingMore} onPress={onLoadMore} style={styles.moreButton}>
              {loadingMore ? <ActivityIndicator color="#5b4c3d" size="small" /> : null}
              <Text style={styles.moreText}>{loadingMore ? "불러오는 중" : "더 보기"}</Text>
            </Pressable>
          ) : null}
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
  searchRow: { alignItems: "center", flexDirection: "row", gap: 7, marginBottom: 8 },
  searchField: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#d9cdbf", borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: "row", gap: 6, minHeight: 42, paddingHorizontal: 10 },
  searchInput: { color: "#17263d", flex: 1, fontFamily: WAFL_FONTS.regular, fontSize: 12, minWidth: 0, paddingVertical: 8 },
  searchButton: { alignItems: "center", backgroundColor: "#23375a", borderRadius: 10, height: 42, justifyContent: "center", width: 42 },
  filters: { gap: 6, paddingBottom: 10 },
  filter: { backgroundColor: "#f4eee5", borderColor: "#ddd0bf", borderRadius: 999, borderWidth: 1, justifyContent: "center", minHeight: 34, paddingHorizontal: 11 },
  filterSelected: { backgroundColor: "#23375a", borderColor: "#23375a" },
  filterText: { color: "#67584c", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  filterTextSelected: { color: "#fff" },
  pressed: { opacity: 0.72 },
  list: { gap: 10, paddingBottom: 30 },
  card: { backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 15, borderWidth: 1, gap: 9, padding: 14 },
  cardSelected: { borderColor: "#9b4a27", borderWidth: 2, padding: 13 },
  cardTop: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  imagePlaceholder: { alignItems: "center", backgroundColor: "#eee7dc", borderRadius: 10, height: 48, justifyContent: "center", width: 48 },
  imageMark: { color: "#75695d", fontFamily: WAFL_FONTS.medium, fontSize: 9, textAlign: "center" },
  cardMain: { flex: 1, minWidth: 0 },
  productName: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16, lineHeight: 21 },
  status: { backgroundColor: "#f2e2d3", borderRadius: 999, color: "#874423", fontFamily: WAFL_FONTS.bold, fontSize: 11, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5 },
  primaryMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricStrong: { color: "#3e3730", fontFamily: WAFL_FONTS.semibold, fontSize: 13 },
  empty: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 15, borderWidth: 1, gap: 6, padding: 30 },
  emptyTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16 },
  emptyBody: { color: "#75695d", fontFamily: WAFL_FONTS.regular, fontSize: 13, textAlign: "center" },
  moreButton: { alignItems: "center", borderColor: "#cdbdad", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44 },
  moreText: { color: "#5b4c3d", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
});
