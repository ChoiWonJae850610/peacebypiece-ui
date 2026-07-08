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
  fabricRows,
  imageMocks,
  outputRows,
  processRows,
  productionCardMock,
  sizeRows,
  type ProductionTabId
} from "@/constants/mockProductionCard";

const currencySummary = [
  { label: "한벌 단가", value: productionCardMock.unitCost },
  { label: "총 예상", value: productionCardMock.totalEstimate },
  { label: "원단 총액", value: productionCardMock.fabricTotal },
  { label: "부자재 총액", value: productionCardMock.accessoryTotal },
  { label: "공정 총액", value: productionCardMock.processTotal }
];

export default function ProductionCardMock() {
  const [activeTab, setActiveTab] = useState<ProductionTabId>("overview");
  const { width } = useWindowDimensions();
  const isTablet = width >= 760;
  const contentWidth = useMemo(() => Math.min(width - 24, isTablet ? 920 : 520), [isTablet, width]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.page, { width: contentWidth }]}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>WAFL</Text>
          <Text style={styles.version}>{MOBILE_APP_VERSION}</Text>
        </View>

        <View style={styles.header}>
          <View style={styles.heroImage}>
            <Text style={styles.heroImageText}>대표 이미지</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.statusRow}>
              <Text style={styles.statusBadge}>{productionCardMock.statusLabel}</Text>
              <Text style={styles.metaText}>{productionCardMock.quantity}</Text>
            </View>
            <Text style={styles.title}>{productionCardMock.title}</Text>
            <Text style={styles.subtitle}>
              {productionCardMock.subtitle} · 납기 {productionCardMock.dueDate}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRail}>
          {PRODUCTION_TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                accessibilityLabel={`${tab.label} 탭 보기`}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                  {isTablet ? tab.label : tab.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.section}>{renderActiveTab(activeTab)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function renderActiveTab(activeTab: ProductionTabId) {
  switch (activeTab) {
    case "overview":
      return <OverviewTab />;
    case "images":
      return <ImagesTab />;
    case "sizes":
      return <SizesTab />;
    case "fabric":
      return <FabricTab />;
    case "accessories":
      return <AccessoriesTab />;
    case "flow":
      return <FlowTab />;
    case "output":
      return <OutputTab />;
    default:
      return null;
  }
}

function OverviewTab() {
  return (
    <View>
      <SectionTitle title="제작 요약" caption="mock-only 제작 카드의 현재 비용과 진행 상태입니다." />
      <View style={styles.metricGrid}>
        {currencySummary.map((item) => (
          <View key={item.label} style={styles.metricBox}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
          </View>
        ))}
      </View>
      <InfoRow label="상태" value="원단 거래처 1건 확인 후 발주 요청 가능" />
      <InfoRow label="다음 행동" value="이미지, 사이즈·색상, 원단 정보를 확인한 뒤 작업지시서를 준비합니다." />
    </View>
  );
}

function ImagesTab() {
  return (
    <View>
      <SectionTitle title="이미지·첨부" caption="실제 카메라, 사진 선택, 파일 업로드는 연결하지 않은 자리입니다." />
      <View style={styles.actionRow}>
        <ActionChip label="카메라" />
        <ActionChip label="사진" />
        <ActionChip label="스케치" />
        <ActionChip label="첨부" />
      </View>
      <View style={styles.imageGrid}>
        {imageMocks.map((item) => (
          <View key={item.name} style={[styles.imageTile, item.selected && styles.imageTileSelected]}>
            <View style={styles.thumbnail}>
              <Text style={styles.thumbnailText}>{item.kind}</Text>
            </View>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.smallText}>{item.selected ? "대표 선택" : "대표 후보"}</Text>
          </View>
        ))}
      </View>
      <InfoRow label="첨부" value="원단 스와치 확인서.pdf, 공장 전달 메모.txt" />
    </View>
  );
}

function SizesTab() {
  return (
    <View>
      <SectionTitle title="사이즈·색상" caption="XS/S/M, 55/66, cm/inch 방향을 한 화면에서 확인합니다." />
      <View style={styles.segmentRow}>
        <Text style={styles.segmentSelected}>cm</Text>
        <Text style={styles.segment}>inch</Text>
        <Text style={styles.segment}>1/8 helper</Text>
      </View>
      {sizeRows.map((row) => (
        <View key={row.size} style={styles.dataRow}>
          <Text style={styles.rowTitle}>{row.size}</Text>
          <Text style={styles.rowDetail}>가슴 {row.chest} · 총장 {row.length}</Text>
          <Text style={styles.rowMeta}>{row.color}</Text>
        </View>
      ))}
    </View>
  );
}

function FabricTab() {
  return (
    <View>
      <SectionTitle title="원단" caption="거래처 필수, 재고 사용, 발주 수량, 단가, 총액을 mock 행으로 확인합니다." />
      {fabricRows.map((row) => (
        <MaterialRow
          key={row.name}
          title={row.name}
          badge={row.status}
          lines={[
            `거래처 ${row.supplier}`,
            `필요 ${row.quantity} · 재고 ${row.stock} · 발주 ${row.order}`,
            `단가 ${row.unitPrice} · 금액 ${row.amount}`
          ]}
        />
      ))}
    </View>
  );
}

function AccessoriesTab() {
  return (
    <View>
      <SectionTitle title="부자재" caption="카테고리는 보조 정보로 두고 품목, 거래처, 수량, 금액을 먼저 봅니다." />
      {accessoryRows.map((row) => (
        <MaterialRow
          key={row.name}
          title={row.name}
          badge={row.status}
          lines={[`카테고리 ${row.category}`, `거래처 ${row.supplier} · 발주 ${row.order}`, `금액 ${row.amount}`]}
        />
      ))}
    </View>
  );
}

function FlowTab() {
  return (
    <View>
      <SectionTitle title="제작 플로우" caption="대표 제작 공장과 추가 공정을 같은 문법으로 보여줍니다." />
      <Text style={styles.hintText}>공정 순서는 드래그 또는 길게 눌러 조정하는 방향입니다.</Text>
      {processRows.map((row) => (
        <View key={row.process} style={styles.processRow}>
          <Text style={styles.dragHandle}>::</Text>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{row.process}</Text>
            <Text style={styles.rowDetail}>{row.partner} · {row.quantity}</Text>
            <Text style={styles.rowMeta}>단가 {row.unitPrice} · 금액 {row.amount}</Text>
            <Text style={styles.smallText}>{row.memo}</Text>
          </View>
          <Text style={styles.deleteMark}>x</Text>
        </View>
      ))}
    </View>
  );
}

function OutputTab() {
  return (
    <View>
      <SectionTitle title="출력·공유" caption="실제 PDF 생성, 공유 링크, 인쇄 호출은 없는 mock 문서 영역입니다." />
      {outputRows.map((row) => (
        <View key={row.title} style={styles.outputRow}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowDetail}>{row.detail}</Text>
          </View>
          <View style={styles.outputActions}>
            <ActionTiny label="보기" />
            <ActionTiny label="공유" />
            <ActionTiny label="인쇄" />
          </View>
        </View>
      ))}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionChip({ label }: { label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} mock 동작`} style={styles.actionChip}>
      <Text style={styles.actionChipText}>{label}</Text>
    </Pressable>
  );
}

function ActionTiny({ label }: { label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} mock 동작`} style={styles.tinyButton}>
      <Text style={styles.tinyButtonText}>{label}</Text>
    </Pressable>
  );
}

function MaterialRow({ title, badge, lines }: { title: string; badge: string; lines: string[] }) {
  return (
    <View style={styles.dataRow}>
      <View style={styles.rowHead}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBadge}>{badge}</Text>
      </View>
      {lines.map((line) => (
        <Text key={line} style={styles.rowDetail}>{line}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f4ed"
  },
  page: {
    alignSelf: "center",
    gap: 14,
    paddingBottom: 28,
    paddingTop: 12
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  brand: {
    color: "#24382f",
    fontSize: 18,
    fontWeight: "800"
  },
  version: {
    color: "#69756f",
    fontSize: 12,
    fontWeight: "600"
  },
  header: {
    backgroundColor: "#ffffff",
    borderColor: "#ded8cc",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 14
  },
  heroImage: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#e7edf0",
    borderColor: "#b8c7c7",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    width: 92
  },
  heroImageText: {
    color: "#4d6264",
    fontSize: 13,
    fontWeight: "700"
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
    backgroundColor: "#e0f1e7",
    borderRadius: 999,
    color: "#24533b",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  metaText: {
    color: "#69756f",
    fontSize: 13,
    fontWeight: "700"
  },
  title: {
    color: "#1f2d28",
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 30
  },
  subtitle: {
    color: "#5f6a65",
    fontSize: 14,
    lineHeight: 20
  },
  tabRail: {
    gap: 8,
    paddingVertical: 2
  },
  tab: {
    backgroundColor: "#ffffff",
    borderColor: "#ded8cc",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  tabSelected: {
    backgroundColor: "#263a31",
    borderColor: "#263a31"
  },
  tabText: {
    color: "#5f6a65",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  tabTextSelected: {
    color: "#ffffff"
  },
  section: {
    backgroundColor: "#ffffff",
    borderColor: "#ded8cc",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14
  },
  sectionHeader: {
    gap: 5,
    marginBottom: 12
  },
  sectionTitle: {
    color: "#1f2d28",
    fontSize: 20,
    fontWeight: "900"
  },
  caption: {
    color: "#66716c",
    fontSize: 13,
    lineHeight: 19
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricBox: {
    backgroundColor: "#f5f7f4",
    borderColor: "#dce2db",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "46%",
    flexGrow: 1,
    gap: 4,
    minWidth: 140,
    padding: 12
  },
  metricLabel: {
    color: "#69756f",
    fontSize: 12,
    fontWeight: "700"
  },
  metricValue: {
    color: "#1f2d28",
    fontSize: 17,
    fontWeight: "900"
  },
  infoRow: {
    borderTopColor: "#ece7dd",
    borderTopWidth: 1,
    gap: 4,
    paddingVertical: 12
  },
  infoLabel: {
    color: "#69756f",
    fontSize: 12,
    fontWeight: "800"
  },
  infoValue: {
    color: "#2f3d38",
    fontSize: 14,
    lineHeight: 20
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  actionChip: {
    backgroundColor: "#fff7e5",
    borderColor: "#ead5a6",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  actionChipText: {
    color: "#58421a",
    fontSize: 13,
    fontWeight: "800"
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  imageTile: {
    borderColor: "#ded8cc",
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 9,
    width: 136
  },
  imageTileSelected: {
    backgroundColor: "#f2fbf4",
    borderColor: "#6ea980"
  },
  thumbnail: {
    alignItems: "center",
    aspectRatio: 1.2,
    backgroundColor: "#e8edf0",
    borderRadius: 6,
    justifyContent: "center"
  },
  thumbnailText: {
    color: "#53676b",
    fontSize: 12,
    fontWeight: "800"
  },
  smallText: {
    color: "#69756f",
    fontSize: 12,
    lineHeight: 17
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10
  },
  segment: {
    backgroundColor: "#f4f1ea",
    borderRadius: 999,
    color: "#66716c",
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  segmentSelected: {
    backgroundColor: "#263a31",
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  dataRow: {
    borderTopColor: "#ece7dd",
    borderTopWidth: 1,
    gap: 6,
    paddingVertical: 12
  },
  rowHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  rowTitle: {
    color: "#1f2d28",
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21
  },
  rowDetail: {
    color: "#4d5b56",
    fontSize: 13,
    lineHeight: 19
  },
  rowMeta: {
    color: "#6a5140",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  rowBadge: {
    backgroundColor: "#e8f0fb",
    borderRadius: 999,
    color: "#304f7a",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  hintText: {
    backgroundColor: "#f4f1ea",
    borderRadius: 8,
    color: "#5b665f",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
    padding: 10
  },
  processRow: {
    alignItems: "flex-start",
    borderTopColor: "#ece7dd",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12
  },
  dragHandle: {
    color: "#89918d",
    fontSize: 18,
    fontWeight: "900",
    paddingTop: 1
  },
  deleteMark: {
    color: "#8b4b48",
    fontSize: 17,
    fontWeight: "900",
    paddingTop: 1
  },
  outputRow: {
    alignItems: "flex-start",
    borderTopColor: "#ece7dd",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12
  },
  outputActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
    maxWidth: 132
  },
  tinyButton: {
    backgroundColor: "#f5f7f4",
    borderColor: "#dce2db",
    borderRadius: 7,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  tinyButtonText: {
    color: "#2f3d38",
    fontSize: 12,
    fontWeight: "800"
  },
  flex: {
    flex: 1,
    minWidth: 0
  }
});
