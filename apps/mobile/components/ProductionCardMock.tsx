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
  processRows,
  productionCardMock,
  sizeRows,
  summaryMetrics,
  type MaterialRow as MaterialRowData,
  type ProductionTabId
} from "@/constants/mockProductionCard";

const maxPhoneWidth = 520;
const maxTabletWidth = 860;

export default function ProductionCardMock() {
  const [activeTab, setActiveTab] = useState<ProductionTabId>("overview");
  const { width } = useWindowDimensions();
  const isTablet = width >= 760;
  const contentWidth = useMemo(
    () => Math.min(Math.max(width - 24, 320), isTablet ? maxTabletWidth : maxPhoneWidth),
    [isTablet, width]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.page, { width: contentWidth }]}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>WAFL</Text>
            <Text style={styles.topMeta}>App-first 제작 카드 mock</Text>
          </View>
          <Text style={styles.version}>{MOBILE_APP_VERSION}</Text>
        </View>

        <View style={[styles.header, !isTablet && styles.headerCompact]}>
          <View style={styles.heroImage}>
            <Text style={styles.heroImageText}>대표</Text>
            <Text style={styles.heroImageSub}>{productionCardMock.representativeImage}</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.statusRow}>
              <Text style={styles.statusBadge}>{productionCardMock.statusLabel}</Text>
              <Text style={styles.metaText}>{productionCardMock.quantity}</Text>
            </View>
            <Text style={styles.title}>{productionCardMock.title}</Text>
            <Text style={styles.subtitle}>
              {productionCardMock.productType} · 납기 {productionCardMock.dueDate}
            </Text>
            <Text style={styles.nextAction}>{productionCardMock.nextAction}</Text>
          </View>
        </View>

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

        <View style={styles.section}>{renderActiveTab(activeTab, isTablet)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function renderActiveTab(activeTab: ProductionTabId, isTablet: boolean) {
  switch (activeTab) {
    case "overview":
      return <OverviewTab isTablet={isTablet} />;
    case "images":
      return <ImagesTab />;
    case "sizes":
      return <SizesTab />;
    case "fabric":
      return <MaterialTab title="원단" summary="원단 3개 · 원단 총액 6,482,000원 · 작업 필요 2건" rows={fabricRows} />;
    case "accessories":
      return <MaterialTab title="부자재" summary="부자재 3개 · 부자재 총액 1,164,000원 · 작업 필요 2건" rows={accessoryRows} />;
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
      <SectionTitle title="제작 요약" caption="수량, 납기, 단가, 총액, 상태를 먼저 확인하는 mock 시작 화면입니다." />
      <View style={[styles.metricGrid, !isTablet && styles.metricGridPhone]}>
        {summaryMetrics.map((item) => (
          <MetricBox key={item.label} label={item.label} value={item.value} note={item.note} />
        ))}
      </View>
      <View style={styles.divider} />
      <Text style={styles.centerSummary}>원단, 부자재, 공정 금액은 출력 문서 준비 전에 함께 확인합니다.</Text>
      <View style={[styles.metricGrid, styles.costGrid]}>
        {costMetrics.map((item) => (
          <MetricBox key={item.label} label={item.label} value={item.value} note={item.note} />
        ))}
      </View>
      <InfoRow label="출력 상태" value={productionCardMock.outputState} />
      <InfoRow label="다음 추천" value="이미지, 사이즈/컬러, 원단 거래처 정보를 확인한 뒤 작업지시서를 검토합니다." />
    </View>
  );
}

function ImagesTab() {
  return (
    <View>
      <SectionTitle
        title="이미지와 첨부"
        caption="대표 이미지, 사진, 스케치, 참고 이미지를 구분해 보여주는 mock입니다. 실제 카메라와 파일 선택은 연결하지 않습니다."
      />
      <View style={styles.actionRow}>
        <ActionChip label="카메라" />
        <ActionChip label="사진" />
        <ActionChip label="스케치" />
        <ActionChip label="첨부" />
      </View>
      <View style={styles.imageGrid}>
        {imageMocks.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title} 미리보기 mock`}
            style={[styles.imageTile, item.selected && styles.imageTileSelected]}
          >
            <View style={styles.thumbnail}>
              <Text style={styles.thumbnailKind}>{item.kind}</Text>
              <Text style={styles.thumbnailTitle}>{item.title}</Text>
            </View>
            <Text style={styles.smallText}>{item.note}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>첨부 파일</Text>
        {attachmentRows.map((item) => (
          <InfoRow
            key={item.title}
            label={item.title}
            value={`${item.detail} · ${item.included ? "출력 문서 포함" : "내부 검토용"}`}
          />
        ))}
      </View>
    </View>
  );
}

function SizesTab() {
  return (
    <View>
      <SectionTitle
        title="사이즈와 컬러"
        caption="55/66, XS/S/M, cm/inch 전환과 색상별 생산 수량을 한 화면에서 확인합니다."
      />
      <View style={styles.segmentRow}>
        <Text style={styles.segmentSelected}>cm</Text>
        <Text style={styles.segment}>inch</Text>
        <Text style={styles.segment}>1/8 helper</Text>
      </View>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCellStrong}>사이즈</Text>
        <Text style={styles.tableCell}>가슴</Text>
        <Text style={styles.tableCell}>총장</Text>
      </View>
      {sizeRows.map((row) => (
        <View key={row.size} style={styles.tableRow}>
          <Text style={styles.tableCellStrong}>{row.size}</Text>
          <Text style={styles.tableCell}>{row.chestCm} cm / {row.chestIn}</Text>
          <Text style={styles.tableCell}>{row.lengthCm} cm / {row.lengthIn}</Text>
        </View>
      ))}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>컬러별 수량</Text>
        {colorRows.map((row) => (
          <InfoRow key={row.color} label={`${row.color} ${row.quantity}`} value={row.note} />
        ))}
      </View>
    </View>
  );
}

function MaterialTab({ title, summary, rows }: { title: string; summary: string; rows: MaterialRowData[] }) {
  return (
    <View>
      <SectionTitle title={title} caption={`${summary}. 수량 계산, 재고 사용, 주문 수량, 상태, 다음 동작을 row 중심으로 확인합니다.`} />
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
        title="제작 흐름"
        caption="대표 제작 공장과 추가 공정을 같은 문법으로 보여주고, 순서는 drag 또는 길게 누르기 mock으로 조정합니다."
      />
      {processRows.map((row, index) => (
        <View key={row.process} style={styles.processRow}>
          <Text style={styles.dragHandle}>{index + 1}</Text>
          <View style={styles.flex}>
            <View style={styles.rowHead}>
              <Text style={styles.rowTitle}>{row.process}</Text>
              <Text style={styles.rowBadge}>{index === 0 ? "대표 공장" : "추가 공정"}</Text>
            </View>
            <Text style={styles.rowDetail}>{row.partner} · {row.quantity} · 납기 {row.dueDate}</Text>
            <Text style={styles.rowMeta}>단가 {row.unitPrice} · 금액 {row.amount} · 단위 {row.unit}</Text>
            <Text style={styles.smallText}>{row.memo}</Text>
          </View>
          <Text accessibilityLabel="삭제 mock" style={styles.deleteMark}>x</Text>
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
        title="출력과 공유"
        caption="실제 PDF, 공유 링크, 인쇄, 저장은 호출하지 않고 문서 구성과 배송 요청 구조만 보여줍니다."
      />
      <View style={styles.outputPreview}>
        <View style={styles.previewThumb}>
          <Text style={styles.thumbnailKind}>대표</Text>
          <Text style={styles.thumbnailTitle}>{productionCardMock.representativeImage}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>문서 포함 정보</Text>
          <Text style={styles.rowDetail}>대표 이미지, 사이즈/컬러, 원단, 부자재, 제작 흐름, 메모</Text>
          <View style={styles.chipRow}>
            {included.map((item) => (
              <Text key={item.title} style={styles.fileChip}>{item.title}</Text>
            ))}
          </View>
        </View>
      </View>
      {outputRows.map((row) => (
        <View key={row.title} style={styles.outputRow}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowDetail}>{row.detail}</Text>
            <Text style={styles.smallText}>{row.state}</Text>
          </View>
          <View style={styles.outputActions}>
            <ActionTiny label="보기" />
            <ActionTiny label="공유" />
            <ActionTiny label="인쇄" />
          </View>
        </View>
      ))}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>배송요청 rows</Text>
        {deliveryRows.map((row) => (
          <View key={row.title} style={styles.deliveryRow}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowDetail}>{row.origin} → {row.destination}</Text>
              <Text style={styles.smallText}>{row.items} · {row.memo}</Text>
            </View>
            <ActionTiny label="저장" />
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
          <Text style={styles.rowDetail}>{row.supplier} · {row.colorOrOption}</Text>
        </View>
        <View style={styles.statusCluster}>
          <Text style={styles.rowBadge}>{row.status}</Text>
          <Text accessibilityLabel={row.locked ? "잠김" : "편집 가능"} style={styles.lockIcon}>
            {row.locked ? "잠김" : "편집"}
          </Text>
        </View>
      </View>
      <Text style={styles.rowDetail}>
        필요 {row.required} · 로스 {row.allowance} · 재고 {row.stockUse} · 주문 {row.orderQuantity}
      </Text>
      <Text style={styles.rowMeta}>
        단가 {row.unitPrice} · 금액 {row.amount} · 단위 {row.unit}
      </Text>
      <View style={styles.materialFooter}>
        <Text style={styles.smallText}>{row.leftover} · {row.warning}</Text>
        <ActionTiny label={row.primaryAction} />
      </View>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f3ec"
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
  topMeta: {
    color: "#69756f",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  version: {
    color: "#69756f",
    fontSize: 12,
    fontWeight: "700"
  },
  header: {
    backgroundColor: "#ffffff",
    borderColor: "#ddd6ca",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 14
  },
  headerCompact: {
    alignItems: "stretch"
  },
  heroImage: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#e6ecea",
    borderColor: "#b8c8c2",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 92,
    width: 104
  },
  heroImageText: {
    color: "#315546",
    fontSize: 15,
    fontWeight: "900"
  },
  heroImageSub: {
    color: "#4d6264",
    fontSize: 12,
    fontWeight: "700",
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
    fontWeight: "800"
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
  nextAction: {
    color: "#315546",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  tabRail: {
    gap: 8,
    paddingVertical: 2
  },
  tab: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#ddd6ca",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
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
  tabAlert: {
    backgroundColor: "#f2c76f",
    borderRadius: 999,
    color: "#4b3510",
    fontSize: 11,
    fontWeight: "900",
    minWidth: 18,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: "center"
  },
  section: {
    backgroundColor: "#ffffff",
    borderColor: "#ddd6ca",
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
  metricGridPhone: {
    flexDirection: "column"
  },
  costGrid: {
    marginTop: 10
  },
  metricBox: {
    backgroundColor: "#f5f7f4",
    borderColor: "#dce2db",
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "31%",
    flexGrow: 1,
    gap: 4,
    minWidth: 132,
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
  centerSummary: {
    color: "#40504a",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center"
  },
  divider: {
    borderTopColor: "#ece7dd",
    borderTopWidth: 1,
    marginVertical: 12
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
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  actionChipText: {
    color: "#58421a",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  imageTile: {
    borderColor: "#ddd6ca",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    gap: 7,
    minWidth: 138,
    padding: 9
  },
  imageTileSelected: {
    backgroundColor: "#f2fbf4",
    borderColor: "#6ea980"
  },
  thumbnail: {
    alignItems: "center",
    aspectRatio: 1.25,
    backgroundColor: "#e8edf0",
    borderRadius: 6,
    justifyContent: "center",
    padding: 8
  },
  thumbnailKind: {
    color: "#315546",
    fontSize: 12,
    fontWeight: "900"
  },
  thumbnailTitle: {
    color: "#53676b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center"
  },
  subsection: {
    marginTop: 14
  },
  subsectionTitle: {
    color: "#1f2d28",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4
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
  tableHeader: {
    backgroundColor: "#f5f7f4",
    borderColor: "#dce2db",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 10
  },
  tableRow: {
    borderBottomColor: "#ece7dd",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 11
  },
  tableCellStrong: {
    color: "#1f2d28",
    flex: 0.8,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 19
  },
  tableCell: {
    color: "#4d5b56",
    flex: 1.2,
    fontSize: 13,
    lineHeight: 19
  },
  dataRow: {
    borderTopColor: "#ece7dd",
    borderTopWidth: 1,
    gap: 7,
    paddingVertical: 12
  },
  lockedRow: {
    opacity: 0.78
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
  statusCluster: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 6
  },
  lockIcon: {
    backgroundColor: "#f4f1ea",
    borderRadius: 999,
    color: "#5f6a65",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  materialFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
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
    backgroundColor: "#f4f1ea",
    borderRadius: 999,
    color: "#5f6a65",
    fontSize: 13,
    fontWeight: "900",
    minWidth: 28,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center"
  },
  deleteMark: {
    color: "#8b4b48",
    fontSize: 17,
    fontWeight: "900",
    paddingTop: 1
  },
  outputPreview: {
    alignItems: "center",
    backgroundColor: "#f5f7f4",
    borderColor: "#dce2db",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    padding: 10
  },
  previewThumb: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#e8edf0",
    borderRadius: 7,
    justifyContent: "center",
    width: 72
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8
  },
  fileChip: {
    backgroundColor: "#fff7e5",
    borderRadius: 999,
    color: "#58421a",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 5
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
  deliveryRow: {
    alignItems: "center",
    borderTopColor: "#ece7dd",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12
  },
  tinyButton: {
    backgroundColor: "#f5f7f4",
    borderColor: "#dce2db",
    borderRadius: 7,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  tinyButtonText: {
    color: "#2f3d38",
    fontSize: 12,
    fontWeight: "800"
  },
  smallText: {
    color: "#69756f",
    fontSize: 12,
    lineHeight: 17
  },
  flex: {
    flex: 1,
    minWidth: 0
  }
});
