import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Plus, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WorkOrderCharacterFilter, WorkOrderLineageFilter, WorkOrderListItem, WorkOrderListStatusFilter } from "@/domain/mobileContract";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflChoiceButtons from "@/features/inputs/WaflChoiceButtons";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import {
  WORK_ORDER_SEARCH_DEBOUNCE_MS,
  WORK_ORDER_SEARCH_LAYOUT,
  resolveWorkOrderServerSearchQuery,
} from "./immediateSearchPolicy";
import {
  isHangulInitialQuery,
  matchesWorkOrderSearch,
  normalizeSearchText,
} from "./workOrderSearchPolicy";
import {
  getWorkOrderWorkflowPresentation,
  matchesWorkOrderStatusFilter,
  WORK_ORDER_STATUS_FILTER_OPTIONS,
  WORK_ORDER_STATUS_LABEL,
  type WorkOrderWorkflowBadgeVariant,
} from "./workOrderListStatusPolicy";

type Props = {
  readonly items: readonly WorkOrderListItem[];
  readonly hasMore: boolean;
  readonly selectedId: string | null;
  readonly loading?: boolean;
  readonly loadingMore?: boolean;
  readonly searching?: boolean;
  readonly query: string;
  readonly statusFilter: WorkOrderListStatusFilter;
  readonly characterFilter: WorkOrderCharacterFilter;
  readonly lineageFilters: readonly WorkOrderLineageFilter[];
  readonly onCreate: () => void;
  readonly onRefresh: () => void;
  readonly onLoadMore: () => void;
  readonly onSearch: (query: string) => void;
  readonly onStatusFilter: (status: WorkOrderListStatusFilter) => void;
  readonly onIdentityFilters: (character: WorkOrderCharacterFilter, lineage: readonly WorkOrderLineageFilter[]) => void;
  readonly onSelect: (item: WorkOrderListItem) => void;
};

export default function WorkOrderListScreen({
  items, hasMore, selectedId, loading = false, loadingMore = false, searching = false, query, statusFilter, characterFilter, lineageFilters,
  onCreate, onRefresh, onLoadMore, onSearch, onStatusFilter, onIdentityFilters, onSelect,
}: Props) {
  const [searchDraft, setSearchDraft] = useState(query);
  const [filterVisible, setFilterVisible] = useState(false);
  const [stagedCharacterFilter, setStagedCharacterFilter] = useState<WorkOrderCharacterFilter>(characterFilter);
  const [stagedLineageFilters, setStagedLineageFilters] = useState<readonly WorkOrderLineageFilter[]>(lineageFilters);
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  useEffect(() => {
    const nextServerQuery = resolveWorkOrderServerSearchQuery(query, searchDraft);
    if (nextServerQuery === null) return undefined;
    const timer = setTimeout(() => onSearchRef.current(nextServerQuery), WORK_ORDER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, searchDraft]);
  const hasSearchQuery = normalizeSearchText(searchDraft).length > 0;
  const usesLocalInitialSearch = isHangulInitialQuery(searchDraft);
  const statusItems = items.filter((item) => matchesWorkOrderStatusFilter(item.status, statusFilter));
  const visibleItems = usesLocalInitialSearch
    ? statusItems.filter((item) => matchesWorkOrderSearch(item, searchDraft))
    : statusItems;
  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>작업지시서</Text>
          <Text style={styles.count}>현재 표시 작업지시서 {visibleItems.length}개{hasMore ? " · 다음 페이지 있음" : ""}</Text>
        </View>
        <View style={styles.headingActions}>
          <Pressable accessibilityLabel="새 작업지시서 만들기" accessibilityRole="button" disabled={loading || searching} onPress={onCreate} style={({ pressed }) => [styles.createButton, (loading || searching) && styles.disabled, pressed && styles.pressed]}>
            <Plus color="#fff" size={18} /><Text style={styles.createText}>새로 만들기</Text>
          </Pressable>
          <Pressable accessibilityLabel="작업지시서 목록 새로고침" accessibilityRole="button" disabled={loading} onPress={onRefresh} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            {loading ? <ActivityIndicator color="#5b4c3d" /> : <RefreshCw color="#5b4c3d" size={20} />}
          </Pressable>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Search color="#75695d" size={17} />
          <TextInput
            accessibilityLabel="작업지시서 검색"
            autoCapitalize="none"
            multiline={false}
            numberOfLines={1}
            onChangeText={setSearchDraft}
            placeholder="제품명·작업지시서 번호·품목·시즌 검색"
            returnKeyType="done"
            style={styles.searchInput}
            textAlignVertical="center"
            value={searchDraft}
          />
          <View style={styles.searchAccessory}>
            {searching ? <ActivityIndicator color="#75695d" size="small" /> : searchDraft ? (
              <Pressable accessibilityLabel="검색어 지우기" accessibilityRole="button" hitSlop={8} onPress={() => setSearchDraft("")} style={styles.clearButton}>
                <X color="#75695d" size={17} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <Pressable accessibilityLabel="작업지시서 구분 필터" accessibilityRole="button" onPress={() => { setStagedCharacterFilter(characterFilter); setStagedLineageFilters(lineageFilters); setFilterVisible(true); }} style={styles.filterAction}>
          <SlidersHorizontal color={WAFL_THEME.color.navyInk} size={18} />
          <Text style={styles.filterActionText}>필터</Text>
        </Pressable>
      </View>
      {characterFilter === "all" && lineageFilters.length === 0 ? null : <View style={styles.activeFilterChips}>
        {characterFilter === "all" ? null : <Pressable accessibilityLabel={`${characterFilter === "production" ? "본생산" : "샘플"} 필터 해제`} accessibilityRole="button" onPress={() => onIdentityFilters("all", lineageFilters)} style={styles.activeFilterChip}>
          <Text style={styles.activeFilterText}>{characterFilter === "production" ? "본생산" : "샘플"}</Text><X color="#67584c" size={14} />
        </Pressable>}
        {lineageFilters.map((lineage) => <Pressable accessibilityLabel={`${lineage === "reorder" ? "리오더" : "재작업"} 필터 해제`} accessibilityRole="button" key={lineage} onPress={() => onIdentityFilters(characterFilter, lineageFilters.filter((value) => value !== lineage))} style={styles.activeFilterChip}>
          <Text style={styles.activeFilterText}>{lineage === "reorder" ? "리오더" : "재작업"}</Text><X color="#67584c" size={14} />
        </Pressable>)}
      </View>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterRail}>
        {WORK_ORDER_STATUS_FILTER_OPTIONS.map((filter) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: statusFilter === filter.id }}
            disabled={loading}
            key={filter.id}
            onPress={() => {
              Keyboard.dismiss();
              onStatusFilter(filter.id);
            }}
            style={[styles.filter, statusFilter === filter.id && styles.filterSelected]}
          >
            <Text style={[styles.filterText, statusFilter === filter.id && styles.filterTextSelected]}>{filter.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {visibleItems.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{hasSearchQuery ? "검색 결과가 없습니다." : "작업지시서 목록이 비어 있습니다."}</Text>
          <Text style={styles.emptyBody}>
            {hasSearchQuery ? "다른 검색어를 입력하거나 검색어를 지워 주세요." : "현재 회사에서 조회할 수 있는 작업지시서가 없습니다."}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" onScrollBeginDrag={Keyboard.dismiss} showsVerticalScrollIndicator={false}>
          {visibleItems.map((item) => {
            const selected = selectedId === item.workOrderId;
            const workflowStatus = getWorkOrderWorkflowPresentation(item.status);
            const representativeLabel = item.representativeThumbnail ? "이미지 있음" : "이미지 없음";
            const identityLabels = [item.identity.isSample ? "샘플" : null, item.identity.reorderRound > 0 ? `${item.identity.reorderRound}차 리오더` : null, item.identity.derivationKind === "rework" ? "재작업" : null].filter((label): label is string => label !== null);
            const representativeUrl = resolveMobileApiUrl(item.representativeThumbnail?.thumbnailUrl ?? null);
            return (
              <Pressable
                accessibilityLabel={`${item.productName}${identityLabels.length ? `, ${identityLabels.join(", ")}` : ""}, ${WORK_ORDER_STATUS_LABEL[item.status]}, 수량 ${item.totalQuantity}`}
                accessibilityRole="button"
                key={item.workOrderId}
                onPress={() => {
                  Keyboard.dismiss();
                  onSelect(item);
                }}
                style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
              >
                <View style={styles.cardTop}>
                  <View accessibilityLabel={representativeLabel} style={styles.imagePlaceholder}>
                    {representativeUrl ? (
                      <Image
                        alt={item.representativeThumbnail?.altText ?? item.productName}
                        accessibilityLabel={item.representativeThumbnail?.altText}
                        resizeMode="cover"
                        source={{ uri: representativeUrl }}
                        style={styles.representativeImage}
                      />
                    ) : <Text style={styles.imageMark}>이미지 없음</Text>}
                  </View>
                  <View style={styles.cardMain}>
                    <Text numberOfLines={2} style={styles.productName}>{item.productName}</Text>
                    {identityLabels.length ? <View style={styles.identityBadges}>{identityLabels.map((label) => <Text key={label} style={styles.identityBadge}>{label}</Text>)}</View> : null}
                  </View>
                  <Text style={[styles.status, STATUS_BADGE_STYLES[workflowStatus.variant]]}>{workflowStatus.label}</Text>
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
      <WaflInputSheet cancelAccessibilityLabel="작업지시서 구분 필터 취소" confirmAccessibilityLabel="작업지시서 구분 필터 적용" onCancel={() => setFilterVisible(false)} onConfirm={() => { setFilterVisible(false); onIdentityFilters(stagedCharacterFilter, stagedLineageFilters); }} sizing="adaptiveExpandable" title="필터" visible={filterVisible}>
        <View style={styles.filterSheetBody}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>작업 구분</Text>
            <WaflChoiceButtons accessibilityLabel="작업 구분" onSelect={setStagedCharacterFilter} options={[{ value: "all", label: "전체" }, { value: "production", label: "본생산" }, { value: "sample", label: "샘플" }] as const} selectedValue={stagedCharacterFilter} />
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>작업 계보</Text>
            <WaflChoiceButtons accessibilityLabel="작업 계보" onToggle={(value) => setStagedLineageFilters((current) => current.includes(value) ? current.filter((item) => item !== value) : ["reorder", "rework"].filter((item): item is WorkOrderLineageFilter => item === value || current.includes(item as WorkOrderLineageFilter)))} options={[{ value: "reorder", label: "리오더" }, { value: "rework", label: "재작업" }] as const} selectedValues={stagedLineageFilters} selectionMode="multiple" />
          </View>
        </View>
      </WaflInputSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  headingRow: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 12 },
  headingText: { flex: 1, minWidth: 0 },
  headingActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  title: { color: "#17263d", fontFamily: WAFL_FONTS.black, fontSize: 22 },
  count: { color: "#75695d", fontFamily: WAFL_FONTS.regular, fontSize: 12, marginTop: 3 },
  iconButton: { alignItems: "center", backgroundColor: "#fffaf2", borderColor: "#ddd0bf", borderRadius: 12, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  createButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: 12, flexDirection: "row", gap: 5, height: 44, justifyContent: "center", paddingHorizontal: 11 },
  createText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  searchRow: { alignItems: "center", flexDirection: "row", flexShrink: 0, gap: 7, height: WORK_ORDER_SEARCH_LAYOUT.rowHeight, marginBottom: 8, maxHeight: WORK_ORDER_SEARCH_LAYOUT.rowHeight, minHeight: WORK_ORDER_SEARCH_LAYOUT.rowHeight },
  searchField: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#d9cdbf", borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: "row", gap: 6, height: WORK_ORDER_SEARCH_LAYOUT.fieldHeight, maxHeight: WORK_ORDER_SEARCH_LAYOUT.fieldHeight, minHeight: WORK_ORDER_SEARCH_LAYOUT.fieldHeight, overflow: "hidden", paddingHorizontal: 10 },
  searchInput: { color: "#17263d", flex: 1, fontFamily: WAFL_FONTS.regular, fontSize: 12, height: WORK_ORDER_SEARCH_LAYOUT.inputHeight, includeFontPadding: false, lineHeight: WORK_ORDER_SEARCH_LAYOUT.inputLineHeight, maxHeight: WORK_ORDER_SEARCH_LAYOUT.inputHeight, minHeight: WORK_ORDER_SEARCH_LAYOUT.inputHeight, minWidth: 0, paddingBottom: 0, paddingTop: 0, paddingVertical: 0 },
  searchAccessory: { alignItems: "center", flexShrink: 0, height: WORK_ORDER_SEARCH_LAYOUT.accessorySize, justifyContent: "center", width: WORK_ORDER_SEARCH_LAYOUT.accessorySize },
  filterAction: { alignItems: "center", borderColor: "#d9cdbf", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 4, height: WORK_ORDER_SEARCH_LAYOUT.fieldHeight, justifyContent: "center", paddingHorizontal: 10 },
  filterActionText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.semibold, fontSize: 12 },
  activeFilterChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  activeFilterChip: { alignItems: "center", backgroundColor: "#f4eee5", borderColor: "#ddd0bf", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 32, paddingHorizontal: 10 },
  activeFilterText: { color: "#67584c", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  filterSheetBody: { gap: WAFL_THEME.spacing.md, paddingTop: WAFL_THEME.spacing.md },
  filterGroup: { gap: WAFL_THEME.layout.tightGap },
  filterGroupLabel: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.fieldLabel.fontSize, lineHeight: WAFL_THEME.typography.fieldLabel.lineHeight },
  clearButton: { alignItems: "center", height: WORK_ORDER_SEARCH_LAYOUT.accessorySize, justifyContent: "center", width: WORK_ORDER_SEARCH_LAYOUT.accessorySize },
  filterRail: { flexGrow: 0, flexShrink: 0, height: WORK_ORDER_SEARCH_LAYOUT.filterRailHeight, maxHeight: WORK_ORDER_SEARCH_LAYOUT.filterRailHeight, minHeight: WORK_ORDER_SEARCH_LAYOUT.filterRailHeight },
  filters: { alignItems: "flex-start", gap: 6, height: WORK_ORDER_SEARCH_LAYOUT.filterRailHeight, paddingBottom: 10 },
  filter: { backgroundColor: "#f4eee5", borderColor: "#ddd0bf", borderRadius: 999, borderWidth: 1, justifyContent: "center", minHeight: 34, paddingHorizontal: 11 },
  filterSelected: { backgroundColor: "#23375a", borderColor: "#23375a" },
  filterText: { color: "#67584c", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  filterTextSelected: { color: "#fff" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  list: { gap: 10, paddingBottom: 30 },
  card: { backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 15, borderWidth: 1, gap: 9, padding: 14 },
  cardSelected: { borderColor: "#9b4a27", borderWidth: 2, padding: 13 },
  cardTop: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  imagePlaceholder: { alignItems: "center", backgroundColor: "#eee7dc", borderRadius: 10, height: 48, justifyContent: "center", width: 48 },
  representativeImage: { borderRadius: 10, height: 48, width: 48 },
  imageMark: { color: "#75695d", fontFamily: WAFL_FONTS.medium, fontSize: 9, textAlign: "center" },
  cardMain: { flex: 1, minWidth: 0 },
  productName: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16, lineHeight: 21 },
  identityBadges: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 5 },
  identityBadge: { backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: 999, color: "#67584c", fontFamily: WAFL_FONTS.semibold, fontSize: 10, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  status: { backgroundColor: "#f2e2d3", borderRadius: 999, color: "#874423", fontFamily: WAFL_FONTS.bold, fontSize: 11, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5 },
  statusDraft: { backgroundColor: "#f2e2d3", color: "#874423" },
  statusDelivery: { backgroundColor: "#e7e0d3", color: "#67584c" },
  statusProgress: { backgroundColor: "#dce5f0", color: "#23375a" },
  statusCompleted: { backgroundColor: "#e4e8d4", color: "#536035" },
  statusHold: { backgroundColor: "#ece8e2", color: "#75695d" },
  primaryMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricStrong: { color: "#3e3730", fontFamily: WAFL_FONTS.semibold, fontSize: 13 },
  empty: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 15, borderWidth: 1, gap: 6, padding: 30 },
  emptyTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16 },
  emptyBody: { color: "#75695d", fontFamily: WAFL_FONTS.regular, fontSize: 13, textAlign: "center" },
  moreButton: { alignItems: "center", borderColor: "#cdbdad", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44 },
  moreText: { color: "#5b4c3d", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
});

const STATUS_BADGE_STYLES: Readonly<Record<WorkOrderWorkflowBadgeVariant, object>> = {
  draft: styles.statusDraft,
  delivery: styles.statusDelivery,
  progress: styles.statusProgress,
  completed: styles.statusCompleted,
  hold: styles.statusHold,
};
