import { type ReactNode, useMemo, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  ClipboardList,
  ClipboardCheck,
  Crown,
  Eye,
  FileCheck,
  FileText,
  FileUp,
  FolderOpen,
  Image as ImageIcon,
  MoreHorizontal,
  Palette,
  Paperclip,
  Plus,
  Printer,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Settings,
  Share2,
  Trash2,
  X,
  type LucideIcon
} from "lucide-react-native";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput,
  type TextProps,
  type TextStyle,
  View,
  useWindowDimensions
} from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { MOBILE_APP_VERSION } from "@/constants/version";
import { openIssuedPreview, type PreviewIdentity } from "@/utils/previewLink";
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
  type ProgressStep,
  type ProductionTabId
} from "@/constants/mockProductionCard";

const maxPhoneWidth = 520;
const maxTabletWidth = 1040;
const progressStepWidth = 88;

type WorkOrderState = "ready" | "issued";

function Text({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = getA2zFontFamily(flattened?.fontWeight);

  return <NativeText {...props} style={[{ fontFamily }, style]} />;
}

function getA2zFontFamily(fontWeight: TextStyle["fontWeight"] | undefined) {
  const weight = typeof fontWeight === "number" ? fontWeight : Number.parseInt(String(fontWeight ?? ""), 10);

  if (weight >= 900) {
    return WAFL_FONTS.bold;
  }
  if (weight >= 700) {
    return WAFL_FONTS.semibold;
  }
  if (weight >= 500) {
    return WAFL_FONTS.medium;
  }
  return WAFL_FONTS.body;
}

const workOrderChecks = [
  "대표 이미지 있음",
  "총 수량 360벌",
  "색상/사이즈 수량 일치",
  "원단 4건",
  "부자재 4건",
  "납기 2026.08.20",
  "포함 첨부 2건"
];

export default function ProductionCardMock() {
  const [activeTab, setActiveTab] = useState<ProductionTabId>("overview");
  const [selectedCardId, setSelectedCardId] = useState(productionCards[0].id);
  const [workOrderIssued, setWorkOrderIssued] = useState(true);
  const [orderConfirmOpen, setOrderConfirmOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 760;
  const isWideTablet = isTablet && width > height;
  const contentWidth = useMemo(
    () => Math.min(Math.max(width - 24, 320), isTablet ? maxTabletWidth : maxPhoneWidth),
    [isTablet, width]
  );
  const selectedWorkOrderIssued = workOrderIssued && selectedCardId === productionCards[0].id;
  const previewIdentity: PreviewIdentity = {
    issued: selectedWorkOrderIssued,
    issuedDocumentNumber: selectedCardId === productionCards[0].id ? productionCardMock.issuedDocumentNumber : null
  };
  const openPreview = async () => {
    setPreviewMessage(null);
    const result = await openIssuedPreview(previewIdentity);
    if (!result.ok) setPreviewMessage(result.message);
  };

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
            <ProductionHeader
              isTablet={isTablet}
              workOrderState={selectedWorkOrderIssued ? "issued" : "ready"}
              onOpenOrderConfirm={() => setOrderConfirmOpen(true)}
              onOpenPreview={openPreview}
            />
            {previewMessage ? <Text accessibilityLiveRegion="polite" style={styles.previewMessage}>{previewMessage}</Text> : null}
            {orderConfirmOpen ? (
              <WorkOrderConfirmPanel
                onClose={() => setOrderConfirmOpen(false)}
                onComplete={() => {
                  setWorkOrderIssued(true);
                  setOrderConfirmOpen(false);
                }}
                onPreview={openPreview}
                previewAvailable={previewIdentity.issued && Boolean(previewIdentity.issuedDocumentNumber)}
              />
            ) : null}
            <TabRail activeTab={activeTab} setActiveTab={setActiveTab} isTablet={isTablet} />
            <View style={styles.section}>
              <NextCheckPanel activeTab={activeTab} />
              {renderActiveTab(activeTab, isTablet, selectedWorkOrderIssued, openPreview, previewIdentity.issued)}
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
        <IconButton label="검색" icon="search" />
        <IconButton label="알림" icon="bell" />
        <IconButton label="더보기" icon="more" />
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
      <ProductionCardSearchMock />
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

function ProductionCardSearchMock() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="제작 카드 목록 검색 mock 열기"
      style={styles.listSearchField}
    >
      <IconMark icon="search" />
      <Text style={styles.listSearchPlaceholder}>제품명 · 스타일명 · 공장/거래처 · 납기 · 상태 검색</Text>
    </Pressable>
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

function ProductionHeader({
  isTablet,
  workOrderState,
  onOpenOrderConfirm,
  onOpenPreview
}: {
  isTablet: boolean;
  workOrderState: WorkOrderState;
  onOpenOrderConfirm: () => void;
  onOpenPreview: () => void;
}) {
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
          <WorkOrderStatusCard
            state={workOrderState}
            onPress={workOrderState === "issued" ? onOpenPreview : onOpenOrderConfirm}
          />
        </View>
      </View>
    </View>
  );
}

function WorkOrderStatusCard({
  state,
  onPress
}: {
  state: WorkOrderState;
  onPress: () => void;
}) {
  const issued = state === "issued";
  return (
    <View style={[styles.workOrderCard, issued && styles.workOrderCardIssued]}>
      <View style={styles.workOrderStatusRow}>
        <Text style={styles.miniLabel}>문서</Text>
        <Text style={[styles.workOrderStatus, issued && styles.workOrderStatusIssued]}>
          {issued ? "작지 발주 완료" : "작지 발주 가능"}
        </Text>
      </View>
      <Text style={styles.workOrderDetail}>
        {issued ? "발주 완료 후 주요 정보 잠금 예정" : "확인 필요 0건 · 출력 전 확인"}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={issued ? "발행된 작업지시서 미리보기" : "작업지시서 발주 확인 열기"}
        accessibilityHint={issued ? "웹 작업지시서 미리보기를 엽니다" : undefined}
        onPress={onPress}
        style={[styles.workOrderButton, issued && styles.workOrderButtonIssued]}
      >
        <IconMark icon={issued ? "fileText" : "clipboardCheck"} emphasized={!issued} />
        <Text style={[styles.workOrderButtonText, issued && styles.workOrderButtonTextIssued]}>
          {issued ? "작지 보기" : "작지 발주"}
        </Text>
      </Pressable>
    </View>
  );
}

function WorkOrderConfirmPanel({
  onClose,
  onComplete,
  onPreview,
  previewAvailable
}: {
  onClose: () => void;
  onComplete: () => void;
  onPreview: () => void;
  previewAvailable: boolean;
}) {
  return (
    <View style={styles.workOrderConfirmPanel}>
      <View style={styles.workOrderConfirmHeader}>
        <View style={styles.flex}>
          <Text style={styles.subsectionTitle}>작지 발주 전 확인</Text>
          <Text style={styles.smallText}>실제 출력, 공유, 저장 없이 화면 상태만 바꾸는 mock 확인 sheet입니다.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="작지 발주 확인 닫기 mock" onPress={onClose} style={styles.confirmCloseButton}>
          <IconMark icon="x" />
        </Pressable>
      </View>
      <View style={styles.confirmCheckGrid}>
        {workOrderChecks.map((item) => (
          <View key={item} style={styles.confirmCheckItem}>
            <IconMark icon="check" />
            <Text style={styles.confirmCheckText}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.confirmLockNotice}>
        <Text style={styles.infoLabel}>발주 완료 후</Text>
        <Text style={styles.infoValue}>주요 제작 정보는 잠금 예정입니다. 수정이 필요하면 발주 취소, 정정, 재발주 흐름으로 이어지는 방향만 mock으로 표시합니다.</Text>
      </View>
      <View style={styles.confirmActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="발행된 작업지시서 미리보기"
          accessibilityHint={previewAvailable ? "웹 작업지시서 미리보기를 엽니다" : "발행 후 사용할 수 있습니다"}
          accessibilityState={{ disabled: !previewAvailable }}
          disabled={!previewAvailable}
          onPress={onPreview}
          style={[styles.secondaryConfirmButton, !previewAvailable && styles.disabledAction]}
        >
          <IconMark icon="eye" />
          <Text style={styles.secondaryConfirmButtonText}>미리보기</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="작지 출력 및 발주 완료 mock" onPress={onComplete} style={styles.primaryConfirmButton}>
          <IconMark icon="fileCheck" emphasized />
          <Text style={styles.primaryConfirmButtonText}>작지 출력 및 발주 완료</Text>
        </Pressable>
      </View>
      {!previewAvailable ? <Text style={styles.disabledReason}>발행된 작업지시서에서 미리보기를 사용할 수 있습니다.</Text> : null}
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
    <View style={styles.tabRailFrame}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabRail, isTablet ? styles.tabRailTablet : styles.tabRailMobile]}
      >
      {PRODUCTION_TABS.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} 보기`}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, isTablet ? styles.tabTablet : styles.tabMobile, selected && styles.tabSelected]}
          >
            <View style={styles.tabInner}>
              <View style={styles.tabLabelRow}>
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                  {isTablet ? tab.label : tab.shortLabel}
                </Text>
                {tab.alertCount ? <Text style={styles.tabAlert}>{tab.alertCount}</Text> : null}
              </View>
              <View style={[styles.tabUnderline, selected && styles.tabUnderlineSelected]} />
            </View>
          </Pressable>
        );
      })}
      </ScrollView>
    </View>
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

function renderActiveTab(
  activeTab: ProductionTabId,
  isTablet: boolean,
  workOrderIssued: boolean,
  onOpenPreview: () => void,
  previewAvailable: boolean
) {
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
      return <FlowTab workOrderIssued={workOrderIssued} />;
    case "output":
      return <OutputTab onOpenPreview={onOpenPreview} previewAvailable={previewAvailable} />;
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
  const [activeImageIndex, setActiveImageIndex] = useState(2);
  const activeImage = imageMocks[activeImageIndex];
  const totalImages = imageMocks.length;
  const imageTitle = getImageDisplayTitle(activeImage, activeImageIndex);
  const hasImageTitle = activeImage.title.trim().length > 0;
  const moveImage = (direction: -1 | 1) => {
    setActiveImageIndex((current) => (current + direction + totalImages) % totalImages);
  };

  return (
    <View>
      <SectionTitle
        title="이미지·첨부"
        caption="대표 이미지를 중심으로 넘겨 보며, 제목은 선택 입력입니다. 첫 이미지는 자동 대표가 되는 mock입니다."
      />
      <SectionActionRow>
        <IconButton label="사진 선택 mock" icon="photo" caption="사진" />
        <IconButton label="카메라 촬영 mock" icon="camera" caption="카메라" />
        <IconButton label="스케치 열기 mock" icon="sketch" caption="스케치" />
        <IconButton label="첨부파일 추가 mock" icon="clip" caption="첨부" />
      </SectionActionRow>
      <View style={styles.compactNotice}>
        <Text style={styles.compactNoticeText}>첫 이미지는 자동 대표 · 현재 이미지 {activeImageIndex + 1} / {totalImages}</Text>
      </View>
      <View style={[styles.imageCarouselCard, isTablet && styles.imageCarouselCardTablet]}>
        <Text style={styles.imageIndexFloating}>{activeImageIndex + 1} / {totalImages}</Text>
        <View style={styles.imageCarouselTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 이미지 보기 mock 동작"
            onPress={() => moveImage(-1)}
            style={styles.imageNavButton}
          >
            <Text style={styles.imageNavText}>{"<"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${imageTitle} 이미지 상세보기 mock 동작`}
            style={styles.imageHeroPress}
          >
            <GarmentPreview label={activeImage.kind} />
            {activeImage.selected ? <Text style={styles.crownBadge}>대표</Text> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 이미지 보기 mock 동작"
            onPress={() => moveImage(1)}
            style={styles.imageNavButton}
          >
            <Text style={styles.imageNavText}>{">"}</Text>
          </Pressable>
        </View>
        <View style={styles.imageCaptionRow}>
          {hasImageTitle ? (
            <View style={styles.imageTitleLine}>
              <Text style={styles.rowTitle}>{imageTitle}</Text>
              <Text style={styles.optionalMark}>제목 선택</Text>
            </View>
          ) : (
            <Text style={styles.imageFallbackLabel}>{imageTitle}</Text>
          )}
        </View>
        <ActionCluster>
          <IconButton label={activeImage.selected ? "대표 이미지" : "대표로 선택"} icon="crown" caption={activeImage.selected ? "대표" : "지정"} />
          <IconButton label="삭제 예정" icon="delete" danger caption="삭제" />
        </ActionCluster>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStrip}>
          {imageMocks.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}번째 이미지 선택 mock 동작`}
              onPress={() => setActiveImageIndex(index)}
              style={[styles.thumbnailDot, index === activeImageIndex && styles.thumbnailDotActive]}
            >
              <Text style={[styles.thumbnailDotText, index === activeImageIndex && styles.thumbnailDotTextActive]}>
                {index + 1}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>첨부파일 목록</Text>
        {attachmentRows.map((item) => (
          <View key={item.title} style={styles.attachmentRow}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDetail}>
                {item.detail} · {item.included ? "출력 포함" : "출력 제외"}
              </Text>
              <Text style={styles.smallText}>업로드 {item.uploadedAt}</Text>
            </View>
            <IconButton label="첨부 삭제 예정" icon="delete" danger />
          </View>
        ))}
      </View>
      <View style={styles.memoFieldMock}>
        <Text style={styles.infoLabel}>공장 전달 메모</Text>
        <Text style={styles.infoValue}>워싱 강도와 라벨 위치는 공장 전달 전에 여기에서 수정합니다.</Text>
        <Text style={styles.smallText}>완료 전 수정 가능 · 완료 후 잠금 예정 · 관리자 알림은 이후 구현</Text>
      </View>
      <TextInput
        accessibilityLabel="공장 전달 메모"
        defaultValue={productionCardMock.memo}
        multiline
        placeholder="공장에 전달할 핵심 작업 지시와 주의사항"
        style={styles.factoryInstructionInput}
      />
    </View>
  );
}

function SizesTab({ isTablet }: { isTablet: boolean }) {
  const [unitMode, setUnitMode] = useState<"cm" | "inch">("cm");
  const unitSuffix = unitMode === "cm" ? "cm" : "inch";
  const currentTemplate = sizeTemplates.find((template) => template.selected) ?? sizeTemplates[0];

  return (
    <View>
      <SectionTitle
        title="사이즈·색상"
        caption="현재 선택값을 먼저 보여주고, 변경 후보는 작은 선택 패널로만 보여주는 mock입니다."
      />
      <View style={styles.quantityCheck}>
        <Text style={styles.quantityCheckTitle}>색상별 수량 합계</Text>
        <Text style={styles.quantityCheckText}>총 360벌</Text>
      </View>
      <View style={styles.selectorGrid}>
        <CurrentValueSelector selectorKind="gender" label="성별" value="공용" options={["공용", "여성", "남성"]} />
        <CurrentValueSelector selectorKind="category" label="품목" value="상의" options={["상의", "하의", "아우터"]} />
        <CurrentValueSelector
          selectorKind="unit"
          label="단위"
          value={unitMode}
          options={["cm", "inch"]}
          onSelect={(value) => setUnitMode(value === "inch" ? "inch" : "cm")}
        />
      </View>
      <View style={styles.currentTemplatePanel}>
        <View style={styles.flex}>
          <Text style={styles.infoLabel}>현재 구성</Text>
          <Text style={styles.infoValue}>{currentTemplate.productType}</Text>
          <Text style={styles.smallText}>{currentTemplate.fields.join(" · ")} · 목록은 불러오기 패널에서 선택</Text>
        </View>
      </View>
      <View style={styles.splitActionRow}>
        <View style={styles.actionGroupLeft}>
          <AddChip label="불러오기" icon="folder" />
          <AddChip label="현재 구성 저장" icon="save" />
        </View>
        <View style={styles.actionGroupRight}>
          <AddChip label="사이즈 추가" icon="rowAdd" />
          <AddChip label="부위 추가" icon="measure" />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.sizeTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellStrong}>사이즈</Text>
            <Text style={styles.tableCell}>가슴</Text>
            <Text style={styles.tableCell}>총장</Text>
            <Text style={styles.tableCell}>어깨</Text>
            <Text style={styles.tableCell}>소매</Text>
          </View>
          {sizeRows.map((row) => (
            <View key={row.size} style={styles.tableRow}>
              <Text style={styles.tableCellStrong}>{row.size}</Text>
              <Text style={styles.tableCell}>{unitMode === "cm" ? row.chestCm : row.chestIn} {unitSuffix}</Text>
              <Text style={styles.tableCell}>{unitMode === "cm" ? row.lengthCm : row.lengthIn} {unitSuffix}</Text>
              <Text style={styles.tableCell}>{unitMode === "cm" ? row.shoulderCm : row.shoulderIn} {unitSuffix}</Text>
              <Text style={styles.tableCell}>{unitMode === "cm" ? row.sleeveCm : row.sleeveIn} {unitSuffix}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.colorGrid, isTablet && styles.colorGridTablet]}>
        {colorRows.map((row) => (
          <View key={row.color} style={styles.colorRow}>
            <View style={styles.colorTitleRow}>
              <View style={[styles.colorSwatch, colorSwatchStyle(row.swatch)]} />
              <Text style={styles.colorChip}>{row.color}</Text>
            </View>
            <Text style={styles.rowTitle}>{row.quantity}</Text>
            <Text style={styles.smallText}>{row.note}</Text>
          </View>
        ))}
        <AddChip label="색상 추가" icon="swatchAdd" />
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
  const inputCount = rows.filter((row) => row.status === "입력중").length;
  const requested = rows.filter((row) => row.status === "발주요청").length;
  const completed = rows.filter((row) => row.status === "완료").length;

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
        <Text style={styles.inlineMetric}>입력중 {inputCount}건</Text>
        <Text style={styles.inlineMetric}>발주요청 {requested}건</Text>
        <Text style={styles.inlineMetric}>완료 {completed}건</Text>
      </View>
      {rows.map((row) => (
        <MaterialRow key={row.name} row={row} />
      ))}
    </View>
  );
}

function ProgressRail({ workOrderIssued }: { workOrderIssued: boolean }) {
  const displaySteps = getDisplayProgressSteps(workOrderIssued);

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.subsectionTitle}>기본 제작 플로우 6단계</Text>
        <Text style={styles.smallText}>발주 · 자재 · 재단 · 공정 · 검수 · 출고를 준비/작업중/완료로만 표시합니다.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.progressRail}>
        <View style={[styles.progressRailTrack, { width: displaySteps.length * progressStepWidth }]}>
          <View style={styles.progressContinuousLine} />
          {displaySteps.map((step) => {
            const current = isCurrentProgressStep(step.status);
            return (
            <View key={step.id} style={[styles.progressStep, current && styles.progressStepCurrent]}>
              <View style={styles.progressTopLine}>
                <View style={[styles.progressDot, progressStepTone(step.status), current && styles.progressDotCurrentRing]} />
              </View>
              <Text style={[styles.progressShort, current && styles.progressShortCurrent]}>{step.shortLabel}</Text>
              <Text style={[styles.progressStatus, progressStatusText(step.status), current && styles.progressStatusCurrentPill]}>{step.status}</Text>
            </View>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.progressCompactNote}>
        <Text style={styles.rowDetail}>기본 플로우는 작업 흐름 요약입니다.</Text>
        <Text style={styles.smallText}>업체별 상세 관리는 아래 공정 상세에서 정리합니다.</Text>
      </View>
    </View>
  );
}

function FlowTab({ workOrderIssued }: { workOrderIssued: boolean }) {
  return (
    <View>
      <SectionTitle
        title="제작 플로우"
        caption="기본 단계는 유지하되 재단은 삭제 가능하고, 공정 안에는 봉제·나염·라벨 같은 내부 공정을 추가하는 구조입니다."
      />
      <ProgressRail workOrderIssued={workOrderIssued} />
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
        <ProcessDetailRow key={row.process} row={row} index={index} />
      ))}
    </View>
  );
}

function DocumentWorkbench({
  included,
  onOpenPreview,
  previewAvailable
}: {
  included: typeof attachmentRows;
  onOpenPreview: () => void;
  previewAvailable: boolean;
}) {
  const selectedDocument = outputRows[0];
  const primaryDelivery = deliveryRows[0];

  return (
    <View style={styles.documentWorkbench}>
      <View style={styles.documentList}>
        {outputRows.map((row, index) => (
          <Pressable
            key={row.title}
            accessibilityRole={index === 0 ? "button" : undefined}
            accessibilityLabel={index === 0 ? "작업지시서 미리보기" : undefined}
            accessibilityState={index === 0 ? { disabled: !previewAvailable } : undefined}
            disabled={index !== 0 || !previewAvailable}
            onPress={index === 0 ? onOpenPreview : undefined}
            style={[styles.documentListRow, index === 0 && styles.documentListRowSelected, index === 0 && !previewAvailable && styles.disabledAction]}
          >
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.smallText}>{row.state}</Text>
          </Pressable>
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
          <IconButton label="보기" icon="eye" onPress={onOpenPreview} disabled={!previewAvailable} mock={false} />
          <IconButton label="공유" icon="share" disabled />
          <IconButton label="인쇄" icon="printer" disabled />
          <IconButton label="저장" icon="save" disabled />
        </View>
        {!previewAvailable ? <Text style={styles.disabledReason}>발행된 문서에서 보기 기능을 사용할 수 있습니다.</Text> : null}
      </View>
    </View>
  );
}

function OutputTab({ onOpenPreview, previewAvailable }: { onOpenPreview: () => void; previewAvailable: boolean }) {
  const included = attachmentRows.filter((item) => item.included);

  return (
    <View>
      <SectionTitle
        title="제작 문서"
        caption="문서 선택, 포함 항목, 공유 설정을 한 곳에서 확인합니다. 실제 PDF 생성과 공유는 연결하지 않습니다."
      />
      <DocumentWorkbench included={included} onOpenPreview={onOpenPreview} previewAvailable={previewAvailable} />
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
            <IconButton label="배송요청 저장" icon="save" />
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
  const actions = getMaterialActions(row);
  const locked = row.status !== "입력중";
  const editable = row.status === "입력중";

  return (
    <View style={[styles.dataRow, materialRowStateStyle(row.status), locked && styles.lockedRow, row.status === "완료" && styles.completedRow]}>
      <View style={styles.rowHead}>
        <SwatchVisual tone={getMaterialTone(row)} label={row.category} />
        <View style={styles.flex}>
          <Text style={styles.rowTitle}>{row.name}</Text>
          <Text style={styles.rowDetail}>{row.category ? `${row.category} · ` : ""}{editable ? "거래처·수량 확인" : "발주 정보 고정"}</Text>
        </View>
        <Text style={[styles.rowBadge, styles.materialStatusBadge, statusBadgeStyle(row.status)]}>{row.status}</Text>
      </View>
      <View style={styles.materialSummaryStrip}>
        <SummaryToken label="거래처" value={row.supplier} editable={editable} />
        <SummaryToken label="색상/옵션" value={row.colorOrOption} editable={editable} />
        <SummaryToken label="필요" value={row.required} editable={editable} />
        <SummaryToken label="로스/여유" value={row.allowance} editable={editable} />
        <SummaryToken label="재고" value={row.stockUse} editable={editable} />
        <SummaryToken label="단위" value={row.unit} editable={editable} compact />
      </View>
      <View style={styles.materialMetaLine}>
        <Text style={styles.rowMeta}>
          발주 {row.orderQuantity} · 단가 {row.unitPrice} · 금액 {row.amount}
        </Text>
        {actions.length ? (
          <View style={styles.materialActionInline}>
            {actions.map((action) => (
              <IconButton
                key={action.caption}
                label={`${action.label} mock`}
                icon={action.icon}
                caption={action.caption}
                emphasized={action.emphasized}
                danger={action.danger}
                action
              />
            ))}
          </View>
        ) : null}
      </View>
      <Text style={[styles.materialNote, editable && styles.materialNoteEditable]}>
        {row.leftover} · {row.warning}
      </Text>
      {row.usageArea ? <Text style={styles.instructionSummary}>사용 부위 · {row.usageArea}</Text> : null}
      {editable ? <TextInput accessibilityLabel={`${row.name} 사용 부위`} defaultValue={row.usageArea} multiline placeholder="예: 앞판·뒷판 몸판, 소매 안쪽, 칼라 겉면" style={styles.compactInstructionInput} /> : null}
    </View>
  );
}

function SummaryToken({
  label,
  value,
  editable,
  compact = false
}: {
  label: string;
  value: string;
  editable: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.summaryToken, compact && styles.summaryTokenCompact]}>
      <Text style={styles.summaryTokenLabel}>{label}</Text>
      <Text style={[styles.summaryTokenValue, editable && styles.summaryTokenValueEditable]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ProcessDetailRow({ row, index }: { row: (typeof processRows)[number]; index: number }) {
  const editable = row.status !== "완료";

  return (
    <View style={styles.processRow}>
      <Text style={styles.dragHandle}>{index + 1}</Text>
      <View style={styles.flex}>
        <View style={styles.rowHead}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{row.process}</Text>
            <Text style={styles.rowDetail}>{row.partner}</Text>
          </View>
          <Text style={[styles.rowBadge, progressStatusBadge(row.status)]}>{row.status}</Text>
        </View>
        <View style={styles.processMetaStrip}>
          <SummaryToken label="수량" value={row.quantity} editable={editable} compact />
          <SummaryToken label="납기" value={row.dueDate} editable={editable} compact />
          <SummaryToken label="단가" value={row.unitPrice} editable={editable} compact />
          <SummaryToken label="단위" value={row.unit} editable={editable} compact />
        </View>
        <Text style={styles.processMemo}>{row.memo}</Text>
        {row.applicationArea ? <Text style={styles.instructionSummary}>적용 부위 · {row.applicationArea}</Text> : null}
        {row.applicationColorTarget ? <Text style={styles.instructionSummary}>적용 색상·대상 · {row.applicationColorTarget}</Text> : null}
        {editable ? <TextInput accessibilityLabel={`${row.process} 적용 부위`} defaultValue={row.applicationArea} multiline placeholder="예: 앞판 중앙, 소매 끝단, 완제품 전체" style={styles.compactInstructionInput} /> : null}
        {editable ? <TextInput accessibilityLabel={`${row.process} 적용 색상 대상`} defaultValue={row.applicationColorTarget} multiline placeholder="예: NAVY·BLACK, IVORY 제외, 전 색상 공통" style={styles.compactInstructionInput} /> : null}
        <Text style={styles.rowMeta}>금액 {row.amount}</Text>
      </View>
    </View>
  );
}

type MaterialAction = {
  label: string;
  icon: IconKind;
  caption: string;
  emphasized?: boolean;
  danger?: boolean;
};

function getMaterialActions(row: MaterialRowData): MaterialAction[] {
  if (row.status === "완료") {
    return [];
  }
  if (row.status === "발주요청") {
    return [
      { label: "발주 완료 처리", icon: "check", caption: "완료", emphasized: true },
      { label: "발주 요청 취소", icon: "undo", caption: "취소" },
      { label: "삭제 예정", icon: "delete", caption: "삭제", danger: true }
    ];
  }
  return [
    { label: "발주 요청", icon: "requestDoc", caption: "발주", emphasized: true },
    { label: "삭제 예정", icon: "delete", caption: "삭제", danger: true }
  ];
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
      <IconMark icon="plus" emphasized />
    </Pressable>
  );
}

function AddChip({ label, icon }: { label: string; icon: IconKind }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} mock 동작`} style={styles.addChip}>
      <IconMark icon={icon} />
      <Text style={styles.addChipText}>{label}</Text>
    </Pressable>
  );
}

function CurrentValueSelector({
  selectorKind,
  label,
  value,
  options,
  onSelect
}: {
  selectorKind: "gender" | "category" | "unit";
  label: string;
  value: string;
  options: string[];
  onSelect?: (value: string) => void;
}) {
  const nextValue = options[(options.indexOf(value) + 1) % options.length] ?? value;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} 현재값 ${value}. 선택 패널 열기 mock`}
      onPress={() => onSelect?.(nextValue)}
      style={[styles.currentSelector, selectorWidthStyle(selectorKind)]}
    >
      <Text style={styles.currentSelectorLabel}>{label}</Text>
      <View style={styles.currentSelectorValueRow}>
        <Text style={styles.currentSelectorValue}>{value}</Text>
        <Text style={styles.currentSelectorChevron}>▾</Text>
      </View>
    </Pressable>
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
  icon,
  danger = false,
  emphasized = false,
  caption,
  action = false,
  onPress,
  disabled = false,
  mock = true
}: {
  label: string;
  symbol?: string;
  icon?: IconKind;
  danger?: boolean;
  emphasized?: boolean;
  caption?: string;
  action?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  mock?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={mock ? `${label} mock 동작` : label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.iconButton,
        caption && styles.iconButtonCaption,
        action && styles.iconActionButton,
        emphasized && styles.iconEmphasized,
        action && emphasized && styles.iconActionEmphasized,
        danger && styles.iconDanger,
        action && danger && styles.iconActionDanger,
        disabled && styles.disabledAction
      ]}
    >
      {icon ? (
        <IconMark icon={icon} emphasized={emphasized} danger={danger} />
      ) : (
        <Text style={[styles.iconText, emphasized && styles.iconEmphasizedText, danger && styles.iconDangerText]}>{symbol}</Text>
      )}
      {caption ? (
        <Text style={[styles.iconCaptionText, emphasized && styles.iconEmphasizedText, danger && styles.iconDangerText]}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
}

type IconKind =
  | "photo"
  | "camera"
  | "sketch"
  | "clip"
  | "crown"
  | "folder"
  | "save"
  | "rowAdd"
  | "measure"
  | "swatchAdd"
  | "requestDoc"
  | "cards"
  | "clipboardCheck"
  | "fileCheck"
  | "fileText"
  | "eye"
  | "share"
  | "printer"
  | "plus"
  | "search"
  | "bell"
  | "more"
  | "settings"
  | "undo"
  | "check"
  | "delete"
  | "x";

const iconMap: Record<IconKind, LucideIcon> = {
  photo: ImageIcon,
  camera: Camera,
  sketch: Palette,
  clip: Paperclip,
  crown: Crown,
  folder: FolderOpen,
  save: Save,
  rowAdd: Plus,
  measure: Ruler,
  swatchAdd: Palette,
  requestDoc: FileUp,
  cards: ClipboardList,
  clipboardCheck: ClipboardCheck,
  fileCheck: FileCheck,
  fileText: FileText,
  eye: Eye,
  share: Share2,
  printer: Printer,
  plus: Plus,
  search: Search,
  bell: Bell,
  more: MoreHorizontal,
  settings: Settings,
  undo: RotateCcw,
  check: Check,
  delete: Trash2,
  x: X
};

function IconMark({
  icon,
  emphasized = false,
  danger = false,
  selected = false
}: {
  icon: IconKind;
  emphasized?: boolean;
  danger?: boolean;
  selected?: boolean;
}) {
  return <WaflIcon icon={icon} emphasized={emphasized} danger={danger} selected={selected} />;
}

function WaflIcon({
  icon,
  emphasized = false,
  danger = false,
  selected = false
}: {
  icon: IconKind;
  emphasized?: boolean;
  danger?: boolean;
  selected?: boolean;
}) {
  const IconComponent = iconMap[icon];
  const color = emphasized ? "#ffffff" : danger ? "#9a4035" : selected ? "#c75f35" : "#17263d";
  const iconSize = icon === "more" ? 19 : icon === "crown" ? 18 : 17;

  return <IconComponent color={color} size={iconSize} strokeWidth={2.25} />;
}

function BottomNavigation() {
  return (
    <View style={styles.bottomNav}>
      <NavItem label="카드" icon="cards" selected />
      <NavItem label="이미지" icon="photo" />
      <NavItem label="문서" icon="fileText" />
      <NavItem label="설정" icon="settings" />
    </View>
  );
}

function NavItem({ label, icon, selected = false }: { label: string; icon: IconKind; selected?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} 이동 mock`} style={[styles.navItem, selected && styles.navItemSelected]}>
      <IconMark icon={icon} selected={selected} />
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

function getDisplayProgressSteps(workOrderIssued: boolean): ProgressStep[] {
  if (!workOrderIssued) {
    return progressSteps;
  }

  return progressSteps.map((step) => {
    if (step.shortLabel === "발주") {
      return {
        ...step,
        status: "완료",
        memo: "작지 출력 및 발주 완료 mock 상태입니다."
      };
    }
    if (step.shortLabel === "자재") {
      return {
        ...step,
        status: deriveMaterialProgressStatus(),
        memo: "원단/부자재 개별 발주 상태에 따라 자재 단계가 준비, 작업중, 완료로 표시됩니다."
      };
    }
    return step;
  });
}

function deriveMaterialProgressStatus(): ProgressStep["status"] {
  const rows = [...fabricRows, ...accessoryRows];
  if (rows.every((row) => row.status === "완료")) {
    return "완료";
  }
  if (rows.some((row) => row.status === "발주요청")) {
    return "작업중";
  }
  return "준비";
}

function isCurrentProgressStep(status: string) {
  return status === "작업중";
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

function selectorWidthStyle(kind: "gender" | "category" | "unit") {
  if (kind === "unit") {
    return styles.currentSelectorUnit;
  }
  if (kind === "category") {
    return styles.currentSelectorCategory;
  }
  return styles.currentSelectorGender;
}

function statusBadgeStyle(status: MaterialStatus) {
  switch (status) {
    case "발주요청":
      return styles.statusRequested;
    case "완료":
      return styles.statusCompleted;
    case "입력중":
    default:
      return styles.statusDraft;
  }
}

function materialRowStateStyle(status: MaterialStatus) {
  switch (status) {
    case "발주요청":
      return styles.materialRequestedRow;
    case "완료":
      return styles.materialCompletedRow;
    case "입력중":
    default:
      return styles.materialDraftRow;
  }
}

function getImageDisplayTitle(image: { title: string; kind: string }, index: number) {
  return image.title.trim() || `${image.kind} ${index + 1}`;
}

function colorSwatchStyle(swatch: "ivory" | "navy" | "black") {
  if (swatch === "navy") {
    return styles.colorSwatchNavy;
  }
  if (swatch === "black") {
    return styles.colorSwatchBlack;
  }
  return styles.colorSwatchIvory;
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
  iconActionButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d0c3",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 58
  },
  iconActionEmphasized: {
    backgroundColor: "#23375a",
    borderColor: "#23375a"
  },
  iconActionDanger: {
    backgroundColor: "#fff5f0",
    borderColor: "#e5b7ac"
  },
  iconDanger: {
    backgroundColor: "#fff0eb"
  },
  iconEmphasized: {
    backgroundColor: "#23375a"
  },
  disabledAction: {
    opacity: 0.46
  },
  disabledReason: {
    color: "#756b62",
    fontSize: 11,
    marginTop: 6
  },
  previewMessage: {
    backgroundColor: "#fff4df",
    borderColor: "#d99a39",
    borderRadius: 8,
    borderWidth: 1,
    color: "#6c4513",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  factoryInstructionInput: {
    backgroundColor: "#ffffff",
    borderColor: "#cfc6b8",
    borderRadius: 8,
    borderWidth: 1,
    color: "#17263d",
    fontSize: 16,
    lineHeight: 22,
    minHeight: 88,
    padding: 10,
    textAlignVertical: "top"
  },
  compactInstructionInput: {
    backgroundColor: "#fffdf9",
    borderColor: "#d8d0c3",
    borderRadius: 6,
    borderWidth: 1,
    color: "#17263d",
    fontSize: 16,
    lineHeight: 21,
    marginTop: 6,
    minHeight: 58,
    paddingHorizontal: 9,
    paddingVertical: 7,
    textAlignVertical: "top"
  },
  instructionSummary: {
    color: "#403a34",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5
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
  listSearchField: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: "#ded4c5",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  listSearchPlaceholder: {
    color: "#756b60",
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0
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
  workOrderCard: {
    backgroundColor: "#f7f0e5",
    borderColor: "#23375a",
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    gap: 6,
    minWidth: 156,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  workOrderCardIssued: {
    backgroundColor: "#edf2e7",
    borderColor: "#4d6a3a"
  },
  workOrderStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "space-between"
  },
  workOrderStatus: {
    color: "#23375a",
    fontSize: 12,
    fontWeight: "900"
  },
  workOrderStatusIssued: {
    color: "#3f5731"
  },
  workOrderDetail: {
    color: "#6d6257",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14
  },
  workOrderButton: {
    alignItems: "center",
    backgroundColor: "#23375a",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  workOrderButtonIssued: {
    backgroundColor: "#ffffff",
    borderColor: "#4d6a3a",
    borderWidth: 1
  },
  workOrderButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
  },
  workOrderButtonTextIssued: {
    color: "#3f5731"
  },
  workOrderConfirmPanel: {
    backgroundColor: "#fffaf2",
    borderColor: "#d9d0c2",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  workOrderConfirmHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  confirmCloseButton: {
    alignItems: "center",
    backgroundColor: "#f2e9dc",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  confirmCloseText: {
    color: "#5d544b",
    fontSize: 13,
    fontWeight: "900"
  },
  confirmCheckGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  confirmCheckItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#eadfce",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  confirmCheckText: {
    color: "#3d342e",
    fontSize: 11,
    fontWeight: "900"
  },
  confirmLockNotice: {
    backgroundColor: "#f6efe5",
    borderLeftColor: "#c75f35",
    borderLeftWidth: 3,
    borderRadius: 10,
    gap: 4,
    padding: 9
  },
  confirmActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end"
  },
  secondaryConfirmButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d9d0c2",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  secondaryConfirmButtonText: {
    color: "#23375a",
    fontSize: 12,
    fontWeight: "900"
  },
  primaryConfirmButton: {
    alignItems: "center",
    backgroundColor: "#23375a",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  primaryConfirmButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900"
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
  tabRailFrame: {
    backgroundColor: "rgba(255, 250, 242, 0.72)",
    borderColor: "#eadfce",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden"
  },
  tabRail: {
    alignItems: "stretch",
    gap: 8,
    paddingVertical: 3
  },
  tabRailTablet: {
    justifyContent: "center",
    minWidth: "100%",
    paddingHorizontal: 8
  },
  tabRailMobile: {
    paddingHorizontal: 12
  },
  tab: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 9,
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 5
  },
  tabTablet: {
    flexGrow: 1,
    minWidth: 92
  },
  tabMobile: {
    minWidth: 74
  },
  tabSelected: {
    backgroundColor: "#fffdf8"
  },
  tabInner: {
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    minHeight: 34
  },
  tabLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minWidth: 0
  },
  tabText: {
    color: "#5d544b",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 17,
    textAlign: "center"
  },
  tabTextSelected: {
    color: "#17263d"
  },
  tabUnderline: {
    backgroundColor: "transparent",
    borderRadius: 999,
    height: 2,
    width: 28
  },
  tabUnderlineSelected: {
    backgroundColor: "#17263d"
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
    borderLeftWidth: 4,
    borderRadius: 11,
    flexDirection: "row",
    gap: 10,
    marginBottom: 13,
    paddingHorizontal: 11,
    paddingVertical: 10
  },
  nextCheckNeutral: {
    backgroundColor: "#f6efe5",
    borderLeftColor: "#8d8174"
  },
  nextCheckWarning: {
    backgroundColor: "#fff1d3",
    borderLeftColor: "#c75f35"
  },
  nextCheckReady: {
    backgroundColor: "#edf2e7",
    borderLeftColor: "#4d6a3a"
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
  imageCarouselCard: {
    backgroundColor: "#fffaf2",
    borderColor: "#eadfce",
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    padding: 9,
    position: "relative"
  },
  imageCarouselCardTablet: {
    alignSelf: "center",
    maxWidth: 520,
    width: "100%"
  },
  imageCarouselTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  imageHeroPress: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    position: "relative"
  },
  imageNavButton: {
    alignItems: "center",
    backgroundColor: "#17263d",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  imageNavText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30
  },
  imageCaptionRow: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24
  },
  imageTitleLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  optionalMark: {
    backgroundColor: "#f4ede2",
    borderRadius: 999,
    color: "#7a6c5c",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  imageFallbackLabel: {
    color: "#7a6c5c",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  imageIndex: {
    backgroundColor: "#f0e4d3",
    borderRadius: 999,
    color: "#5d544b",
    flexShrink: 0,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  imageIndexFloating: {
    backgroundColor: "#f0e4d3",
    borderRadius: 999,
    color: "#5d544b",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: "absolute",
    right: 9,
    top: 9,
    zIndex: 3
  },
  thumbnailStrip: {
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    minWidth: "100%",
    paddingTop: 2
  },
  thumbnailDot: {
    alignItems: "center",
    backgroundColor: "#f3eadb",
    borderColor: "#e1d4c2",
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  thumbnailDotActive: {
    backgroundColor: "#17263d",
    borderColor: "#17263d"
  },
  thumbnailDotText: {
    color: "#665c52",
    fontSize: 11,
    fontWeight: "900"
  },
  thumbnailDotTextActive: {
    color: "#ffffff"
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
  selectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10
  },
  currentSelector: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: "#eadfce",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minHeight: 36,
    minWidth: 92,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  currentSelectorGender: {
    width: 104
  },
  currentSelectorCategory: {
    width: 110
  },
  currentSelectorUnit: {
    width: 92
  },
  currentSelectorLabel: {
    color: "#7a6c5c",
    fontSize: 10,
    fontWeight: "900"
  },
  currentSelectorValueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  currentSelectorValue: {
    color: "#17263d",
    fontSize: 13,
    fontWeight: "900"
  },
  currentSelectorChevron: {
    color: "#8d8174",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1
  },
  selectorOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  selectorOption: {
    backgroundColor: "#f5f1e8",
    borderRadius: 999,
    color: "#665c52",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  selectorOptionSelected: {
    backgroundColor: "#17263d",
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  currentTemplatePanel: {
    backgroundColor: "#f6efe5",
    borderLeftColor: "#23375a",
    borderLeftWidth: 3,
    borderRadius: 10,
    marginBottom: 10,
    padding: 10
  },
  splitActionRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 8
  },
  actionGroupLeft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  actionGroupRight: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "flex-end"
  },
  tableActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "flex-end",
    marginBottom: 8
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
  colorTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  colorSwatch: {
    borderColor: "#d9cbb7",
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    width: 18
  },
  colorSwatchIvory: {
    backgroundColor: "#f5ead6"
  },
  colorSwatchNavy: {
    backgroundColor: "#17263d"
  },
  colorSwatchBlack: {
    backgroundColor: "#181512"
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
    alignItems: "stretch",
    justifyContent: "center",
    minWidth: "100%",
    paddingBottom: 5,
    paddingHorizontal: 8
  },
  progressRailTrack: {
    flexDirection: "row",
    position: "relative"
  },
  progressContinuousLine: {
    backgroundColor: "#dfd3c3",
    height: 2,
    left: 44,
    position: "absolute",
    right: 44,
    top: 9
  },
  progressStep: {
    alignItems: "center",
    width: progressStepWidth,
    paddingHorizontal: 4
  },
  progressStepCurrent: {
    transform: [{ translateY: -1 }]
  },
  progressTopLine: {
    alignItems: "center",
    height: 20,
    justifyContent: "center",
    width: "100%"
  },
  progressDot: {
    borderRadius: 999,
    height: 12,
    zIndex: 1,
    width: 12
  },
  progressDotDone: {
    backgroundColor: "#4d6a3a"
  },
  progressDotCurrent: {
    backgroundColor: "#c75f35"
  },
  progressDotCurrentRing: {
    borderColor: "#fffaf2",
    borderWidth: 3,
    height: 18,
    width: 18
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
    marginHorizontal: 5
  },
  progressConnectorLeft: {
    backgroundColor: "#dfd3c3",
    height: 2,
    left: 0,
    position: "absolute",
    right: "50%"
  },
  progressConnectorRight: {
    backgroundColor: "#dfd3c3",
    height: 2,
    left: "50%",
    position: "absolute",
    right: 0
  },
  progressShort: {
    color: "#17263d",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center"
  },
  progressShortCurrent: {
    color: "#9b4a27",
    fontSize: 13
  },
  progressStatus: {
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 14,
    marginTop: 2,
    textAlign: "center"
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
  progressStatusCurrentPill: {
    backgroundColor: "#ffe1c8",
    borderRadius: 999,
    color: "#8f4327",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  progressCompactNote: {
    borderTopColor: "#eee3d5",
    borderTopWidth: 1,
    gap: 2,
    marginTop: 9,
    paddingTop: 8
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
    borderLeftWidth: 4,
    borderTopColor: "#f0e7dc",
    borderTopWidth: 1,
    gap: 7,
    paddingLeft: 10,
    paddingVertical: 11
  },
  materialDraftRow: {
    borderLeftColor: "#a89d90"
  },
  materialRequestedRow: {
    borderLeftColor: "#c75f35"
  },
  materialCompletedRow: {
    borderLeftColor: "#4d6a3a"
  },
  lockedRow: {
    opacity: 0.82
  },
  completedRow: {
    backgroundColor: "#fbfaf6"
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
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
    minWidth: 180
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
  materialStatusBadge: {
    flexShrink: 0,
    minWidth: 70,
    textAlign: "center"
  },
  materialActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end"
  },
  materialMetaLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  materialActionInline: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end"
  },
  materialSummaryStrip: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    rowGap: 4
  },
  summaryToken: {
    alignItems: "baseline",
    flexDirection: "row",
    flexGrow: 1,
    gap: 4,
    minWidth: 118
  },
  summaryTokenCompact: {
    flexGrow: 0,
    minWidth: 74
  },
  summaryTokenLabel: {
    color: "#7a6c5c",
    fontSize: 9,
    fontWeight: "900"
  },
  summaryTokenValue: {
    borderBottomColor: "transparent",
    borderBottomWidth: 1,
    color: "#4f463f",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    maxWidth: 180,
    paddingBottom: 1
  },
  summaryTokenValueEditable: {
    borderBottomColor: "#b98c5a",
    borderStyle: "dotted",
    color: "#17263d"
  },
  materialNote: {
    color: "#6d6257",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16
  },
  materialNoteEditable: {
    color: "#7b4b32"
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
  processFieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5
  },
  processMetaStrip: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  processMemo: {
    color: "#4f463f",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
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
    borderRadius: 8,
    gap: 3,
    minHeight: 44,
    minWidth: 58,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  navItemSelected: {
    backgroundColor: "#fff2dc"
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
