import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Expand,
  FileText,
  Images,
  Paperclip,
  PencilLine,
  Star,
  Trash2,
  X,
} from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import {
  clampFactoryDeliveryMemo,
  FACTORY_DELIVERY_MEMO_MAX_LENGTH,
  factoryDeliveryMemoLength,
} from "@/domain/factoryDeliveryMemoPolicy";
import type { WorkOrderAttachmentAsset, WorkOrderImageAsset } from "@/domain/mobileContract";
import type { WorkOrderImageAcquisitionSource } from "@/features/work-orders/images/workOrderImageAcquisition";
import {
  attachmentListSummary,
  formatAttachmentBytes,
} from "@/features/work-orders/images/attachmentPresentation";
import { resolveMobileApiUrl } from "@/lib/apiTransport";

type Props = {
  readonly images: readonly WorkOrderImageAsset[];
  readonly attachments: readonly WorkOrderAttachmentAsset[];
  readonly factoryDeliveryMemo: string | null;
  readonly canEdit: boolean;
  readonly busy: boolean;
  readonly busyImageId: string | null;
  readonly message: string | null;
  readonly onAcquire: (source: WorkOrderImageAcquisitionSource) => void;
  readonly onAcquireAttachment: () => void;
  readonly onDelete: (image: WorkOrderImageAsset) => void;
  readonly onDeleteAttachment: (attachment: WorkOrderAttachmentAsset) => void;
  readonly onOpenAttachment: (attachment: WorkOrderAttachmentAsset) => void;
  readonly onSaveMemo: (memo: string) => Promise<boolean>;
  readonly onSetRepresentative: (image: WorkOrderImageAsset) => void;
  readonly onFocusTarget?: (target: TextInput) => void;
};

function ImageWithFallback(props: {
  readonly accessibilityLabel: string;
  readonly candidates: readonly (string | null)[];
  readonly resizeMode: "contain" | "cover";
  readonly style: object;
}) {
  const urls = [...new Set(props.candidates.map(resolveMobileApiUrl).filter((url): url is string => Boolean(url)))];
  const [candidateIndex, setCandidateIndex] = useState(0);
  const url = urls[candidateIndex] ?? null;
  if (!url) {
    return <View style={[props.style, styles.imageFallback]}><Images color="#8a7d70" size={30} /></View>;
  }
  return (
    <Image
      accessibilityLabel={props.accessibilityLabel}
      alt={props.accessibilityLabel}
      onError={() => setCandidateIndex((current) => current + 1)}
      resizeMode={props.resizeMode}
      source={{ uri: url }}
      style={props.style}
    />
  );
}

export default function WorkOrderImageGallery(props: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(props.images[0]?.id ?? null);
  const [fullscreen, setFullscreen] = useState(false);
  const [memoDraft, setMemoDraft] = useState(props.factoryDeliveryMemo ?? "");
  const memoInputRef = useRef<TextInput>(null);
  const memoFocusedRef = useRef(false);
  const memoSavingRef = useRef(false);
  const memoActivationValueRef = useRef(props.factoryDeliveryMemo ?? "");

  const selectedIndex = useMemo(() => {
    const index = props.images.findIndex((image) => image.id === selectedId);
    return index >= 0 ? index : 0;
  }, [props.images, selectedId]);
  const selected = props.images[selectedIndex] ?? null;
  function move(offset: -1 | 1) {
    if (props.images.length < 2) return;
    setSelectedId((currentId) => {
      const currentIndex = Math.max(0, props.images.findIndex((image) => image.id === currentId));
      const nextIndex = (currentIndex + offset + props.images.length) % props.images.length;
      return props.images[nextIndex].id;
    });
  }

  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (
      Math.abs(gesture.dx) >= 8
      && Math.abs(gesture.dx) >= Math.abs(gesture.dy) * 1.35
    ),
    onPanResponderRelease: (_, gesture) => {
      if (props.images.length < 2) return;
      const horizontalIntent = Math.abs(gesture.dx) >= Math.abs(gesture.dy) * 1.2;
      const distanceIntent = Math.abs(gesture.dx) >= 24;
      const velocityIntent = Math.abs(gesture.vx) >= 0.25;
      const direction = Math.abs(gesture.dx) >= 8 ? gesture.dx : gesture.vx;
      const offset = horizontalIntent && (distanceIntent || velocityIntent)
        ? direction < 0 ? 1 : -1
        : 0;
      if (offset === 0) return;
      setSelectedId((currentId) => {
        const currentIndex = Math.max(0, props.images.findIndex((image) => image.id === currentId));
        const nextIndex = (currentIndex + offset + props.images.length) % props.images.length;
        return props.images[nextIndex].id;
      });
    },
  }), [props.images]);
  const selectedBusy = Boolean(selected && props.busyImageId === selected.id);
  const memoLength = factoryDeliveryMemoLength(memoDraft);

  useEffect(() => {
    if (memoFocusedRef.current || memoSavingRef.current) return;
    const current = props.factoryDeliveryMemo ?? "";
    memoActivationValueRef.current = current;
    setMemoDraft(current);
  }, [props.factoryDeliveryMemo]);

  async function saveMemoInline(nativeValue: string) {
    if (props.busy || memoSavingRef.current) return;
    const finalValue = clampFactoryDeliveryMemo(nativeValue);
    setMemoDraft(finalValue);
    if (finalValue === memoActivationValueRef.current) return;
    memoSavingRef.current = true;
    const saved = await props.onSaveMemo(finalValue);
    if (saved) memoActivationValueRef.current = finalValue;
    else setMemoDraft(props.factoryDeliveryMemo ?? "");
    memoSavingRef.current = false;
  }

  return (
    <View style={styles.container} testID="work-order-image-gallery">
      <View style={styles.compactActions} testID="work-order-image-compact-actions">
        <Pressable
          accessibilityLabel="사진 보관함에서 작업지시서 이미지 선택"
          disabled={!props.canEdit || props.busy}
          onPress={() => props.onAcquire("library")}
          style={({ pressed }) => [styles.compactAction, (!props.canEdit || props.busy) && styles.disabled, pressed && styles.pressed]}
          testID="work-order-image-library"
        >
          <Images color="#23375a" size={18} /><Text style={styles.compactActionText}>사진</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="카메라로 작업지시서 이미지 촬영"
          disabled={!props.canEdit || props.busy}
          onPress={() => props.onAcquire("camera")}
          style={({ pressed }) => [styles.compactAction, (!props.canEdit || props.busy) && styles.disabled, pressed && styles.pressed]}
          testID="work-order-image-camera"
        >
          <Camera color="#23375a" size={18} /><Text style={styles.compactActionText}>카메라</Text>
        </Pressable>
        <View accessibilityLabel="스케치, 준비 중" style={[styles.compactAction, styles.disabled]} testID="work-order-image-sketch">
          <PencilLine color="#23375a" size={18} /><Text style={styles.compactActionText}>스케치</Text>
        </View>
        <Pressable
          accessibilityLabel="일반 첨부파일 선택"
          disabled={!props.canEdit || props.busy}
          onPress={props.onAcquireAttachment}
          style={({ pressed }) => [styles.compactAction, (!props.canEdit || props.busy) && styles.disabled, pressed && styles.pressed]}
          testID="work-order-image-attachment"
        >
          <Paperclip color="#23375a" size={18} /><Text style={styles.compactActionText}>첨부</Text>
        </Pressable>
      </View>

      {props.busy && !props.busyImageId ? (
        <View style={styles.progress}><ActivityIndicator color="#9b4a27" /><Text style={styles.progressText}>파일을 처리하고 있습니다.</Text></View>
      ) : null}

      {selected ? (
        <View style={styles.carouselCard}>
          <View style={styles.carouselStatus}>
            <Text style={styles.carouselIndex}>{selectedIndex + 1} / {props.images.length}</Text>
            {selected.isRepresentative ? (
              <View style={styles.badge}><Star color="#fff" fill="#fff" size={11} /><Text style={styles.badgeText}>대표</Text></View>
            ) : null}
          </View>
          <View {...swipeResponder.panHandlers} style={styles.preview} testID="work-order-image-swipe-surface">
            <Pressable accessibilityLabel="이미지 전체화면으로 보기" onPress={() => setFullscreen(true)} style={styles.previewPressable}>
              <ImageWithFallback
                accessibilityLabel={selected.optionalTitle ?? "작업지시서 이미지"}
                candidates={[selected.previewUrl, selected.originalUrl, selected.viewUrl]}
                key={`preview-${selected.id}`}
                resizeMode="cover"
                style={styles.image}
              />
              <View style={styles.expandBadge}><Expand color="#fff" size={16} /></View>
            </Pressable>
            <Pressable accessibilityLabel="이전 이미지" disabled={props.images.length < 2} onPress={() => move(-1)} style={[styles.arrow, styles.arrowLeft, props.images.length < 2 && styles.disabled]} testID="work-order-image-previous">
              <ChevronLeft color="#fff" size={24} />
            </Pressable>
            <Pressable accessibilityLabel="다음 이미지" disabled={props.images.length < 2} onPress={() => move(1)} style={[styles.arrow, styles.arrowRight, props.images.length < 2 && styles.disabled]} testID="work-order-image-next">
              <ChevronRight color="#fff" size={24} />
            </Pressable>
            {selectedBusy ? <View style={styles.busyOverlay}><ActivityIndicator color="#fff" /></View> : null}
          </View>
          {props.canEdit ? (
            <View style={styles.selectedActions}>
              <Pressable
                accessibilityLabel="현재 이미지 대표 지정"
                disabled={props.busy || selected.isRepresentative}
                onPress={() => props.onSetRepresentative(selected)}
                style={({ pressed }) => [styles.selectedAction, (props.busy || selected.isRepresentative) && styles.disabled, pressed && styles.pressed]}
                testID={`work-order-image-primary-${selected.id}`}
              >
                <Star color="#72523f" fill={selected.isRepresentative ? "#72523f" : "transparent"} size={16} />
                <Text style={styles.selectedActionText}>{selected.isRepresentative ? "현재 대표" : "대표 지정"}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="현재 이미지 삭제"
                disabled={props.busy}
                onPress={() => props.onDelete(selected)}
                style={({ pressed }) => [styles.selectedAction, styles.deleteAction, props.busy && styles.disabled, pressed && styles.pressed]}
                testID={`work-order-image-delete-${selected.id}`}
              >
                <Trash2 color="#a13b35" size={16} /><Text style={[styles.selectedActionText, styles.deleteText]}>삭제</Text>
              </Pressable>
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.thumbnailStrip} horizontal showsHorizontalScrollIndicator={false} testID="work-order-image-thumbnail-strip">
            {props.images.map((image, index) => (
              <Pressable
                accessibilityLabel={`${index + 1}번째 이미지${image.isRepresentative ? ", 대표" : ""}`}
                key={image.id}
                onPress={() => setSelectedId(image.id)}
                style={[styles.thumbnail, image.id === selected.id && styles.thumbnailSelected]}
              >
                <ImageWithFallback
                  accessibilityLabel=""
                  candidates={[image.thumbnailUrl, image.previewUrl, image.originalUrl, image.viewUrl]}
                  key={`thumbnail-${image.id}`}
                  resizeMode="cover"
                  style={styles.thumbnailImage}
                />
                {image.isRepresentative ? <Star color="#fff" fill="#fff" size={9} style={styles.thumbnailStar} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.empty}>
          <Images color="#8a7d70" size={28} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>등록된 이미지가 없습니다.</Text>
          <Text style={styles.emptyBody}>첫 이미지를 추가하면 서버 정책에 따라 대표로 지정됩니다.</Text>
        </View>
      )}

      <View style={styles.infoSection} testID="work-order-attachment-list">
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>첨부 목록</Text><Text style={styles.sectionCount}>{attachmentListSummary(props.attachments)}</Text></View>
        {props.attachments.length === 0 ? <Text style={styles.emptyLine}>등록된 첨부가 없습니다.</Text> : props.attachments.map((attachment) => (
          <View key={attachment.id} style={styles.attachmentRow}>
            <FileText color="#72523f" size={17} />
            <Pressable accessibilityLabel={`${attachment.filename} 열기`} onPress={() => props.onOpenAttachment(attachment)} style={styles.attachmentText}>
              <Text numberOfLines={1} style={styles.attachmentName}>{attachment.filename}</Text>
              <Text style={styles.attachmentOpen}>{formatAttachmentBytes(attachment.sizeBytes)} · 눌러서 열기</Text>
            </Pressable>
            {props.canEdit ? (
              <Pressable accessibilityLabel={`${attachment.filename} 삭제`} disabled={props.busy} onPress={() => props.onDeleteAttachment(attachment)} style={props.busy && styles.disabled}>
                <Trash2 color="#a13b35" size={17} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.infoSection} testID="work-order-factory-delivery-memo">
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>공장 전달 메모</Text></View>
        {props.canEdit ? (
          <>
            <TextInput
              ref={memoInputRef}
              accessibilityLabel="공장 전달 메모 입력"
              editable={!props.busy}
              maxLength={FACTORY_DELIVERY_MEMO_MAX_LENGTH}
              multiline
              onChangeText={(value) => setMemoDraft(clampFactoryDeliveryMemo(value))}
              onEndEditing={(event) => {
                memoFocusedRef.current = false;
                void saveMemoInline(event.nativeEvent.text);
              }}
              onFocus={() => {
                memoFocusedRef.current = true;
                memoActivationValueRef.current = props.factoryDeliveryMemo ?? "";
                setMemoDraft(props.factoryDeliveryMemo ?? "");
                if (memoInputRef.current) props.onFocusTarget?.(memoInputRef.current);
              }}
              placeholder="공장에 전달할 내용을 입력하세요."
              style={styles.memoInput}
              testID="work-order-factory-delivery-memo-input"
              textAlignVertical="top"
              value={memoDraft}
            />
            <Text style={styles.memoCounter} testID="work-order-factory-delivery-memo-counter">
              {memoLength}자 / {FACTORY_DELIVERY_MEMO_MAX_LENGTH}자
            </Text>
          </>
        ) : (
          <Text style={props.factoryDeliveryMemo ? styles.memoText : styles.emptyLine}>
            {props.factoryDeliveryMemo || "등록된 공장 전달 메모가 없습니다."}
          </Text>
        )}
      </View>

      <Modal animationType="fade" onRequestClose={() => setFullscreen(false)} presentationStyle="fullScreen" visible={fullscreen}>
        <View style={styles.fullscreen}>
          <Pressable accessibilityLabel="전체화면 닫기" onPress={() => setFullscreen(false)} style={styles.fullscreenClose}>
            <X color="#fff" size={26} />
          </Pressable>
          {selected ? (
            <ImageWithFallback
              accessibilityLabel="작업지시서 이미지 전체화면"
              candidates={[selected.fullscreenUrl, selected.originalUrl, selected.previewUrl, selected.viewUrl]}
              key={`fullscreen-${selected.id}`}
              resizeMode="contain"
              style={styles.fullscreenImage}
            />
          ) : null}
          <Text style={styles.fullscreenIndex}>{selectedIndex + 1} / {props.images.length}</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 12, paddingBottom: 22 },
  compactActions: { flexDirection: "row", gap: 6 },
  compactAction: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#d3c5b6", borderRadius: 10, borderWidth: 1, flex: 1, gap: 3, justifyContent: "center", minHeight: 54, paddingHorizontal: 3, paddingVertical: 7 },
  compactActionText: { color: "#23375a", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.68 },
  progress: { alignItems: "center", flexDirection: "row", gap: 8 },
  progressText: { color: "#6f6257", fontFamily: WAFL_FONTS.medium, fontSize: 11 },
  carouselCard: { backgroundColor: "#fffaf2", borderColor: "#dfd3c4", borderRadius: 14, borderWidth: 1, overflow: "hidden", padding: 9 },
  carouselStatus: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  carouselIndex: { color: "#4d5563", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  badge: { alignItems: "center", backgroundColor: "#9b4a27", borderRadius: 999, flexDirection: "row", gap: 3, paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 9 },
  preview: { backgroundColor: "#eee7dc", borderRadius: 11, height: 248, overflow: "hidden", position: "relative", width: "100%" },
  previewPressable: { height: "100%", width: "100%" },
  image: { height: "100%", width: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  expandBadge: { backgroundColor: "rgba(23,38,61,0.66)", borderRadius: 999, padding: 8, position: "absolute", right: 8, top: 8 },
  arrow: { alignItems: "center", backgroundColor: "rgba(23,38,61,0.64)", borderRadius: 999, height: 38, justifyContent: "center", marginTop: -19, position: "absolute", top: "50%", width: 38 },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  busyOverlay: { alignItems: "center", backgroundColor: "rgba(23,38,61,0.55)", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 },
  selectedActions: { flexDirection: "row", gap: 7, marginTop: 9 },
  selectedAction: { alignItems: "center", borderColor: "#d2c4b5", borderRadius: 9, borderWidth: 1, flex: 1, flexDirection: "row", gap: 5, justifyContent: "center", minHeight: 38, paddingHorizontal: 8 },
  selectedActionText: { color: "#72523f", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  deleteAction: { borderColor: "#e0b8b2" },
  deleteText: { color: "#a13b35" },
  thumbnailStrip: { gap: 7, paddingTop: 10 },
  thumbnail: { alignItems: "center", backgroundColor: "#eee7dc", borderColor: "transparent", borderRadius: 8, borderWidth: 2, height: 52, justifyContent: "center", overflow: "hidden", position: "relative", width: 52 },
  thumbnailSelected: { borderColor: "#9b4a27" },
  thumbnailImage: { height: "100%", width: "100%" },
  thumbnailStar: { backgroundColor: "#9b4a27", borderRadius: 8, padding: 2, position: "absolute", right: 2, top: 2 },
  empty: { alignItems: "center", backgroundColor: "#f5eee4", borderColor: "#ded1c2", borderRadius: 12, borderStyle: "dashed", borderWidth: 1, gap: 4, justifyContent: "center", minHeight: 180, padding: 20 },
  emptyTitle: { color: "#4f463f", fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  emptyBody: { color: "#7b6f64", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 15, textAlign: "center" },
  infoSection: { backgroundColor: "#f8f2e9", borderColor: "#e2d5c7", borderRadius: 12, borderWidth: 1, gap: 8, padding: 11 },
  sectionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: "#403933", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  sectionCount: { color: "#7f7164", fontFamily: WAFL_FONTS.bold, fontSize: 9 },
  emptyLine: { color: "#8a7d70", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 16 },
  attachmentRow: { alignItems: "center", backgroundColor: "#fffdf8", borderRadius: 9, flexDirection: "row", gap: 8, minHeight: 48, padding: 8 },
  attachmentText: { flex: 1, minWidth: 0 },
  attachmentName: { color: "#4b433c", fontFamily: WAFL_FONTS.semibold, fontSize: 10 },
  attachmentOpen: { color: "#8a7d70", fontFamily: WAFL_FONTS.regular, fontSize: 8, marginTop: 2 },
  memoText: { color: "#4f463f", fontFamily: WAFL_FONTS.regular, fontSize: 11, lineHeight: 18 },
  memoReadSurface: { borderRadius: 9, minHeight: 44, paddingHorizontal: 2, paddingVertical: 8 },
  memoInput: { backgroundColor: "#fffdf8", borderColor: "#cfc0af", borderRadius: 9, borderWidth: 1, color: "#403933", fontFamily: WAFL_FONTS.regular, fontSize: 11, minHeight: 108, padding: 10 },
  memoCounter: { color: "#817469", fontFamily: WAFL_FONTS.medium, fontSize: 10, marginTop: -3, textAlign: "right" },
  memoActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  memoButton: { alignItems: "center", borderColor: "#cfc0af", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 36, paddingHorizontal: 12 },
  memoButtonText: { color: "#72523f", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  memoSave: { backgroundColor: "#9b4a27", borderColor: "#9b4a27" },
  memoSaveText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 10 },
  fullscreen: { alignItems: "center", backgroundColor: "#080b10", flex: 1, justifyContent: "center" },
  fullscreenImage: { height: "100%", width: "100%" },
  fullscreenClose: { backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 999, padding: 9, position: "absolute", right: 18, top: 52, zIndex: 2 },
  fullscreenIndex: { bottom: 32, color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12, position: "absolute" },
});
