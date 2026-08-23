import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Paperclip,
  RefreshCw,
  Share2,
  Truck,
} from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type {
  DocumentAccessTokenSummary,
  GeneratedWorkOrderDocument,
  MaterialPartnerOption,
  WorkOrderAttachmentAsset,
  WorkOrderDetailCore,
  WorkOrderMaterialLine,
  WorkOrderSizeColorMatrix,
} from "@/domain/mobileContract";
import WaflChoiceButtons from "@/features/inputs/WaflChoiceButtons";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflActionTile from "@/features/inputs/WaflActionTile";
import WaflActionTileGroup from "@/features/inputs/WaflActionTileGroup";
import WaflSectionCard from "@/features/layout/WaflSectionCard";
import { WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import {
  createDocumentShare,
  generateWorkOrderR0,
  getWorkOrderDocuments,
  issueWorkOrderR0,
  listDocumentAccessTokens,
  revokeDocumentAccessToken,
  setAttachmentOutputInclude,
} from "@/lib/api/documentsApi";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import { getWorkOrderMaterialPartners, getWorkOrderMaterials } from "@/lib/api/materialsApi";
import QuickDeliveryFoundation from "./QuickDeliveryFoundation";
import WaflAuthenticatedPdfViewer from "./WaflAuthenticatedPdfViewer";
import { prepareAuthenticatedDocumentPdfForSave } from "./authenticatedPdfTransport";
import { buildWorkOrderShareMessage } from "./documentShareMessage";
import { DOCUMENT_QUANTITY_INLINE_LIMIT, documentQuantityDisclosureRows } from "./quantityDisclosurePolicy";

const SHARE_DAYS = [
  { value: "1", label: "1일" },
  { value: "7", label: "7일" },
  { value: "30", label: "30일" },
] as const;

const SUPPORTED_OUTPUT_IMAGE = /^image\/(?:jpeg|png|webp)$/i;
const requestId = (kind: string) => `alpha64-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const manualShareTokens = (items: readonly DocumentAccessTokenSummary[]) => items.filter((item) => item.tokenPurpose === "manual_share");

type DocumentActionIcon = typeof ExternalLink;

function CompactAction(props: {
  readonly label: string;
  readonly icon: DocumentActionIcon;
  readonly disabled?: boolean;
  readonly emphasis?: "primary" | "secondary" | "danger";
  readonly onPress: () => void;
}) {
  const Icon = props.icon;
  return (
    <Pressable
      accessibilityLabel={props.label}
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.compactAction,
        props.emphasis === "primary" && styles.compactActionPrimary,
        props.emphasis === "danger" && styles.compactActionDanger,
        props.disabled && styles.disabled,
        pressed && !props.disabled && styles.pressed,
      ]}
    >
      <Icon
        color={props.emphasis === "primary" ? "#fffdf8" : props.emphasis === "danger" ? WAFL_THEME.color.error : WAFL_THEME.color.deepNavy}
        size={17}
        strokeWidth={2.2}
      />
      <Text style={[styles.compactActionText, props.emphasis === "primary" && styles.compactActionTextPrimary, props.emphasis === "danger" && styles.compactActionTextDanger]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function InfoRow({ label, value, placeholder = false }: { readonly label: string; readonly value: string; readonly placeholder?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={3} style={[styles.infoValue, placeholder && styles.infoValuePlaceholder]}>{value}</Text>
    </View>
  );
}

function formatDateTime(value: string | null, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

function DocumentAccessMetadata({ token }: { readonly token: DocumentAccessTokenSummary }) {
  const rows = [
    { label: "생성", value: formatDateTime(token.createdAt, "확인 필요") },
    { label: "만료", value: token.expiresAt ? formatDateTime(token.expiresAt, "확인 필요") : "관리형" },
    { label: "마지막 열람", value: token.lastAccessedAt ? formatDateTime(token.lastAccessedAt, "없음") : "없음" },
    { label: "열람 횟수", value: `${token.accessCount.toLocaleString("ko-KR")}회` },
  ] as const;
  return <View style={styles.accessMetadata}>{rows.map((row) => <View key={row.label} style={styles.accessMetadataRow}><Text style={styles.accessMetadataLabel}>{row.label}</Text><Text style={styles.accessMetadataValue}>{row.value}</Text></View>)}</View>;
}

export default function WorkOrderDocumentWorkbench({ detail, attachments, sizeColorMatrix, onOpenSizeColor, onRefresh }: {
  readonly detail: WorkOrderDetailCore;
  readonly attachments: readonly WorkOrderAttachmentAsset[];
  readonly sizeColorMatrix: WorkOrderSizeColorMatrix | null;
  readonly onOpenSizeColor: () => void;
  readonly onRefresh: () => Promise<void> | void;
}) {
  const attachmentProjectionKey = attachments.map((item) => `${item.id}:${item.includeInDocument ? 1 : 0}`).join(",");
  return (
    <WorkOrderDocumentWorkbenchBody
      attachments={attachments}
      detail={detail}
      key={`${detail.header.id}:${detail.header.entityVersion}:${attachmentProjectionKey}`}
      onOpenSizeColor={onOpenSizeColor}
      onRefresh={onRefresh}
      sizeColorMatrix={sizeColorMatrix}
    />
  );
}

function WorkOrderDocumentWorkbenchBody({ detail, attachments, sizeColorMatrix, onOpenSizeColor, onRefresh }: {
  readonly detail: WorkOrderDetailCore;
  readonly attachments: readonly WorkOrderAttachmentAsset[];
  readonly sizeColorMatrix: WorkOrderSizeColorMatrix | null;
  readonly onOpenSizeColor: () => void;
  readonly onRefresh: () => Promise<void> | void;
}) {
  const [documents, setDocuments] = useState<readonly GeneratedWorkOrderDocument[]>([]);
  const [tokens, setTokens] = useState<readonly DocumentAccessTokenSummary[]>([]);
  const [selectedDays, setSelectedDays] = useState<"1" | "7" | "30">("7");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(detail.header.entityVersion);
  const [included, setIncluded] = useState<Record<string, boolean>>(() => Object.fromEntries(attachments.map((item) => [item.id, item.includeInDocument])));
  const [stagedIncluded, setStagedIncluded] = useState<Record<string, boolean>>(() => Object.fromEntries(attachments.map((item) => [item.id, item.includeInDocument])));
  const [attachmentSheetOpen, setAttachmentSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [accessManagementOpen, setAccessManagementOpen] = useState(false);
  const [quantityOpen, setQuantityOpen] = useState(false);
  const [quantitySheetOpen, setQuantitySheetOpen] = useState(false);
  const [quickDeliveryOpen, setQuickDeliveryOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [materialLines, setMaterialLines] = useState<readonly WorkOrderMaterialLine[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<readonly MaterialPartnerOption[]>([]);

  const generated = documents.find((item) => item.status === "generated") ?? null;
  const failed = documents.find((item) => item.status === "failed") ?? null;
  const issued = detail.header.status === "issued" || detail.header.status === "revised" || detail.header.status === "completed";
  const quantityRows = useMemo(() => documentQuantityDisclosureRows(sizeColorMatrix), [sizeColorMatrix]);
  const inlineQuantityRows = quantityRows.slice(0, DOCUMENT_QUANTITY_INLINE_LIMIT);

  const load = useCallback(async () => {
    const page = await getWorkOrderDocuments(detail.header.id);
    setDocuments(page.items);
    const current = page.items.find((item) => item.status === "generated");
    setTokens(current ? manualShareTokens(await listDocumentAccessTokens(current.id)) : []);
    return page;
  }, [detail.header.id]);

  const generateAndReconcile = useCallback(async (kind: string) => {
    let generatedDocumentId: string | null = null;
    let requestError: unknown = null;
    try {
      const result = await generateWorkOrderR0(detail.header.id, detail.header.currentRevisionId, requestId(kind));
      generatedDocumentId = result.generatedDocumentId;
      if (result.status === "generated") {
        await load();
        return;
      }
    } catch (error) {
      requestError = error;
    }
    for (let attempt = 0; attempt < 45; attempt += 1) {
      const page = await load();
      const current = generatedDocumentId
        ? page.items.find((item) => item.id === generatedDocumentId)
        : page.items.find((item) => item.revisionId === detail.header.currentRevisionId && (item.status === "pending" || item.status === "generated"));
      if (current?.status === "generated") return;
      if (current?.status === "failed") throw requestError ?? new Error("PDF_GENERATION_FAILED");
      if (!current && requestError) throw requestError;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    throw requestError ?? new Error("PDF_GENERATION_RECONCILIATION_TIMEOUT");
  }, [detail.header.currentRevisionId, detail.header.id, load]);

  useEffect(() => {
    onOpenSizeColor();
  }, [onOpenSizeColor]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getWorkOrderDocuments(detail.header.id),
      getWorkOrderMaterials(detail.header.id, "fabric"),
      getWorkOrderMaterials(detail.header.id, "accessory"),
      getWorkOrderMaterialPartners(detail.header.id),
    ])
      .then(async ([page, fabrics, accessories, partners]) => {
        if (!active) return;
        setDocuments(page.items);
        setMaterialLines([...fabrics.items, ...accessories.items]);
        setPartnerOptions(partners.items);
        const current = page.items.find((item) => item.status === "generated");
        const nextTokens = current ? manualShareTokens(await listDocumentAccessTokens(current.id)) : [];
        if (active) setTokens(nextTokens);
      })
      .catch(() => { if (active) setMessage("문서 상태를 불러오지 못했습니다."); });
    return () => { active = false; };
  }, [detail.header.id]);

  const selectedAttachments = useMemo(() => attachments.filter((item) => included[item.id]), [attachments, included]);
  const thumbnailUrl = resolveMobileApiUrl(detail.header.representativeImage?.thumbnailUrl ?? null);

  function openAttachmentSheet() {
    setStagedIncluded({ ...included });
    setAttachmentSheetOpen(true);
  }

  async function applyAttachmentSelection() {
    const changed = attachments.filter((attachment) => Boolean(stagedIncluded[attachment.id]) !== Boolean(included[attachment.id]));
    if (changed.length === 0) {
      setAttachmentSheetOpen(false);
      return;
    }
    setBusy(true);
    setMessage(null);
    let nextVersion = version;
    try {
      for (const attachment of changed) {
        const includeInDocument = Boolean(stagedIncluded[attachment.id]);
        const response = await setAttachmentOutputInclude({
          workOrderId: detail.header.id,
          attachmentId: attachment.id,
          expectedVersion: nextVersion,
          includeInDocument,
          clientRequestId: requestId("attachment-output"),
        });
        if (!response.ok || !Number.isSafeInteger(response.data?.nextVersion)) throw new Error("ATTACHMENT_OUTPUT_RESPONSE_INVALID");
        nextVersion = response.data.nextVersion;
        setIncluded((current) => ({ ...current, [attachment.id]: includeInDocument }));
      }
      setVersion(nextVersion);
      setAttachmentSheetOpen(false);
      setMessage("문서에 포함할 첨부를 저장했습니다.");
    } catch {
      setVersion(nextVersion);
      setMessage("첨부 출력 설정을 모두 저장하지 못했습니다. 현재 선택을 다시 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function issueAndGenerate() {
    setBusy(true);
    setMessage(null);
    try {
      const issuedResult = await issueWorkOrderR0({
        workOrderId: detail.header.id,
        revisionId: detail.header.currentRevisionId,
        workOrderVersion: version,
        revisionVersion: detail.header.currentRevisionVersion,
        clientRequestId: requestId("issue-r0"),
      });
      setVersion(issuedResult.nextVersion);
      try {
        await generateAndReconcile("generate-r0");
        setMessage("작업 내용을 확정하고 문서를 만들었습니다.");
      } catch {
        setMessage("작업지시서는 생성되었습니다. PDF만 만들지 못했습니다.");
      }
      await load();
      await onRefresh();
    } catch {
      setMessage("생성에 필요한 정보와 최신 내용을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function retryGeneration() {
    setBusy(true);
    setMessage(null);
    try {
      await generateAndReconcile("retry-generation");
      onRefresh();
      setMessage("PDF를 생성했습니다.");
    } catch {
      setMessage("PDF를 다시 생성하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function shareDocument() {
    if (!generated) return;
    setBusy(true);
    setMessage(null);
    try {
      const expiresInDays = Number(selectedDays) as 1 | 7 | 30;
      const created = await createDocumentShare(generated.id, expiresInDays, requestId("manual-share"));
      await Share.share({
        title: "작업지시서",
        message: buildWorkOrderShareMessage({
          productName: detail.header.productName,
          totalQuantity: detail.header.totalQuantity,
          dueDate: detail.header.dueDate,
          viewerUrl: created.viewerUrl,
        }),
      });
      setTokens(manualShareTokens(await listDocumentAccessTokens(generated.id)));
      setShareSheetOpen(false);
    } catch {
      setMessage("공유 링크를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDocument() {
    if (!generated?.inlineUrl) {
      setMessage("문서를 저장할 수 없습니다.");
      return;
    }
    setBusy(true);
    setMessage(null);
    let saveFile: Awaited<ReturnType<typeof prepareAuthenticatedDocumentPdfForSave>> | null = null;
    try {
      saveFile = await prepareAuthenticatedDocumentPdfForSave({
        displayDocumentNumber: generated.displayDocumentNumber,
        documentId: generated.id,
        inlineUrl: generated.inlineUrl,
      });
      await Share.share({
        title: saveFile.filename,
        url: `file://${saveFile.path}`,
      });
    } catch {
      setMessage("문서를 저장할 수 없습니다.");
    } finally {
      if (saveFile) await saveFile.dispose();
      setBusy(false);
    }
  }

  function openInAppDocumentViewer() {
    if (!generated?.inlineUrl) {
      setMessage("문서를 볼 수 없습니다.");
      return;
    }
    setMessage(null);
    setDocumentViewerOpen(true);
  }

  function confirmIssue() {
    if (!detail.header.readiness.canIssue) {
      Alert.alert(
        "생성 전 확인",
        detail.header.readiness.hardBlockers.map((item) => `• ${item.message}`).join("\n"),
        [{ text: "확인" }],
      );
      return;
    }
    Alert.alert(
      "작업지시서를 생성할까요?",
      "현재 입력한 내용으로 작업지시서를 생성합니다. 생성 후에는 내용을 수정할 수 없으니 한 번 더 확인해 주세요.",
      [
        { text: "취소", style: "cancel" },
        { text: "생성", onPress: () => void issueAndGenerate() },
      ],
    );
  }

  function confirmRevoke(token: DocumentAccessTokenSummary) {
    const embedded = token.tokenPurpose === "embedded_qr";
    Alert.alert(
      embedded ? "인쇄된 QR을 해제할까요?" : "공유 링크를 해제할까요?",
      embedded ? "해제하면 이 PDF에 인쇄된 QR은 다시 사용할 수 없습니다." : "해제된 링크는 다시 열 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        { text: "해제", style: "destructive", onPress: () => void (async () => {
          if (!generated) return;
          setBusy(true);
          try {
            await revokeDocumentAccessToken(generated.id, token.tokenId);
            setTokens(manualShareTokens(await listDocumentAccessTokens(generated.id)));
          } catch {
            setMessage("문서 접근을 해제하지 못했습니다.");
          } finally {
            setBusy(false);
          }
        })() },
      ],
    );
  }

  return (
    <View style={styles.container} testID="document-workbench">
      <WaflSectionCard style={styles.previewSheet} testID="document-production-overview">
        <View style={styles.previewHeader}>
          <View style={styles.previewImage}>
            {thumbnailUrl ? (
              <Image accessibilityLabel={detail.header.representativeImage?.altText ?? "대표 이미지"} alt={detail.header.representativeImage?.altText ?? "대표 이미지"} resizeMode="cover" source={{ uri: thumbnailUrl }} style={styles.previewImageAsset} />
            ) : (
              <FileText color="#8c7b69" size={27} strokeWidth={1.7} />
            )}
          </View>
          <View style={styles.flex}>
            <Text numberOfLines={2} style={styles.productName}>{detail.header.productName}</Text>
            <Text style={styles.productionCategory}>생산 구분 · 미지정</Text>
          </View>
        </View>
        <View style={styles.previewGrid}>
          <InfoRow label="공장" placeholder value={WAFL_UNSET_PLACEHOLDER} />
          <InfoRow label="납기일" placeholder={!detail.header.dueDate} value={detail.header.dueDate ?? WAFL_UNSET_PLACEHOLDER} />
          <InfoRow label="총수량" value={`${detail.header.totalQuantity.toLocaleString("ko-KR")}개`} />
          <InfoRow label="원단" value={`${detail.tabCounts.fabric.toLocaleString("ko-KR")}개`} />
          <InfoRow label="부자재" value={`${detail.tabCounts.accessory.toLocaleString("ko-KR")}개`} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => setQuantityOpen((current) => !current)} style={styles.quantityDisclosure} testID="document-size-color-quantity-disclosure">
          <Text style={styles.quantityDisclosureText}>사이즈·색상별 수량</Text>
          {quantityOpen ? <ChevronUp color={WAFL_THEME.color.deepNavy} size={17}/> : <ChevronDown color={WAFL_THEME.color.deepNavy} size={17}/>}
        </Pressable>
        {quantityOpen ? <View style={styles.quantityRows}>{sizeColorMatrix ? <>
          {inlineQuantityRows.map((row) => <View key={row.key} style={styles.quantityRow}><Text style={styles.quantityLabel}>{row.label}</Text><Text style={styles.quantityValue}>{row.quantity.toLocaleString("ko-KR")}개</Text></View>)}
          {quantityRows.length === 0 ? <Text style={styles.meta}>입력된 수량이 없습니다.</Text> : null}
          {quantityRows.length > DOCUMENT_QUANTITY_INLINE_LIMIT ? <Pressable accessibilityRole="button" onPress={() => setQuantitySheetOpen(true)} style={styles.quantityAllButton}><Text style={styles.quantityAllButtonText}>전체보기 {quantityRows.length}개</Text><ChevronDown color={WAFL_THEME.color.deepNavy} size={15}/></Pressable> : null}
        </> : <Text style={styles.meta}>수량 정보를 불러오는 중입니다.</Text>}</View> : null}
        <View style={styles.memoBox}>
          <Text style={styles.memoLabel}>공장 전달 메모</Text>
          <Text numberOfLines={4} style={[styles.memoText, !detail.revision.factoryDeliveryMemo && styles.infoValuePlaceholder]}>
            {detail.revision.factoryDeliveryMemo ?? WAFL_UNSET_PLACEHOLDER}
          </Text>
        </View>

        <View style={styles.integratedDivider} />

      <View style={styles.includedSection} testID="document-attachment-selection">
        <View style={styles.summaryHeader}>
          <Text style={styles.subhead}>첨부 자료</Text>
        </View>
        <WaflActionTileGroup testID="document-workbench-action-tiles">
          <WaflActionTile accessibilityLabel="문서 첨부" disabled={issued || busy || attachments.length === 0} icon={Paperclip} label="첨부" onPress={openAttachmentSheet} testID="document-attachment-action" />
          <WaflActionTile accessibilityLabel="문서 퀵 전달" icon={Truck} label="퀵 전달" onPress={() => setQuickDeliveryOpen(true)} testID="document-quick-delivery-action" />
        </WaflActionTileGroup>
        {selectedAttachments.length > 0 ? (
          <View style={styles.attachmentListSummary}>{selectedAttachments.map((item) => {
            const attachmentUrl = resolveMobileApiUrl(item.viewUrl);
            const image = SUPPORTED_OUTPUT_IMAGE.test(item.mimeType);
            return <View key={item.id} style={styles.attachmentSummaryRow}>
              <View style={styles.attachmentThumbnail}>
                {image && attachmentUrl ? <Image accessibilityLabel={item.filename} alt={item.filename} resizeMode="cover" source={{ uri: attachmentUrl }} style={styles.attachmentThumbnailImage} /> : <FileText color={WAFL_THEME.color.readOnly} size={16} />}
              </View>
              <View style={styles.flex}><Text numberOfLines={2} style={styles.attachmentSummaryName}>{item.filename}</Text><Text style={styles.meta}>{image ? "PDF 본문 이미지 · 전달 첨부" : "전달 첨부"}</Text></View>
            </View>;
          })}</View>
        ) : <Text style={styles.emptyValue}>{WAFL_UNSET_PLACEHOLDER}</Text>}
      </View>
      </WaflSectionCard>

      <View style={styles.actionCluster} testID="document-action-cluster">
        {!issued ? (
          <CompactAction disabled={busy} emphasis="primary" icon={FileText} label="작업지시서 생성" onPress={confirmIssue} />
        ) : null}
        {failed && !generated ? (
          <CompactAction disabled={busy} emphasis="primary" icon={RefreshCw} label="PDF 다시 생성" onPress={() => void retryGeneration()} />
        ) : null}
        {generated ? (
          <>
            <CompactAction disabled={busy} icon={ExternalLink} label="보기" onPress={openInAppDocumentViewer} />
            <CompactAction disabled={busy} icon={Share2} label="공유" onPress={() => setShareSheetOpen(true)} />
            <CompactAction disabled={busy} icon={Download} label="저장" onPress={() => void saveDocument()} />
          </>
        ) : null}
      </View>

      {!issued && !detail.header.readiness.canIssue ? (
        <View style={styles.blockerPanel} testID="document-generation-blockers">
          <Text style={styles.blockerTitle}>생성 전 확인</Text>
          {detail.header.readiness.hardBlockers.map((item) => <Text key={item.code} style={styles.blocker}>• {item.message}</Text>)}
        </View>
      ) : null}

      {generated ? (
        <View style={styles.secondaryControls} testID="document-secondary-controls">
          <Pressable accessibilityRole="button" onPress={() => setAccessManagementOpen((current) => !current)} style={styles.secondaryControlHeader}>
            <View style={styles.secondaryControlTitle}><Link2 color={WAFL_THEME.color.deepNavy} size={17} /><Text style={styles.subhead}>공유 링크 관리</Text></View>
            <Text style={styles.secondaryControlToggle}>{accessManagementOpen ? "닫기" : `보기 ${tokens.length}`}</Text>
          </Pressable>
          {accessManagementOpen ? (
            <View style={styles.accessRows}>
              {tokens.length === 0 ? <Text style={styles.meta}>활성 공유 링크가 없습니다.</Text> : tokens.map((token) => (
                <View key={token.tokenId} style={styles.tokenRow}>
                  <View style={styles.tokenIdentity}>
                    <Link2 color={WAFL_THEME.color.deepNavy} size={17} />
                    <View style={styles.flex}>
                      <Text style={styles.tokenTitle}>공유 링크</Text>
                      <Text style={styles.tokenStatus}>{token.status === "active" ? "사용 중" : token.status === "revoked" ? "해제됨" : "만료됨"}</Text>
                      <DocumentAccessMetadata token={token} />
                    </View>
                  </View>
                  {token.status === "active" ? <CompactAction disabled={busy} emphasis="danger" icon={Link2} label="해제" onPress={() => confirmRevoke(token)} /> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

      {generated?.inlineUrl ? (
        <WaflAuthenticatedPdfViewer
          displayDocumentNumber={generated.displayDocumentNumber}
          documentId={generated.id}
          inlineUrl={generated.inlineUrl}
          onClose={() => setDocumentViewerOpen(false)}
          visible={documentViewerOpen}
        />
      ) : null}

      <WaflInputSheet
        cancelAccessibilityLabel="퀵 전달 편집 취소"
        confirmAccessibilityLabel="퀵 전달 편집 확인"
        onCancel={() => setQuickDeliveryOpen(false)}
        onConfirm={() => setQuickDeliveryOpen(false)}
        sizing="expandable"
        title="퀵 전달"
        visible={quickDeliveryOpen}
      >
        <QuickDeliveryFoundation lines={materialLines} partners={partnerOptions}/>
      </WaflInputSheet>

      <WaflInputSheet
        cancelAccessibilityLabel="첨부 선택 취소"
        confirmAccessibilityLabel="첨부 선택 저장"
        confirmDisabled={busy}
        onCancel={() => setAttachmentSheetOpen(false)}
        onConfirm={applyAttachmentSelection}
        pending={busy}
        sizing="expandable"
        title="문서에 포함할 첨부"
        visible={attachmentSheetOpen}
      >
        <Text style={styles.sheetHelp}>이미지는 PDF 본문에도 넣을 수 있고, 선택한 모든 파일은 공유 Viewer의 전달 첨부에 함께 표시됩니다.</Text>
        <View style={styles.attachmentList}>
          {attachments.map((attachment) => {
            const supported = true;
            const selected = Boolean(stagedIncluded[attachment.id]);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: !supported || busy }}
                disabled={!supported || busy}
                key={attachment.id}
                onPress={() => setStagedIncluded((current) => ({ ...current, [attachment.id]: !selected }))}
                style={[styles.attachmentOption, selected && styles.attachmentOptionSelected, !supported && styles.disabled]}
              >
                <Paperclip color={selected ? WAFL_THEME.color.deepNavy : "#8a7d71"} size={17} />
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={styles.attachmentOptionName}>{attachment.filename}</Text>
                  <Text style={styles.meta}>{SUPPORTED_OUTPUT_IMAGE.test(attachment.mimeType) ? "PDF 본문 이미지 · 전달 첨부" : "전달 첨부"}</Text>
                </View>
                <View style={[styles.selectionMark, selected && styles.selectionMarkSelected]}>{selected ? <Check color="#fff" size={13} strokeWidth={2.8} /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </WaflInputSheet>

      <WaflInputSheet
        cancelAccessibilityLabel="전체 수량 닫기"
        confirmAccessibilityLabel="전체 수량 확인"
        onCancel={() => setQuantitySheetOpen(false)}
        onConfirm={() => setQuantitySheetOpen(false)}
        sizing="expandable"
        title="사이즈·색상별 수량"
        visible={quantitySheetOpen}
      >
        <View style={styles.quantitySheetRows}>
          {quantityRows.map((row) => <View key={row.key} style={styles.quantityRow}><Text style={styles.quantityLabel}>{row.label}</Text><Text style={styles.quantityValue}>{row.quantity.toLocaleString("ko-KR")}개</Text></View>)}
        </View>
      </WaflInputSheet>

      <WaflInputSheet
        cancelAccessibilityLabel="공유 취소"
        confirmAccessibilityLabel="공유 링크 만들기"
        confirmDisabled={busy}
        onCancel={() => setShareSheetOpen(false)}
        onConfirm={shareDocument}
        pending={busy}
        sizing="contentFit"
        title="작업지시서 공유"
        visible={shareSheetOpen}
      >
        <Text style={styles.sheetHelp}>공유 링크를 사용할 기간을 선택하세요. 기본은 7일입니다.</Text>
        <WaflChoiceButtons accessibilityLabel="공유 기간" disabled={busy} onSelect={setSelectedDays} options={SHARE_DAYS} selectedValue={selectedDays} />
      </WaflInputSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  integratedDivider: { backgroundColor: "#eee3d5", height: StyleSheet.hairlineWidth, marginHorizontal: WAFL_THEME.spacing.md, marginTop: WAFL_THEME.spacing.sm },
  container: { gap: WAFL_THEME.spacing.md, paddingBottom: WAFL_THEME.spacing.xl },
  flex: { flex: 1, minWidth: 0 },
  previewSheet: {},
  previewHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  previewImage: { alignItems: "center", aspectRatio: 1, backgroundColor: WAFL_THEME.color.fabricBeige, borderRadius: WAFL_THEME.radius.card, justifyContent: "center", overflow: "hidden", width: 72 },
  previewImageAsset: { height: "100%", width: "100%" },
  productName: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.title, lineHeight: 23 },
  productionCategory: { color: WAFL_THEME.color.disabled, fontFamily: WAFL_FONTS.semibold, fontSize: 10, marginTop: 4 },
  previewGrid: { borderTopColor: "#ece4da", borderTopWidth: 1 },
  infoRow: { alignItems: "flex-start", borderBottomColor: "#eee6dc", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12, minHeight: 38, paddingVertical: 8 },
  infoLabel: { color: "#81756b", fontFamily: WAFL_FONTS.semibold, fontSize: 11, width: 74 },
  infoValue: { color: "#40372f", flex: 1, fontFamily: WAFL_FONTS.bold, fontSize: 12, lineHeight: 17, textAlign: "right" },
  infoValuePlaceholder: { color: WAFL_THEME.color.disabled, fontFamily: WAFL_FONTS.medium },
  quantityDisclosure: { alignItems: "center", borderTopColor: "#ece4da", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 42, paddingTop: 7 },
  quantityDisclosureText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  quantityRows: { backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.field, paddingHorizontal: 9 },
  quantityRow: { alignItems: "center", borderBottomColor: "#e6ddd2", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 34 },
  quantityLabel: { color: "#685d53", fontFamily: WAFL_FONTS.medium, fontSize: 10 },
  quantityValue: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  quantityAllButton: { alignItems: "center", flexDirection: "row", justifyContent: "center", minHeight: 42, gap: 5 },
  quantityAllButtonText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  quantitySheetScroll: { maxHeight: 430, marginTop: 8 },
  quantitySheetRows: { paddingBottom: 4 },
  memoBox: { backgroundColor: WAFL_THEME.color.fabricBeige, borderRadius: WAFL_THEME.radius.card, gap: 3, padding: 9 },
  memoLabel: { color: "#786a5d", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  memoText: { color: "#463c34", fontFamily: WAFL_FONTS.body, fontSize: 12, lineHeight: 18 },
  includedSection: { borderTopColor: "#eee3d5", borderTopWidth: WAFL_THEME.border.hairline, gap: WAFL_THEME.spacing.sm, marginHorizontal: WAFL_THEME.spacing.md, paddingTop: WAFL_THEME.spacing.md },
  summaryHeader: { alignItems: "center", flexDirection: "row", gap: 10 },
  subhead: { color: "#3f352d", fontFamily: WAFL_FONTS.bold, fontSize: 14 },
  meta: { color: "#81766c", fontFamily: WAFL_FONTS.body, fontSize: 11, lineHeight: 16 },
  attachmentListSummary: { gap: WAFL_THEME.spacing.xs },
  attachmentSummaryRow: { alignItems: "center", borderTopColor: "#f0e7dc", borderTopWidth: WAFL_THEME.border.hairline, flexDirection: "row", gap: WAFL_THEME.spacing.sm, minHeight: 44, paddingVertical: WAFL_THEME.spacing.xs },
  attachmentThumbnail: { alignItems: "center", backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.field, height: 36, justifyContent: "center", overflow: "hidden", width: 36 },
  attachmentThumbnailImage: { height: "100%", width: "100%" },
  attachmentSummaryName: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 16, minWidth: 0 },
  emptyValue: { color: WAFL_THEME.color.disabled, fontFamily: WAFL_FONTS.medium, fontSize: 11 },
  actionCluster: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingHorizontal: WAFL_THEME.spacing.md },
  compactAction: { alignItems: "center", backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.card, borderWidth: WAFL_THEME.border.hairline, flexDirection: "row", gap: 5, justifyContent: "center", minHeight: 44, paddingHorizontal: 12 },
  compactActionPrimary: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  compactActionDanger: { backgroundColor: "#fff8f6", borderColor: "#dfb8ae" },
  compactActionText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  compactActionTextPrimary: { color: "#fffdf8" },
  compactActionTextDanger: { color: WAFL_THEME.color.error },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
  blockerPanel: { backgroundColor: "#fff8ee", borderLeftColor: WAFL_THEME.color.brickOrange, borderLeftWidth: 4, borderRadius: WAFL_THEME.radius.card, gap: 4, marginHorizontal: WAFL_THEME.spacing.md, padding: 10 },
  blockerTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  blocker: { color: "#8d4a35", fontFamily: WAFL_FONTS.body, fontSize: 11, lineHeight: 17 },
  secondaryControls: { borderTopColor: "#e5ddd2", borderTopWidth: 1, marginHorizontal: WAFL_THEME.spacing.md, paddingTop: 4 },
  secondaryControlHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 44, paddingHorizontal: 2 },
  secondaryControlTitle: { alignItems: "center", flexDirection: "row", gap: 6 },
  secondaryControlToggle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  accessRows: { gap: 2 },
  tokenRow: { alignItems: "center", borderTopColor: "#ece4da", borderTopWidth: 1, flexDirection: "row", gap: 8, justifyContent: "space-between", paddingVertical: 9 },
  tokenIdentity: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8, minWidth: 0 },
  tokenTitle: { color: "#433a32", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  tokenStatus: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: 10, marginTop: 2 },
  accessMetadata: { gap: 2, marginTop: 6 },
  accessMetadataRow: { alignItems: "baseline", flexDirection: "row", gap: 8, minHeight: 18 },
  accessMetadataLabel: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 10, width: 60 },
  accessMetadataValue: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 10, lineHeight: 15 },
  message: { backgroundColor: "#fff5e8", borderRadius: WAFL_THEME.radius.card, color: "#784325", fontFamily: WAFL_FONTS.body, fontSize: 11, lineHeight: 17, marginHorizontal: WAFL_THEME.spacing.md, padding: 9 },
  sheetHelp: { color: "#6c6055", fontFamily: WAFL_FONTS.body, fontSize: 12, lineHeight: 18, marginBottom: 10, marginTop: 8 },
  attachmentScroll: { maxHeight: 330 },
  attachmentList: { gap: 7, paddingBottom: 4 },
  attachmentOption: { alignItems: "center", backgroundColor: "#fffdf9", borderColor: "#d8cdc0", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 54, paddingHorizontal: 10, paddingVertical: 8 },
  attachmentOptionSelected: { backgroundColor: "#f1f2f5", borderColor: WAFL_THEME.color.deepNavy },
  attachmentOptionName: { color: "#40372f", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  selectionMark: { alignItems: "center", borderColor: "#b9ada0", borderRadius: 999, borderWidth: 1, height: 22, justifyContent: "center", width: 22 },
  selectionMarkSelected: { backgroundColor: WAFL_THEME.color.deepNavy, borderColor: WAFL_THEME.color.deepNavy },
});
