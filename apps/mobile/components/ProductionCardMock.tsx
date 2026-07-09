import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";

import { MOBILE_APP_VERSION } from "@/constants/version";
import {
  PRODUCTION_TABS,
  accessoryRows,
  attachmentRows,
  colorRows,
  costMetrics,
  deliveryRows,
  fabricRows,
  imageMocks,
  outputRows,
  overviewInfo,
  processRows,
  productionCardMock,
  productionCards,
  sizeRows,
  summaryMetrics,
  type MaterialRow as MaterialRowData,
  type MaterialStatus,
  type ProductionCardListItem,
  type ProductionTabId
} from "@/constants/mockProductionCard";

const maxPhoneWidth = 520;
const maxTabletWidth = 1120;

export default function ProductionCardMock() {
  const [activeTab, setActiveTab] = useState<ProductionTabId>("overview");
  const [selectedCardId, setSelectedCardId] = useState(productionCards[0].id);
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 760;
  const isWideTablet = isTablet && width > height;
  const contentWidth = useMemo(
    () => Math.min(Math.max(width - 24, 320), isTablet ? maxTabletWidth : maxPhoneWidth),
    [isTablet, width]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.page, { width: contentWidth }]}>
        <TopBar isTablet={isTablet} />
        <ThemeStrip />
        <View style={[styles.workbench, isWideTablet && styles.workbenchWide]}>
          <ProductionCardList
            selectedCardId={selectedCardId}
            onSelect={setSelectedCardId}
            isTablet={isTablet}
          />
          <View style={styles.detailPane}>
            <ProductionHeader isTablet={isTablet} />
            <TabRail activeTab={activeTab} setActiveTab={setActiveTab} isTablet={isTablet} />
            <View style={styles.section}>{renderActiveTab(activeTab, isTablet)}</View>
          </View>
        </View>
        <BottomNavigation />
      </ScrollView>
    </SafeAreaView>
  );
}

function TopBar({ isTablet }: { isTablet: boolean }) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.brand}>WAFL</Text>
        <Text style={styles.topMeta}>동대문 제작 워크룸 · {MOBILE_APP_VERSION}</Text>
      </View>
      <View style={styles.iconRow}>
        <IconButton label="검색" symbol="⌕" />
        <IconButton label="알림" symbol="!" />
        <IconButton label="더보기" symbol="..." />
      </View>
      {isTablet ? <Text style={styles.deviceHint}>Tablet workbench</Text> : null}
    </View>
  );
}

function ThemeStrip() {
  return (
    <View style={styles.themeStrip}>
      <View style={styles.threadLine} />
      <Text style={styles.themeTitle}>Dongdaemun Atelier Ops</Text>
      <Text style={styles.themeCopy}>원단, 부자재, 공정, 납기를 한 번에 읽는 mock-only 앱 시안입니다.</Text>
    </View>
  );
}

function ProductionCardList({
  selectedCardId,
  onSelect,
  isTablet
}: {
  selectedCardId: string;
  onSelect: (id: string) => void;
  isTablet: boolean;
}) {
  return (
    <View style={[styles.listPane, isTablet && styles.listPaneTablet]}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>제작 카드 목록</Text>
        <Text style={styles.listCount}>{productionCards.length}</Text>
      </View>
      {productionCards.map((card) => (
        <ProductionListCard
          key={card.id}
          card={card}
          selected={selectedCardId === card.id}
          onPress={() => onSelect(card.id)}
        />
      ))}
    </View>
  );
}

function ProductionListCard({
  card,
  selected,
  onPress
}: {
  card: ProductionCardListItem;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.title} 제작 카드 선택`}
      onPress={onPress}
      style={[styles.listCard, selected && styles.listCardSelected]}
    >
      <View style={styles.listThumb}>
        <Text style={styles.listThumbText}>{card.thumbnail}</Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.rowHead}>
          <Text style={styles.listCardTitle}>{card.title}</Text>
          <Text style={styles.sheetNo}>{card.sheetNo}</Text>
        </View>
        <Text style={styles.listMeta}>
          {card.quantity} · 납기 {card.dueDate} · {card.totalEstimate}
        </Text>
        <View style={styles.rowHead}>
          <Text style={styles.statusBadgeSmall}>{card.status}</Text>
          {card.issue ? <Text style={styles.issueText}>{card.issue}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function ProductionHeader({ isTablet }: { isTablet: boolean }) {
  return (
    <View style={[styles.header, isTablet && styles.headerTablet]}>
      <View style={styles.heroImage}>
        <Text style={styles.heroImageText}>대표</Text>
        <Text style={styles.heroImageSub}>{productionCardMock.representativeImage}</Text>
      </View>
      <View style={styles.headerText}>
        <View style={styles.statusRow}>
          <Text style={styles.statusBadge}>{productionCardMock.statusLabel}</Text>
          <Text style={styles.metaText}>{productionCardMock.sheetNo}</Text>
        </View>
        <Text style={styles.title}>{productionCardMock.title}</Text>
        <Text style={styles.subtitle}>
          {productionCardMock.productType} · {productionCardMock.quantity} · 납기 {productionCardMock.dueDate}
        </Text>
        <View style={styles.headerStats}>
          <MiniStat label="한벌" value={productionCardMock.unitCost} />
          <MiniStat label="총 예상" value={productionCardMock.totalEstimate} />
          <MiniStat label="문서" value={productionCardMock.outputState} />
        </View>
      </View>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function TabRail({
  activeTab,
  setActiveTab,
  isTablet
}: {
  activeTab: ProductionTabId;
  setActiveTab: (tab: ProductionTabId) => void;
  isTablet: boolean;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRail}>
      {PRODUCTION_TABS.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} 보기`}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
              {isTablet ? tab.label : tab.shortLabel}
            </Text>
            {tab.alertCount ? <Text style={styles.tabAlert}>{tab.alertCount}</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function renderActiveTab(activeTab: ProductionTabId, isTablet: boolean) {
  switch (activeTab) {
    case "overview":
      return <OverviewTab isTablet={isTablet} />;
    case "images":
      return <ImagesTab isTablet={isTablet} />;
    case "sizes":
      return <SizesTab isTablet={isTablet} />;
    case "fabric":
      return <MaterialTab title="원단" summary="필요수량, 로스/여유, 재고 사용, 발주수량을 row로 확인합니다." rows={fabricRows} />;
    case "accessories":
      return <MaterialTab title="부자재" summary="카테고리는 보조 정보로 두고 품목, 옵션, 수량, 상태를 먼저 읽습니다." rows={accessoryRows} />;
    case "flow":
      return <FlowTab />;
    case "output":
      return <OutputTab />;
    default:
      return null;
  }
}

function OverviewTab({ isTablet }: { isTablet: boolean }) {
  return (
    <View>
      <SectionTitle title="제작 요약" caption="대표 이미지, 수량, 납기, 상태, 금액을 먼저 읽는 압축 개요입니다." />
      <View style={[styles.overviewGrid, isTablet && styles.overviewGridTablet]}>
        <View style={styles.overviewImage}>
          <Text style={styles.heroImageText}>대표 이미지</Text>
          <Text style={styles.heroImageSub}>{productionCardMock.representativeImage}</Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.metricGrid}>
            {summaryMetrics.map((item) => (
              <MetricBox key={item.label} label={item.label} value={item.value} note={item.note} />
            ))}
          </View>
        </View>
      </View>
      <View style={[styles.metricGrid, styles.costGrid]}>
        {costMetrics.map((item) => (
          <MetricBox key={item.label} label={item.label} value={item.value} note={item.note} />
        ))}
      </View>
      <View style={styles.subsection}>
        {overviewInfo.map((item) => (
          <InfoRow key={item.label} label={item.label} value={item.value} />
        ))}
      </View>
    </View>
  );
}

function ImagesTab({ isTablet }: { isTablet: boolean }) {
  return (
    <View>
      <SectionTitle
        title="이미지·첨부"
        caption="대표 이미지와 첨부파일을 분리해서 보여줍니다. 실제 카메라, 파일 선택, 업로드는 연결하지 않습니다."
      />
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>첫 이미지가 자동 대표가 되고, 출력 포함 여부는 출력·공유 탭에서 선택합니다.</Text>
      </View>
      <View style={[styles.imageGrid, isTablet && styles.imageGridTablet]}>
        {imageMocks.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title} 이미지 mock`}
            style={[styles.imageTile, item.selected && styles.imageTileSelected]}
          >
            <View style={styles.thumbnail}>
              <Text style={styles.thumbnailKind}>{item.selected ? "대표" : item.kind}</Text>
              <Text style={styles.thumbnailTitle}>{item.title}</Text>
            </View>
            <View style={styles.rowHead}>
              <Text style={styles.smallText}>{item.note}</Text>
              <IconButton label="삭제 예정" symbol="x" danger />
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>첨부파일 목록</Text>
        {attachmentRows.map((item) => (
          <View key={item.title} style={styles.attachmentRow}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDetail}>{item.detail} · 포함 선택은 제작 문서에서 처리</Text>
            </View>
            <IconButton label="첨부 삭제 예정" symbol="x" danger />
          </View>
        ))}
      </View>
    </View>
  );
}

function SizesTab({ isTablet }: { isTablet: boolean }) {
  return (
    <View>
      <SectionTitle
        title="사이즈·색상"
        caption="표준, 고객사, 자유 사이즈를 같은 표에서 확인하고 cm/inch 전환과 1/8 helper를 mock으로 표시합니다."
      />
      <View style={styles.segmentRow}>
        <Text style={styles.segmentSelected}>cm</Text>
        <Text style={styles.segment}>inch</Text>
        <Text style={styles.segment}>1/8 helper</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.sizeTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellStrong}>구분</Text>
            <Text style={styles.tableCellStrong}>사이즈</Text>
            <Text style={styles.tableCell}>가슴</Text>
            <Text style={styles.tableCell}>총장</Text>
            <Text style={styles.tableCell}>어깨</Text>
          </View>
          {sizeRows.map((row) => (
            <View key={`${row.group}-${row.size}`} style={styles.tableRow}>
              <Text style={styles.tableCellStrong}>{row.group}</Text>
              <Text style={styles.tableCellStrong}>{row.size}</Text>
              <Text style={styles.tableCell}>{row.chestCm} cm / {row.chestIn}</Text>
              <Text style={styles.tableCell}>{row.lengthCm} cm / {row.lengthIn}</Text>
              <Text style={styles.tableCell}>{row.shoulderCm} cm</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.colorGrid, isTablet && styles.colorGridTablet]}>
        {colorRows.map((row) => (
          <View key={row.color} style={styles.colorRow}>
            <Text style={styles.colorChip}>{row.color}</Text>
            <Text style={styles.rowTitle}>{row.quantity}</Text>
            <Text style={styles.smallText}>{row.note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MaterialTab({
  title,
  summary,
  rows
}: {
  title: string;
  summary: string;
  rows: MaterialRowData[];
}) {
  const orderable = rows.filter((row) => row.status === "발주 가능").length;
  const requested = rows.filter((row) => row.status === "발주 요청").length;

  return (
    <View>
      <SectionTitle title={title} caption={summary} />
      <View style={styles.rowSummary}>
        <MiniStat label="품목" value={`${rows.length}건`} />
        <MiniStat label="발주 가능" value={`${orderable}건`} />
        <MiniStat label="발주 요청" value={`${requested}건`} />
      </View>
      {rows.map((row) => (
        <MaterialRow key={row.name} row={row} />
      ))}
    </View>
  );
}

function FlowTab() {
  return (
    <View>
      <SectionTitle
        title="제작 플로우"
        caption="제작 공장과 추가 공정을 작업 순서로 보여줍니다. 이동은 drag 또는 길게 누르기 예정 방향만 표시합니다."
      />
      {processRows.map((row, index) => (
        <View key={row.process} style={styles.processRow}>
          <Text style={styles.dragHandle}>{index + 1}</Text>
          <View style={styles.flex}>
            <View style={styles.rowHead}>
              <Text style={styles.rowTitle}>{row.process}</Text>
              <Text style={styles.rowBadge}>{index === 0 ? "제작 공장" : row.status}</Text>
            </View>
            <Text style={styles.rowDetail}>{row.partner} · {row.quantity} · 납기 {row.dueDate}</Text>
            <Text style={styles.rowMeta}>단가 {row.unitPrice} · 금액 {row.amount} · 단위 {row.unit}</Text>
            <Text style={styles.smallText}>{row.memo}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function OutputTab() {
  const included = attachmentRows.filter((item) => item.included);

  return (
    <View>
      <SectionTitle
        title="제작 문서"
        caption="문서 구성, 공유, 인쇄, 저장, 첨부 포함 선택을 mock으로 보여줍니다. 실제 생성과 공유는 호출하지 않습니다."
      />
      <View style={styles.outputPreview}>
        <View style={styles.previewThumb}>
          <Text style={styles.thumbnailKind}>대표</Text>
          <Text style={styles.thumbnailTitle}>{productionCardMock.representativeImage}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>현재 제작 카드 기준 미리보기</Text>
          <Text style={styles.rowDetail}>대표 이미지, 사이즈·색상, 원단, 부자재, 제작 플로우, 메모</Text>
          <View style={styles.chipRow}>
            {included.map((item) => (
              <Text key={item.title} style={styles.fileChip}>{item.title}</Text>
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.subsectionTitle}>첨부파일 포함 선택 placeholder</Text>
      {outputRows.map((row) => (
        <View key={row.title} style={styles.outputRow}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowDetail}>{row.detail}</Text>
            <Text style={styles.smallText}>{row.state}</Text>
          </View>
          <View style={styles.outputActions}>
            <IconButton label={`${row.title} 보기`} symbol="□" />
            <IconButton label={`${row.title} 공유`} symbol="↗" />
            <IconButton label={`${row.title} 인쇄`} symbol="P" />
            <IconButton label={`${row.title} 저장`} symbol="S" />
          </View>
        </View>
      ))}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>배송요청 mock</Text>
        {deliveryRows.map((row) => (
          <View key={row.title} style={styles.deliveryRow}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowDetail}>{row.origin} → {row.destination}</Text>
              <Text style={styles.smallText}>{row.items} · {row.memo}</Text>
            </View>
            <IconButton label="배송요청 저장" symbol="S" />
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

function MetricBox({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.smallText}>{note}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MaterialRow({ row }: { row: MaterialRowData }) {
  return (
    <View style={[styles.dataRow, row.locked && styles.lockedRow]}>
      <View style={styles.rowHead}>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{row.name}</Text>
          <Text style={styles.rowDetail}>
            {row.supplier} · {row.colorOrOption}{row.category ? ` · ${row.category}` : ""}
          </Text>
        </View>
        <View style={styles.statusCluster}>
          <Text style={[styles.rowBadge, statusBadgeStyle(row.status)]}>{row.status}</Text>
          <IconButton label={row.locked ? "잠김" : "편집"} symbol={row.locked ? "L" : "E"} danger={row.status === "주의/잠김"} />
        </View>
      </View>
      <Text style={styles.rowDetail}>
        필요 {row.required} · 로스/여유 {row.allowance} · 재고 {row.stockUse} · 발주 {row.orderQuantity}
      </Text>
      <Text style={styles.rowMeta}>
        단위 {row.unit} · 단가 {row.unitPrice} · 금액 {row.amount}
      </Text>
      <View style={styles.materialFooter}>
        <Text style={styles.smallText}>{row.leftover} · {row.warning}</Text>
        {row.primaryAction ? <PrimaryAction label={row.primaryAction} status={row.status} /> : <Text style={styles.doneText}>완료 상태 · 보기만 가능</Text>}
      </View>
    </View>
  );
}

function PrimaryAction({ label, status }: { label: string; status: MaterialStatus }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} mock 동작`}
      style={[styles.primaryAction, status === "발주 요청" && styles.primaryActionOrange]}
    >
      <Text style={styles.primaryActionText}>{label}</Text>
    </Pressable>
  );
}

function IconButton({ label, symbol, danger = false }: { label: string; symbol: string; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} mock 동작`} style={[styles.iconButton, danger && styles.iconDanger]}>
      <Text style={[styles.iconText, danger && styles.iconDangerText]}>{symbol}</Text>
    </Pressable>
  );
}

function BottomNavigation() {
  return (
    <View style={styles.bottomNav}>
      <NavItem label="카드" symbol="C" selected />
      <NavItem label="이미지" symbol="I" />
      <NavItem label="문서" symbol="D" />
      <NavItem label="설정" symbol="S" />
    </View>
  );
}

function NavItem({ label, symbol, selected = false }: { label: string; symbol: string; selected?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} 이동 mock`} style={styles.navItem}>
      <Text style={[styles.navSymbol, selected && styles.navSymbolSelected]}>{symbol}</Text>
      <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function statusBadgeStyle(status: MaterialStatus) {
  switch (status) {
    case "발주 가능":
      return styles.statusReady;
    case "발주 요청":
      return styles.statusRequested;
    case "발주 완료":
      return styles.statusCompleted;
    case "주의/잠김":
      return styles.statusDanger;
    case "입력중":
    default:
      return styles.statusDraft;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3eee4"
  },
  page: {
    alignSelf: "center",
    gap: 12,
    paddingBottom: 24,
    paddingTop: 10
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  brand: {
    color: "#17263d",
    fontSize: 20,
    fontWeight: "900"
  },
  topMeta: {
    color: "#6d6257",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  deviceHint: {
    color: "#6d6257",
    fontSize: 11,
    fontWeight: "800"
  },
  iconRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: "#d8d0c3",
    borderRadius: 7,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  iconDanger: {
    backgroundColor: "#fff2ef",
    borderColor: "#e2b7af"
  },
  iconText: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900"
  },
  iconDangerText: {
    color: "#9a4035"
  },
  themeStrip: {
    backgroundColor: "#fffaf2",
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 10
  },
  threadLine: {
    backgroundColor: "#c75f35",
    borderRadius: 99,
    height: 3,
    width: 72
  },
  themeTitle: {
    color: "#17263d",
    fontSize: 14,
    fontWeight: "900"
  },
  themeCopy: {
    color: "#63584e",
    fontSize: 12,
    lineHeight: 17
  },
  workbench: {
    gap: 12
  },
  workbenchWide: {
    alignItems: "flex-start",
    flexDirection: "row"
  },
  listPane: {
    backgroundColor: "#faf6ee",
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  listPaneTablet: {
    minWidth: 300
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  listTitle: {
    color: "#17263d",
    fontSize: 15,
    fontWeight: "900"
  },
  listCount: {
    backgroundColor: "#23375a",
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  listCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e0d8cb",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 9
  },
  listCardSelected: {
    borderColor: "#23375a",
    borderWidth: 2
  },
  listThumb: {
    alignItems: "center",
    backgroundColor: "#efe4d3",
    borderColor: "#d8c2a5",
    borderRadius: 7,
    borderWidth: 1,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  listThumbText: {
    color: "#6b563b",
    fontSize: 12,
    fontWeight: "900"
  },
  listCardTitle: {
    color: "#17263d",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19
  },
  sheetNo: {
    color: "#756b60",
    fontSize: 11,
    fontWeight: "800"
  },
  listMeta: {
    color: "#554b43",
    fontSize: 12,
    lineHeight: 17
  },
  issueText: {
    color: "#b4522f",
    fontSize: 11,
    fontWeight: "900"
  },
  detailPane: {
    flex: 1,
    gap: 10,
    minWidth: 0
  },
  header: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  headerTablet: {
    alignItems: "center"
  },
  heroImage: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#efe4d3",
    borderColor: "#d8c2a5",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 84,
    width: 92
  },
  heroImageText: {
    color: "#17263d",
    fontSize: 13,
    fontWeight: "900"
  },
  heroImageSub: {
    color: "#615649",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center"
  },
  headerText: {
    flex: 1,
    gap: 7,
    justifyContent: "center",
    minWidth: 0
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  statusBadge: {
    backgroundColor: "#23375a",
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  statusBadgeSmall: {
    backgroundColor: "#ece8e0",
    borderRadius: 999,
    color: "#514a43",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  metaText: {
    color: "#6d6257",
    fontSize: 12,
    fontWeight: "800"
  },
  title: {
    color: "#141f33",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 29
  },
  subtitle: {
    color: "#4f463f",
    fontSize: 13,
    lineHeight: 19
  },
  headerStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  miniStat: {
    backgroundColor: "#f5f1e8",
    borderColor: "#ded4c5",
    borderRadius: 7,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 88,
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  miniLabel: {
    color: "#7a6c5c",
    fontSize: 10,
    fontWeight: "800"
  },
  miniValue: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2
  },
  tabRail: {
    gap: 7,
    paddingVertical: 2
  },
  tab: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minWidth: 70,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  tabSelected: {
    backgroundColor: "#17263d",
    borderColor: "#17263d"
  },
  tabText: {
    color: "#5d544b",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  tabTextSelected: {
    color: "#ffffff"
  },
  tabAlert: {
    backgroundColor: "#dfad45",
    borderRadius: 999,
    color: "#3d2b10",
    fontSize: 10,
    fontWeight: "900",
    minWidth: 18,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: "center"
  },
  section: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12
  },
  sectionHeader: {
    gap: 5,
    marginBottom: 11
  },
  sectionTitle: {
    color: "#17263d",
    fontSize: 18,
    fontWeight: "900"
  },
  caption: {
    color: "#665c52",
    fontSize: 12,
    lineHeight: 18
  },
  overviewGrid: {
    gap: 10
  },
  overviewGridTablet: {
    alignItems: "stretch",
    flexDirection: "row"
  },
  overviewImage: {
    alignItems: "center",
    backgroundColor: "#efe4d3",
    borderColor: "#d8c2a5",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 112,
    padding: 12
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  costGrid: {
    marginTop: 10
  },
  metricBox: {
    backgroundColor: "#faf6ee",
    borderColor: "#e0d8cb",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "31%",
    flexGrow: 1,
    gap: 4,
    minWidth: 126,
    padding: 10
  },
  metricLabel: {
    color: "#7a6c5c",
    fontSize: 11,
    fontWeight: "800"
  },
  metricValue: {
    color: "#17263d",
    fontSize: 16,
    fontWeight: "900"
  },
  infoRow: {
    borderTopColor: "#ece4d8",
    borderTopWidth: 1,
    gap: 4,
    paddingVertical: 10
  },
  infoLabel: {
    color: "#786b5e",
    fontSize: 11,
    fontWeight: "900"
  },
  infoValue: {
    color: "#332d28",
    fontSize: 13,
    lineHeight: 19
  },
  noticeBox: {
    backgroundColor: "#fff7e7",
    borderColor: "#e6c57b",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 9
  },
  noticeText: {
    color: "#654c1e",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18
  },
  imageGrid: {
    gap: 9
  },
  imageGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  imageTile: {
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 7,
    minWidth: 148,
    padding: 8
  },
  imageTileSelected: {
    backgroundColor: "#fff7e7",
    borderColor: "#c75f35"
  },
  thumbnail: {
    alignItems: "center",
    aspectRatio: 1.45,
    backgroundColor: "#efe4d3",
    borderRadius: 7,
    justifyContent: "center",
    padding: 8
  },
  thumbnailKind: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900"
  },
  thumbnailTitle: {
    color: "#615649",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center"
  },
  subsection: {
    marginTop: 12
  },
  subsectionTitle: {
    color: "#17263d",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5
  },
  attachmentRow: {
    alignItems: "center",
    borderTopColor: "#ece4d8",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 10
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 10
  },
  segment: {
    backgroundColor: "#f5f1e8",
    borderRadius: 999,
    color: "#665c52",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  segmentSelected: {
    backgroundColor: "#17263d",
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  sizeTable: {
    minWidth: 660
  },
  tableHeader: {
    backgroundColor: "#f5f1e8",
    borderColor: "#ded4c5",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 9
  },
  tableRow: {
    borderBottomColor: "#ece4d8",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 9,
    paddingVertical: 10
  },
  tableCellStrong: {
    color: "#17263d",
    flex: 0.72,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 18
  },
  tableCell: {
    color: "#4f463f",
    flex: 1.08,
    fontSize: 12,
    lineHeight: 18
  },
  colorGrid: {
    gap: 8,
    marginTop: 12
  },
  colorGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  colorRow: {
    backgroundColor: "#faf6ee",
    borderColor: "#e0d8cb",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minWidth: 148,
    padding: 10
  },
  colorChip: {
    backgroundColor: "#efe4d3",
    borderRadius: 999,
    color: "#6b563b",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
    textAlign: "center"
  },
  rowSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6
  },
  dataRow: {
    borderTopColor: "#ece4d8",
    borderTopWidth: 1,
    gap: 7,
    paddingVertical: 11
  },
  lockedRow: {
    opacity: 0.82
  },
  rowHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  rowTitle: {
    color: "#17263d",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20
  },
  rowDetail: {
    color: "#4f463f",
    fontSize: 12,
    lineHeight: 18
  },
  rowMeta: {
    color: "#7b4b32",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18
  },
  rowBadge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  statusDraft: {
    backgroundColor: "#ece8e0",
    color: "#534b43"
  },
  statusReady: {
    backgroundColor: "#dfe8f5",
    color: "#23375a"
  },
  statusRequested: {
    backgroundColor: "#ffe1c8",
    color: "#9b4a27"
  },
  statusCompleted: {
    backgroundColor: "#e4eadc",
    color: "#3f5731"
  },
  statusDanger: {
    backgroundColor: "#f5d8d2",
    color: "#963d34"
  },
  statusCluster: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 6
  },
  materialFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  primaryAction: {
    backgroundColor: "#23375a",
    borderColor: "#23375a",
    borderRadius: 7,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  primaryActionOrange: {
    backgroundColor: "#c75f35",
    borderColor: "#c75f35"
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  doneText: {
    color: "#4d6a3a",
    fontSize: 12,
    fontWeight: "900"
  },
  processRow: {
    alignItems: "flex-start",
    borderTopColor: "#ece4d8",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11
  },
  dragHandle: {
    backgroundColor: "#f5f1e8",
    borderRadius: 999,
    color: "#665c52",
    fontSize: 12,
    fontWeight: "900",
    minWidth: 28,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center"
  },
  outputPreview: {
    alignItems: "center",
    backgroundColor: "#faf6ee",
    borderColor: "#e0d8cb",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    padding: 9
  },
  previewThumb: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#efe4d3",
    borderRadius: 7,
    justifyContent: "center",
    width: 66
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8
  },
  fileChip: {
    backgroundColor: "#fff7e7",
    borderRadius: 999,
    color: "#654c1e",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  outputRow: {
    alignItems: "flex-start",
    borderTopColor: "#ece4d8",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11
  },
  outputActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "flex-end",
    maxWidth: 76
  },
  deliveryRow: {
    alignItems: "center",
    borderTopColor: "#ece4d8",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11
  },
  smallText: {
    color: "#756b60",
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16
  },
  bottomNav: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8
  },
  navItem: {
    alignItems: "center",
    gap: 3,
    minWidth: 54
  },
  navSymbol: {
    color: "#756b60",
    fontSize: 12,
    fontWeight: "900"
  },
  navSymbolSelected: {
    color: "#c75f35"
  },
  navLabel: {
    color: "#756b60",
    fontSize: 11,
    fontWeight: "800"
  },
  navLabelSelected: {
    color: "#17263d"
  },
  flex: {
    flex: 1,
    minWidth: 0
  }
});
