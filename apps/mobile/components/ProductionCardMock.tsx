import { type ReactNode, useMemo, useState } from "react";
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
  nextCheckByTab,
  outputRows,
  overviewInfo,
  processRows,
  progressSteps,
  productionCardMock,
  productionCards,
  sizeRows,
  sizeTemplates,
  summaryMetrics,
  type MaterialRow as MaterialRowData,
  type MaterialStatus,
  type ProductionCardListItem,
  type ProductionTabId
} from "@/constants/mockProductionCard";

const maxPhoneWidth = 520;
const maxTabletWidth = 1040;

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
        <View style={[styles.workbench, isWideTablet && styles.workbenchWide]}>
          <ProductionCardList
            selectedCardId={selectedCardId}
            onSelect={setSelectedCardId}
            isTablet={isTablet}
          />
          <View style={styles.detailPane}>
            <ProductionHeader isTablet={isTablet} />
            <TabRail activeTab={activeTab} setActiveTab={setActiveTab} isTablet={isTablet} />
            <View style={styles.section}>
              <NextCheckPanel activeTab={activeTab} />
              {renderActiveTab(activeTab, isTablet)}
            </View>
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
      {isTablet ? <Text style={styles.deviceHint}>Tablet</Text> : null}
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
      <MiniGarmentThumb label={card.thumbnail} />
      <View style={styles.flex}>
        <View style={styles.rowHead}>
          <Text style={styles.listCardTitle}>{card.title}</Text>
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
      <GarmentPreview compact={!isTablet} label={productionCardMock.representativeImage} count={4} />
      <View style={styles.headerText}>
        <View style={styles.statusRow}>
          <Text style={styles.statusBadge}>{productionCardMock.statusLabel}</Text>
          <Text style={styles.metaText}>대표 이미지 자동 반영</Text>
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

function GarmentPreview({ label, count, compact = false }: { label: string; count?: number; compact?: boolean }) {
  return (
    <View style={[styles.garmentPreview, compact && styles.garmentPreviewCompact]}>
      <View style={styles.hangerLine} />
      <View style={styles.hangerHook} />
      <View style={styles.garmentShape}>
        <View style={styles.collarShape} />
        <View style={styles.sleeveLeft} />
        <View style={styles.sleeveRight} />
        <View style={styles.waistLine} />
      </View>
      <View style={styles.fabricShadow} />
      <Text style={styles.imageLabel}>{label}</Text>
      {count ? <Text style={styles.imageCount}>{count}</Text> : null}
    </View>
  );
}

function MiniGarmentThumb({ label }: { label: string }) {
  return (
    <View style={styles.miniGarmentThumb}>
      <View style={styles.miniHangerLine} />
      <View style={styles.miniGarmentBody}>
        <View style={styles.miniCollar} />
      </View>
      <Text style={styles.miniThumbLabel}>{label}</Text>
    </View>
  );
}

function SwatchVisual({
  tone = "fabric",
  label
}: {
  tone?: "fabric" | "lining" | "navy" | "button" | "label" | "package";
  label?: string;
}) {
  const toneStyle =
    tone === "navy"
      ? styles.swatchNavy
      : tone === "lining"
        ? styles.swatchLining
        : tone === "button"
          ? styles.swatchButton
          : tone === "label"
            ? styles.swatchLabel
            : tone === "package"
              ? styles.swatchPackage
              : styles.swatchFabric;

  return (
    <View style={[styles.swatchVisual, toneStyle]}>
      <View style={styles.swatchLine} />
      <View style={styles.swatchLineShort} />
      <View style={styles.swatchLayer} />
      {tone === "button" ? <View style={styles.buttonDots} /> : null}
      {label ? <Text style={styles.swatchLabelText}>{label}</Text> : null}
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

function NextCheckPanel({ activeTab }: { activeTab: ProductionTabId }) {
  const item = nextCheckByTab[activeTab];
  const toneStyle =
    item.tone === "warning"
      ? styles.nextCheckWarning
      : item.tone === "ready"
        ? styles.nextCheckReady
        : styles.nextCheckNeutral;

  return (
    <View style={[styles.nextCheckPanel, toneStyle]}>
      <Text style={styles.nextCheckEyebrow}>다음 확인</Text>
      <View style={styles.flex}>
        <Text style={styles.nextCheckTitle}>{item.title}</Text>
        <Text style={styles.nextCheckDetail}>{item.detail}</Text>
      </View>
    </View>
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
        <GarmentPreview label={productionCardMock.representativeImage} count={4} />
        <View style={styles.flex}>
          <View style={styles.summaryList}>
            {summaryMetrics.map((item) => (
              <MetricLine key={item.label} label={item.label} value={item.value} note={item.note} />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.costList}>
        {costMetrics.map((item) => (
          <MetricLine key={item.label} label={item.label} value={item.value} note={item.note} compact />
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
        caption="사진은 제목을 매번 입력하지 않고 썸네일로 고릅니다. 첫 이미지는 자동 대표가 되며, 첨부는 허용 확장자 mock만 표시합니다."
      />
      <SectionActionRow>
        <IconButton label="사진 선택 mock" symbol="▧" caption="사진" />
        <IconButton label="카메라 촬영 mock" symbol="◎" caption="카메라" />
        <IconButton label="스케치 열기 mock" symbol="✎" caption="스케치" />
        <IconButton label="첨부파일 추가 mock" symbol="＋" caption="첨부" />
      </SectionActionRow>
      <View style={styles.compactNotice}>
        <Text style={styles.compactNoticeText}>첫 이미지는 자동 대표 · 대표 삭제 시 다음 이미지가 대표 · 실제 카메라/파일 선택 없음</Text>
      </View>
      <View style={[styles.imageGrid, isTablet && styles.imageGridTablet]}>
        {imageMocks.map((item) => (
          <View
            key={item.id}
            style={[styles.imageTile, item.selected && styles.imageTileSelected]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.kind} 이미지 상세보기 mock 동작`}
              style={styles.imageTileVisualWrap}
            >
              <GarmentPreview compact label={item.kind} />
              {item.selected ? <Text style={styles.crownBadge}>대표</Text> : null}
              <Text style={styles.imageTapHint}>눌러서 상세</Text>
            </Pressable>
            <ActionCluster>
              <IconButton label={item.selected ? "대표 이미지" : "대표로 선택"} symbol={item.selected ? "★" : "☆"} caption="대표" />
              <IconButton label="삭제 예정" symbol="×" danger caption="삭제" />
            </ActionCluster>
          </View>
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
            <IconButton label="첨부 삭제 예정" symbol="×" danger />
          </View>
        ))}
      </View>
      <View style={styles.memoFieldMock}>
        <Text style={styles.infoLabel}>공장 전달 메모</Text>
        <Text style={styles.infoValue}>워싱 강도와 라벨 위치는 공장 전달 전에 여기에서 수정합니다.</Text>
        <Text style={styles.smallText}>완료 전 수정 가능 · 완료 후 잠금 예정 · 관리자 알림은 이후 구현</Text>
      </View>
    </View>
  );
}

function SizesTab({ isTablet }: { isTablet: boolean }) {
  const [unitMode, setUnitMode] = useState<"cm" | "inch">("cm");
  const unitSuffix = unitMode === "cm" ? "cm" : "inch";

  return (
    <View>
      <SectionTitle
        title="사이즈·색상"
        caption="선택한 단위만 표에 표시합니다. 제품 유형별 추천 치수는 시작점이고, 실제 값은 자유 수정 mock입니다."
      />
      <View style={styles.quantityCheck}>
        <Text style={styles.quantityCheckTitle}>색상별 수량 합계</Text>
        <Text style={styles.quantityCheckText}>총 360벌</Text>
      </View>
      <View style={styles.segmentRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="cm 단위 보기" onPress={() => setUnitMode("cm")}>
          <Text style={unitMode === "cm" ? styles.segmentSelected : styles.segment}>cm</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="inch 단위 보기" onPress={() => setUnitMode("inch")}>
          <Text style={unitMode === "inch" ? styles.segmentSelected : styles.segment}>inch</Text>
        </Pressable>
        <Text style={styles.segment}>1/8 helper 예정</Text>
      </View>
      <View style={styles.templateStrip}>
        {sizeTemplates.map((template) => (
          <View key={template.productType} style={[styles.templateChip, template.selected && styles.templateChipSelected]}>
            <Text style={[styles.templateTitle, template.selected && styles.templateTitleSelected]}>{template.productType}</Text>
            <Text style={[styles.templateDetail, template.selected && styles.templateDetailSelected]}>{template.fields.join(" · ")}</Text>
          </View>
        ))}
        <AddChip label="사이즈 추가" />
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
              <Text style={styles.tableCell}>{unitMode === "cm" ? row.chestCm : row.chestIn} {unitSuffix}</Text>
              <Text style={styles.tableCell}>{unitMode === "cm" ? row.lengthCm : row.lengthIn} {unitSuffix}</Text>
              <Text style={styles.tableCell}>{unitMode === "cm" ? row.shoulderCm : row.shoulderIn} {unitSuffix}</Text>
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
        <AddChip label="색상 추가" />
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
      <View style={styles.sectionTitleWithActions}>
        <View style={styles.flex}>
          <SectionTitle title={title} caption={summary} />
        </View>
        <HeaderAddButton label={`${title} 추가`} />
      </View>
      <View style={styles.rowSummary}>
        <Text style={styles.inlineMetric}>품목 {rows.length}건</Text>
        <Text style={styles.inlineMetric}>발주 가능 {orderable}건</Text>
        <Text style={styles.inlineMetric}>발주 요청 {requested}건</Text>
      </View>
      {rows.map((row) => (
        <MaterialRow key={row.name} row={row} />
      ))}
    </View>
  );
}

function ProgressRail() {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.subsectionTitle}>기본 제작 플로우 6단계</Text>
        <Text style={styles.smallText}>발주 · 자재 · 재단 · 공정 · 검수 · 출고를 준비/작업중/완료로만 표시합니다.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.progressRail}>
        {progressSteps.map((step, index) => (
          <View key={step.id} style={styles.progressStep}>
            <View style={styles.progressTopLine}>
              <View style={[styles.progressDot, progressStepTone(step.status)]} />
              {index < progressSteps.length - 1 ? <View style={styles.progressConnector} /> : null}
            </View>
            <Text style={styles.progressShort}>{step.shortLabel}</Text>
            <Text style={[styles.progressStatus, progressStatusText(step.status)]}>{step.status}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.progressDetailList}>
        {progressSteps.map((step) => (
          <View key={`${step.id}-detail`} style={styles.progressDetailRow}>
            <View style={styles.progressDetailHead}>
              <Text style={styles.rowTitle}>{step.label}</Text>
              <Text style={[styles.rowBadge, progressStatusBadge(step.status)]}>{step.status}</Text>
            </View>
            <Text style={styles.rowDetail}>{step.partner} · 전달일 {step.handoffDate}</Text>
            <Text style={styles.smallText}>{step.memo}{step.removable ? " · 삭제 가능 mock" : ""}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FlowTab() {
  return (
    <View>
      <SectionTitle
        title="제작 플로우"
        caption="기본 단계는 유지하되 재단은 삭제 가능하고, 공정 안에는 봉제·나염·라벨 같은 내부 공정을 추가하는 구조입니다."
      />
      <ProgressRail />
      <View style={styles.flowSummary}>
        <Text style={styles.inlineMetric}>제작 공장 1곳</Text>
        <Text style={styles.inlineMetric}>추가 공정 2건</Text>
        <Text style={styles.inlineMetric}>준비 2건</Text>
      </View>
      <View style={styles.processSectionHeader}>
        <View style={styles.flex}>
          <Text style={styles.subsectionTitle}>공정 단계 안의 세부 공정</Text>
          <Text style={styles.smallText}>봉제·워싱·자수·라벨 같은 항목은 6단계 중 공정 안에 쌓입니다.</Text>
        </View>
        <HeaderAddButton label="공정 추가" />
      </View>
      <Text style={styles.advancedFlowHint}>플로우 단계 추가는 고급/예외 mock이며 나중에 action sheet에서 분리합니다.</Text>
      {processRows.map((row, index) => (
        <View key={row.process} style={styles.processRow}>
          <Text style={styles.dragHandle}>{index + 1}</Text>
          <View style={styles.flex}>
            <View style={styles.rowHead}>
              <Text style={styles.rowTitle}>{row.process}</Text>
              <Text style={styles.rowBadge}>공정 안 항목</Text>
            </View>
            <Text style={styles.rowDetail}>{row.partner} · {row.quantity} · 납기 {row.dueDate}</Text>
            <Text style={styles.rowMeta}>단가 {row.unitPrice} · 금액 {row.amount} · 단위 {row.unit}</Text>
            <Text style={styles.statusLine}>상태 · {row.status}</Text>
            <Text style={styles.smallText}>{row.memo}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function DocumentWorkbench({ included }: { included: typeof attachmentRows }) {
  const selectedDocument = outputRows[0];
  const primaryDelivery = deliveryRows[0];

  return (
    <View style={styles.documentWorkbench}>
      <View style={styles.documentList}>
        {outputRows.map((row, index) => (
          <View key={row.title} style={[styles.documentListRow, index === 0 && styles.documentListRowSelected]}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.smallText}>{row.state}</Text>
          </View>
        ))}
      </View>
      <View style={styles.documentPreviewSheet}>
        <View style={styles.documentPreviewHeader}>
          <View style={styles.previewThumb}>
            <GarmentPreview compact label="문서" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.documentPreviewTitle}>{selectedDocument.title}</Text>
            <Text style={styles.rowDetail}>{productionCardMock.title}</Text>
            <Text style={styles.smallText}>{productionCardMock.quantity} · 납기 {productionCardMock.dueDate}</Text>
          </View>
        </View>
        <View style={styles.documentPreviewGrid}>
          <InfoRow label="총 예상" value={productionCardMock.totalEstimate} />
          <InfoRow label="한벌 단가" value={productionCardMock.unitCost} />
          <InfoRow label="원단/부자재" value="원단 4건 · 부자재 4건" />
          <InfoRow label="공장/공정" value="제작 공장 + 추가 공정 2건" />
        </View>
        <View style={styles.documentMemoBox}>
          <Text style={styles.infoLabel}>공장 전달 메모</Text>
          <Text style={styles.infoValue}>{productionCardMock.memo}</Text>
        </View>
      </View>
      <View style={styles.documentSidePanel}>
        <Text style={styles.subsectionTitle}>포함 항목</Text>
        <View style={styles.chipRow}>
          {selectedDocument.includes.map((item) => (
            <Text key={item} style={styles.fileChip}>{item}</Text>
          ))}
          {included.map((item) => (
            <Text key={item.title} style={styles.fileChip}>{item.title}</Text>
          ))}
        </View>
        <View style={styles.deliverySummaryBox}>
          <Text style={styles.subsectionTitle}>배송요청 요약</Text>
          <Text style={styles.rowDetail}>{primaryDelivery.origin} → {primaryDelivery.destination}</Text>
          <Text style={styles.smallText}>{primaryDelivery.items} · {primaryDelivery.contact}</Text>
          <Text style={styles.smallText}>전달 메모 · {primaryDelivery.memo}</Text>
        </View>
        <View style={styles.documentActionBar}>
          <IconButton label="보기" symbol="□" />
          <IconButton label="공유" symbol="↗" />
          <IconButton label="인쇄" symbol="⎙" />
          <IconButton label="저장" symbol="↓" />
        </View>
      </View>
    </View>
  );
}

function OutputTab() {
  const included = attachmentRows.filter((item) => item.included);

  return (
    <View>
      <SectionTitle
        title="제작 문서"
        caption="문서 선택, 포함 항목, 공유 설정을 한 곳에서 확인합니다. 실제 PDF 생성과 공유는 연결하지 않습니다."
      />
      <DocumentWorkbench included={included} />
      <Text style={styles.subsectionTitle}>문서 설정</Text>
      {outputRows.map((row) => (
        <View key={row.title} style={styles.outputRow}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowDetail}>{row.detail}</Text>
            <View style={styles.chipRow}>
              {row.includes.map((item) => (
                <Text key={item} style={styles.fileChip}>{item}</Text>
              ))}
            </View>
            <Text style={styles.smallText}>{row.state}</Text>
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
              <Text style={styles.smallText}>{row.items} · {row.contact}</Text>
              <Text style={styles.smallText}>전달 메모 · {row.memo}</Text>
            </View>
            <IconButton label="배송요청 저장" symbol="↓" />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MaterialRow({ row }: { row: MaterialRowData }) {
  const primaryAction = getMaterialAction(row);

  return (
    <View style={[styles.dataRow, row.locked && styles.lockedRow]}>
      <View style={styles.rowHead}>
        <SwatchVisual tone={getMaterialTone(row)} label={row.category} />
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{row.name}</Text>
          <Text style={styles.rowDetail}>
            {row.supplier} · {row.colorOrOption}{row.category ? ` · ${row.category}` : ""}
          </Text>
        </View>
        <View style={styles.statusCluster}>
          <Text style={[styles.rowBadge, statusBadgeStyle(row.status)]}>{row.status}</Text>
          {primaryAction ? <IconButton label={primaryAction.label} symbol={primaryAction.symbol} caption={primaryAction.caption} emphasized /> : null}
          <IconButton label={row.locked ? "잠김" : "수정 가능"} symbol={row.locked ? "●" : "○"} caption={row.locked ? "잠금" : "수정"} danger={row.status === "주의/잠김"} />
          <IconButton label="보기" symbol="□" caption="보기" />
          {!row.locked ? <IconButton label="삭제 예정" symbol="×" danger caption="삭제" /> : null}
          <IconButton label="개별 사진 선택 사항" symbol="▧" caption="사진" />
        </View>
      </View>
      <Text style={styles.rowDetail}>
        필요 {row.required} · 로스/여유 {row.allowance} · 재고 {row.stockUse} · 발주 {row.orderQuantity}
      </Text>
      <Text style={styles.rowMeta}>
        단위 {row.unit} · 단가 {row.unitPrice} · 금액 {row.amount}
      </Text>
      <View style={styles.materialFooter}>
        <Text style={styles.smallText}>{row.leftover} · {row.warning} · 사진 선택 사항</Text>
        <InlineEditHint locked={row.locked} />
      </View>
    </View>
  );
}

function getMaterialAction(row: MaterialRowData) {
  if (!row.primaryAction || row.status === "발주 완료") {
    return null;
  }
  if (row.status === "발주 요청") {
    return { label: `${row.primaryAction} mock`, symbol: "✓", caption: "완료" };
  }
  if (row.status === "발주 가능") {
    return { label: `${row.primaryAction} mock`, symbol: "↗", caption: "발주" };
  }
  return { label: `${row.primaryAction} mock`, symbol: "!", caption: "확인" };
}

function ActionCluster({ children }: { children: ReactNode }) {
  return <View style={styles.actionCluster}>{children}</View>;
}

function SectionActionRow({ children }: { children: ReactNode }) {
  return <View style={styles.sectionActionRow}>{children}</View>;
}

function HeaderAddButton({ label }: { label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} mock 동작`} style={styles.headerAddButton}>
      <Text style={styles.headerAddButtonText}>＋</Text>
    </Pressable>
  );
}

function AddChip({ label }: { label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} mock 동작`} style={styles.addChip}>
      <Text style={styles.addChipSymbol}>＋</Text>
      <Text style={styles.addChipText}>{label}</Text>
    </Pressable>
  );
}

function InlineEditHint({ locked }: { locked: boolean }) {
  return (
    <Text style={[styles.inlineEditHint, locked && styles.inlineEditHintLocked]}>
      {locked ? "잠김 · 보기만 가능" : "값을 눌러 수정 mock"}
    </Text>
  );
}

function MetricLine({ label, value, note, compact = false }: { label: string; value: string; note: string; compact?: boolean }) {
  return (
    <View style={[styles.metricLine, compact && styles.metricLineCompact]}>
      <View style={styles.flex}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.smallText}>{note}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function getMaterialTone(row: MaterialRowData) {
  const text = `${row.name} ${row.colorOrOption} ${row.category ?? ""}`;
  if (text.includes("네이비")) {
    return "navy";
  }
  if (text.includes("안감")) {
    return "lining";
  }
  if (text.includes("버튼")) {
    return "button";
  }
  if (text.includes("라벨")) {
    return "label";
  }
  if (text.includes("폴리백") || text.includes("행택")) {
    return "package";
  }
  return "fabric";
}

function IconButton({
  label,
  symbol,
  danger = false,
  emphasized = false,
  caption
}: {
  label: string;
  symbol: string;
  danger?: boolean;
  emphasized?: boolean;
  caption?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} mock 동작`}
      style={[styles.iconButton, caption && styles.iconButtonCaption, emphasized && styles.iconEmphasized, danger && styles.iconDanger]}
    >
      <Text style={[styles.iconText, emphasized && styles.iconEmphasizedText, danger && styles.iconDangerText]}>{symbol}</Text>
      {caption ? (
        <Text style={[styles.iconCaptionText, emphasized && styles.iconEmphasizedText, danger && styles.iconDangerText]}>
          {caption}
        </Text>
      ) : null}
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

function progressStepTone(status: string) {
  if (status === "완료") {
    return styles.progressDotDone;
  }
  if (status === "작업중") {
    return styles.progressDotCurrent;
  }
  if (status === "준비") {
    return styles.progressDotWarning;
  }
  return styles.progressDotMuted;
}

function progressStatusText(status: string) {
  if (status === "완료") {
    return styles.progressStatusDone;
  }
  if (status === "준비") {
    return styles.progressStatusWarning;
  }
  return styles.progressStatusCurrent;
}

function progressStatusBadge(status: string) {
  if (status === "완료") {
    return styles.statusCompleted;
  }
  if (status === "작업중") {
    return styles.statusRequested;
  }
  return styles.statusReady;
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
    backgroundColor: "#f4efe6"
  },
  page: {
    alignSelf: "center",
    gap: 10,
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
    backgroundColor: "rgba(255, 250, 242, 0.72)",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  iconButtonCaption: {
    flexDirection: "row",
    gap: 3,
    height: 30,
    minWidth: 52,
    paddingHorizontal: 8,
    width: "auto"
  },
  iconDanger: {
    backgroundColor: "#fff0eb"
  },
  iconEmphasized: {
    backgroundColor: "#23375a"
  },
  iconText: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900"
  },
  iconCaptionText: {
    color: "#4f463f",
    fontSize: 10,
    fontWeight: "900"
  },
  iconEmphasizedText: {
    color: "#ffffff"
  },
  iconDangerText: {
    color: "#9a4035"
  },
  workbench: {
    gap: 10
  },
  workbenchWide: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14
  },
  listPane: {
    backgroundColor: "#f8f1e7",
    borderRadius: 12,
    gap: 8,
    padding: 10
  },
  listPaneTablet: {
    maxWidth: 292,
    minWidth: 276
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
    backgroundColor: "rgba(255, 252, 247, 0.78)",
    borderLeftColor: "transparent",
    borderLeftWidth: 3,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    padding: 9
  },
  listCardSelected: {
    backgroundColor: "#ffffff",
    borderLeftColor: "#23375a"
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
    backgroundColor: "#fffdf8",
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  headerTablet: {
    alignItems: "center"
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
    gap: 6
  },
  miniStat: {
    backgroundColor: "#f7f0e5",
    borderRadius: 9,
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
  garmentPreview: {
    alignItems: "center",
    backgroundColor: "#efe4d3",
    borderRadius: 12,
    height: 172,
    justifyContent: "center",
    minWidth: 132,
    overflow: "hidden",
    position: "relative",
    width: 148
  },
  garmentPreviewCompact: {
    height: 92,
    minWidth: 86,
    width: 92
  },
  hangerLine: {
    backgroundColor: "#8e7d68",
    borderRadius: 99,
    height: 2,
    position: "absolute",
    top: 22,
    width: "58%"
  },
  hangerHook: {
    borderColor: "#8e7d68",
    borderRadius: 10,
    borderWidth: 2,
    height: 14,
    position: "absolute",
    top: 12,
    width: 12
  },
  garmentShape: {
    backgroundColor: "#23375a",
    borderRadius: 16,
    height: "50%",
    marginTop: 12,
    position: "relative",
    width: "46%"
  },
  collarShape: {
    alignSelf: "center",
    backgroundColor: "#efe4d3",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    height: 18,
    width: 30
  },
  sleeveLeft: {
    backgroundColor: "#2d4369",
    borderRadius: 10,
    height: "50%",
    left: -22,
    position: "absolute",
    top: 14,
    transform: [{ rotate: "18deg" }],
    width: 26
  },
  sleeveRight: {
    backgroundColor: "#2d4369",
    borderRadius: 10,
    height: "50%",
    position: "absolute",
    right: -22,
    top: 14,
    transform: [{ rotate: "-18deg" }],
    width: 26
  },
  waistLine: {
    backgroundColor: "rgba(255, 250, 242, 0.36)",
    height: 2,
    marginTop: "auto",
    width: "100%"
  },
  fabricShadow: {
    backgroundColor: "rgba(40, 32, 24, 0.12)",
    borderRadius: 99,
    bottom: 32,
    height: 7,
    position: "absolute",
    width: "50%"
  },
  imageLabel: {
    bottom: 9,
    color: "#51483e",
    fontSize: 10,
    fontWeight: "900",
    left: 8,
    position: "absolute",
    right: 26
  },
  imageCount: {
    backgroundColor: "rgba(255, 250, 242, 0.86)",
    borderRadius: 999,
    bottom: 7,
    color: "#17263d",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
    right: 8
  },
  miniGarmentThumb: {
    alignItems: "center",
    backgroundColor: "#eadfce",
    borderRadius: 9,
    height: 58,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: 48
  },
  miniHangerLine: {
    backgroundColor: "#8e7d68",
    borderRadius: 99,
    height: 2,
    position: "absolute",
    top: 9,
    width: 26
  },
  miniGarmentBody: {
    backgroundColor: "#23375a",
    borderRadius: 7,
    height: 26,
    marginTop: 5,
    width: 24
  },
  miniCollar: {
    alignSelf: "center",
    backgroundColor: "#eadfce",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    height: 7,
    width: 12
  },
  miniThumbLabel: {
    bottom: 3,
    color: "#554b43",
    fontSize: 8,
    fontWeight: "900",
    position: "absolute"
  },
  swatchVisual: {
    backgroundColor: "#ded0bd",
    borderRadius: 9,
    flexShrink: 0,
    height: 46,
    overflow: "hidden",
    position: "relative",
    width: 46
  },
  swatchNavy: {
    backgroundColor: "#22375a"
  },
  swatchLining: {
    backgroundColor: "#cbb998"
  },
  swatchButton: {
    backgroundColor: "#6f5744"
  },
  swatchLabel: {
    backgroundColor: "#f4efe5"
  },
  swatchPackage: {
    backgroundColor: "#b9874e"
  },
  swatchFabric: {
    backgroundColor: "#d5c2a4"
  },
  swatchLine: {
    backgroundColor: "rgba(255, 255, 255, 0.32)",
    height: 2,
    position: "absolute",
    top: 13,
    width: "100%"
  },
  swatchLineShort: {
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    height: 2,
    position: "absolute",
    right: 0,
    top: 25,
    width: "70%"
  },
  swatchLayer: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    bottom: 0,
    height: 12,
    position: "absolute",
    width: "100%"
  },
  buttonDots: {
    alignSelf: "center",
    backgroundColor: "rgba(255, 250, 242, 0.72)",
    borderRadius: 99,
    height: 10,
    marginTop: 17,
    width: 10
  },
  swatchLabelText: {
    bottom: 4,
    color: "#332d28",
    fontSize: 8,
    fontWeight: "900",
    left: 3,
    position: "absolute",
    right: 3,
    textAlign: "center"
  },
  tabRail: {
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  tab: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    flexDirection: "row",
    gap: 5,
    minWidth: 70,
    paddingHorizontal: 3,
    paddingVertical: 8
  },
  tabSelected: {
    borderBottomColor: "#17263d"
  },
  tabText: {
    color: "#5d544b",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  tabTextSelected: {
    color: "#17263d"
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
    backgroundColor: "#fffdf8",
    borderRadius: 14,
    padding: 14
  },
  nextCheckPanel: {
    alignItems: "flex-start",
    borderRadius: 11,
    flexDirection: "row",
    gap: 10,
    marginBottom: 13,
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  nextCheckNeutral: {
    backgroundColor: "#f6efe5"
  },
  nextCheckWarning: {
    backgroundColor: "#fff1d3"
  },
  nextCheckReady: {
    backgroundColor: "#edf2e7"
  },
  nextCheckEyebrow: {
    backgroundColor: "#17263d",
    borderRadius: 999,
    color: "#ffffff",
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  nextCheckTitle: {
    color: "#17263d",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  nextCheckDetail: {
    color: "#5d544b",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2
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
  compactNotice: {
    backgroundColor: "#f6efe5",
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  compactNoticeText: {
    color: "#5d544b",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  overviewGrid: {
    gap: 10
  },
  overviewGridTablet: {
    alignItems: "stretch",
    flexDirection: "row"
  },
  summaryList: {
    gap: 2
  },
  costList: {
    borderTopColor: "#eee3d5",
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 4
  },
  metricLine: {
    alignItems: "center",
    borderBottomColor: "#f0e7dc",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingVertical: 8
  },
  metricLineCompact: {
    paddingVertical: 7
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
  imageGrid: {
    gap: 9
  },
  imageGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  imageTile: {
    backgroundColor: "#fffaf2",
    borderRadius: 12,
    flexGrow: 1,
    gap: 7,
    minWidth: 148,
    padding: 8
  },
  imageTileSelected: {
    backgroundColor: "#fff4df"
  },
  imageTileVisualWrap: {
    position: "relative"
  },
  imageTapHint: {
    backgroundColor: "rgba(23, 38, 61, 0.72)",
    borderRadius: 999,
    bottom: 6,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: "absolute",
    right: 6
  },
  actionCluster: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 6,
    justifyContent: "flex-end"
  },
  crownBadge: {
    backgroundColor: "#c75f35",
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: "absolute",
    right: 6,
    top: 6
  },
  subsection: {
    marginTop: 12
  },
  memoFieldMock: {
    backgroundColor: "#fffaf2",
    borderColor: "#eadfce",
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginTop: 12,
    padding: 10
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
  sectionActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 10
  },
  sectionTitleWithActions: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  headerAddButton: {
    alignItems: "center",
    backgroundColor: "#23375a",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    marginTop: 2,
    width: 34
  },
  headerAddButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22
  },
  addChip: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: "#23375a",
    borderRadius: 999,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  addChipSymbol: {
    color: "#23375a",
    fontSize: 13,
    fontWeight: "900"
  },
  addChipText: {
    color: "#23375a",
    fontSize: 11,
    fontWeight: "900"
  },
  quantityCheck: {
    backgroundColor: "#f6efe5",
    borderRadius: 10,
    gap: 3,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  quantityCheckTitle: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900"
  },
  quantityCheckText: {
    color: "#5d544b",
    fontSize: 12,
    lineHeight: 17
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
  templateStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 10
  },
  templateChip: {
    backgroundColor: "#f7f0e5",
    borderColor: "#eadfce",
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  templateChipSelected: {
    backgroundColor: "#23375a",
    borderColor: "#23375a"
  },
  templateTitle: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900"
  },
  templateTitleSelected: {
    color: "#ffffff"
  },
  templateDetail: {
    color: "#6d6257",
    fontSize: 10,
    fontWeight: "700"
  },
  templateDetailSelected: {
    color: "#f8efe2"
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
    backgroundColor: "#fffaf2",
    borderRadius: 10,
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
    gap: 6,
    marginBottom: 6
  },
  inlineMetric: {
    backgroundColor: "#f7f0e5",
    borderRadius: 999,
    color: "#64584c",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  progressBlock: {
    backgroundColor: "#fffaf2",
    borderColor: "#eadfce",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10
  },
  progressHeader: {
    gap: 3,
    marginBottom: 8
  },
  progressRail: {
    alignItems: "flex-start",
    gap: 0,
    justifyContent: "space-between",
    minWidth: "100%",
    paddingBottom: 4
  },
  progressStep: {
    flex: 1,
    minWidth: 74,
    paddingRight: 8
  },
  progressTopLine: {
    alignItems: "center",
    flexDirection: "row",
    height: 18
  },
  progressDot: {
    borderRadius: 999,
    height: 12,
    width: 12
  },
  progressDotDone: {
    backgroundColor: "#4d6a3a"
  },
  progressDotCurrent: {
    backgroundColor: "#c75f35"
  },
  progressDotWarning: {
    backgroundColor: "#dfad45"
  },
  progressDotMuted: {
    backgroundColor: "#c9bba8"
  },
  progressConnector: {
    backgroundColor: "#dfd3c3",
    flex: 1,
    height: 2,
    marginLeft: 5
  },
  progressShort: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5
  },
  progressStatus: {
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 14,
    marginTop: 2
  },
  progressStatusDone: {
    color: "#4d6a3a"
  },
  progressStatusCurrent: {
    color: "#9b4a27"
  },
  progressStatusWarning: {
    color: "#8a5d12"
  },
  progressDetailList: {
    borderTopColor: "#eee3d5",
    borderTopWidth: 1,
    marginTop: 9
  },
  progressDetailRow: {
    borderBottomColor: "#f0e7dc",
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 9
  },
  progressDetailHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  flowSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4
  },
  processSectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 4
  },
  advancedFlowHint: {
    color: "#7a6c5c",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginBottom: 2
  },
  dataRow: {
    borderTopColor: "#f0e7dc",
    borderTopWidth: 1,
    gap: 7,
    paddingVertical: 11
  },
  lockedRow: {
    opacity: 0.82
  },
  rowHead: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
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
  statusLine: {
    color: "#9b4a27",
    fontSize: 12,
    fontWeight: "900",
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
    flexWrap: "wrap",
    gap: 6
  },
  materialFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  inlineEditHint: {
    borderBottomColor: "#b98c5a",
    borderBottomWidth: 1,
    color: "#7b4b32",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 16
  },
  inlineEditHintLocked: {
    borderBottomColor: "transparent",
    color: "#6d6257"
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
    backgroundColor: "#fffaf2",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    padding: 9
  },
  documentWorkbench: {
    backgroundColor: "#fffaf2",
    borderColor: "#eadfce",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 10
  },
  documentList: {
    borderBottomColor: "#eee3d5",
    borderBottomWidth: 1,
    gap: 6,
    paddingBottom: 9
  },
  documentListRow: {
    backgroundColor: "#f7f0e5",
    borderLeftColor: "transparent",
    borderLeftWidth: 3,
    borderRadius: 9,
    gap: 2,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  documentListRowSelected: {
    backgroundColor: "#ffffff",
    borderLeftColor: "#23375a"
  },
  documentPreviewSheet: {
    backgroundColor: "#ffffff",
    borderColor: "#d9d0c2",
    borderRadius: 9,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  documentPreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  documentPreviewTitle: {
    color: "#17263d",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23
  },
  documentPreviewGrid: {
    borderTopColor: "#eee3d5",
    borderTopWidth: 1
  },
  documentMemoBox: {
    backgroundColor: "#f7f0e5",
    borderRadius: 8,
    gap: 4,
    padding: 9
  },
  documentSidePanel: {
    gap: 8
  },
  deliverySummaryBox: {
    borderTopColor: "#eee3d5",
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 8
  },
  documentActionBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
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
