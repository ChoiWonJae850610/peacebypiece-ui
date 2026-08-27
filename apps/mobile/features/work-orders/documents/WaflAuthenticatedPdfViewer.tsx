import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { RefreshCw } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import {
  downloadAuthenticatedDocumentPdf,
  type AuthenticatedDocumentPdfFile,
} from "./authenticatedPdfTransport";
import { returnToWorkOrderDocument } from "./pdfViewerInteractionPolicy";
import WaflPrimaryActionButton from "@/features/inputs/WaflPrimaryActionButton";

type ViewerState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly file: AuthenticatedDocumentPdfFile }
  | { readonly kind: "error" };

export default function WaflAuthenticatedPdfViewer({
  displayDocumentNumber,
  documentId,
  inlineUrl,
  preview,
  onClose,
  visible,
}: {
  readonly displayDocumentNumber: string;
  readonly documentId?: string;
  readonly inlineUrl: string;
  readonly preview?: { readonly workOrderId: string; readonly revisionId: string };
  readonly onClose: () => void;
  readonly visible: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [state, setState] = useState<ViewerState>({ kind: "loading" });
  const activeFileRef = useRef<AuthenticatedDocumentPdfFile | null>(null);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setState({ kind: "loading" });
      setPage(1);
      setPageCount(0);
      try {
        const file = await downloadAuthenticatedDocumentPdf({ documentId, inlineUrl, preview });
        if (cancelled) {
          void file.dispose();
          return;
        }
        activeFileRef.current = file;
        setState({ kind: "ready", file });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    });

    return () => {
      cancelled = true;
      const file = activeFileRef.current;
      activeFileRef.current = null;
      if (file) void file.dispose();
    };
  }, [attempt, documentId, inlineUrl, preview?.revisionId, preview?.workOrderId, visible]);

  const source = useMemo(() => state.kind === "ready"
    ? { uri: `file://${state.file.path}` }
    : null, [state]);
  const handleReturnToDocument = useCallback(() => {
    returnToWorkOrderDocument(onClose);
  }, [onClose]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleReturnToDocument}
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      visible={visible}
    >
      <SafeAreaView edges={["top", "bottom"]} style={styles.safe} testID="authenticated-pdf-viewer">
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.title}>작업지시서 보기</Text>
            <Text numberOfLines={1} style={styles.documentNumber}>{displayDocumentNumber}</Text>
          </View>
        </View>

        <View style={styles.viewerFrame}>
          {source ? (
            <Pdf
              enableDoubleTapZoom
              fitPolicy={0}
              horizontal={false}
              maxScale={3}
              minScale={1}
              onError={() => setState({ kind: "error" })}
              onLoadComplete={(nextPageCount) => {
                setPageCount(nextPageCount);
                setPage(1);
              }}
              onPageChanged={(nextPage, nextPageCount) => {
                setPage(nextPage);
                setPageCount(nextPageCount);
              }}
              showsVerticalScrollIndicator
              source={source}
              spacing={12}
              style={styles.pdf}
              trustAllCerts={false}
            />
          ) : state.kind === "loading" ? (
            <View style={styles.center} testID="authenticated-pdf-viewer-loading">
              <ActivityIndicator color={WAFL_THEME.color.brickOrange} size="large" />
              <Text style={styles.stateText}>PDF를 불러오고 있습니다.</Text>
            </View>
          ) : (
            <View style={styles.center} testID="authenticated-pdf-viewer-error">
              <Text style={styles.errorTitle}>PDF를 불러오지 못했습니다.</Text>
              <Text style={styles.stateText}>연결 상태를 확인한 뒤 다시 시도해 주세요.</Text>
              <Pressable
                accessibilityLabel="PDF 다시 불러오기"
                accessibilityRole="button"
                onPress={() => setAttempt((current) => current + 1)}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                testID="authenticated-pdf-viewer-retry"
              >
                <RefreshCw color="#fffdf8" size={17} strokeWidth={2.2} />
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View pointerEvents="auto" style={styles.viewerFooter} testID="authenticated-pdf-viewer-footer">
          <Text accessibilityLiveRegion="polite" style={styles.pageText} testID="authenticated-pdf-viewer-page-indicator">
            {pageCount > 0 ? `${page} / ${pageCount}` : "- / -"}
          </Text>
          <WaflPrimaryActionButton accessibilityLabel="작업지시서 보기 닫기" label="닫기" onPress={handleReturnToDocument} testID="authenticated-pdf-viewer-close" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: WAFL_THEME.color.paper, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: WAFL_THEME.color.paper,
    borderBottomColor: WAFL_THEME.color.border,
    borderBottomWidth: WAFL_THEME.border.hairline,
    minHeight: 56,
    paddingHorizontal: WAFL_THEME.spacing.sm,
    position: "relative",
    zIndex: 2,
  },
  titleBlock: { alignItems: "center", flex: 1, minWidth: 0 },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 15 },
  documentNumber: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 10, marginTop: 2 },
  viewerFrame: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1, overflow: "hidden", position: "relative", zIndex: 0 },
  pdf: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1, width: "100%" },
  center: { alignItems: "center", flex: 1, gap: 10, justifyContent: "center", padding: WAFL_THEME.spacing.xl },
  stateText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.body, fontSize: 12, lineHeight: 18, textAlign: "center" },
  errorTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 14 },
  retryButton: {
    alignItems: "center",
    backgroundColor: WAFL_THEME.color.navyInk,
    borderRadius: WAFL_THEME.radius.card,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: WAFL_THEME.spacing.xs,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  retryText: { color: "#fffdf8", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  viewerFooter: {
    alignItems: "center",
    backgroundColor: WAFL_THEME.color.paper,
    borderTopColor: WAFL_THEME.color.border,
    borderTopWidth: WAFL_THEME.border.hairline,
    gap: WAFL_THEME.spacing.xs,
    paddingBottom: WAFL_THEME.spacing.sm,
    paddingHorizontal: WAFL_THEME.spacing.sm,
    paddingTop: WAFL_THEME.spacing.xs,
    position: "relative",
    zIndex: 3,
  },
  pageText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: 10, textAlign: "center" },
  pressed: { opacity: 0.68 },
});
