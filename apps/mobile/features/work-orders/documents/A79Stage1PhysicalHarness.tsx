import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import {
  isA79Stage1PhysicalHarnessEnabled,
  resolveA79Stage1PhysicalHarnessScenario,
  type A79Stage1HarnessState,
} from "./stage1PhysicalHarnessModel";

const STATE_OPTIONS: readonly { readonly key: A79Stage1HarnessState; readonly label: string }[] = [
  { key: "none", label: "B 없음" },
  { key: "pending", label: "B 생성 중" },
  { key: "failed", label: "B 생성 실패" },
  { key: "generated", label: "B 생성 완료" },
];

const HARNESS_ENVIRONMENT = {
  dev: __DEV__,
  externalQa: process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA,
} as const;

export const A79_STAGE1_PHYSICAL_HARNESS_ENABLED = isA79Stage1PhysicalHarnessEnabled(HARNESS_ENVIRONMENT);

function DiagnosticRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.diagnosticRow}>
      <Text style={styles.diagnosticLabel}>{label}</Text>
      <Text selectable style={styles.diagnosticValue}>{value}</Text>
    </View>
  );
}

export default function A79Stage1PhysicalHarness({ visible, onClose }: {
  readonly visible: boolean;
  readonly onClose: () => void;
}) {
  const [state, setState] = useState<A79Stage1HarnessState>("none");
  const [generationRetryCount, setGenerationRetryCount] = useState(0);
  const [lastAction, setLastAction] = useState("없음");
  const scenario = useMemo(
    () => resolveA79Stage1PhysicalHarnessScenario(state, HARNESS_ENVIRONMENT),
    [state],
  );

  if (!A79_STAGE1_PHYSICAL_HARNESS_ENABLED || !scenario) return null;

  const { model } = scenario;
  const record = (action: "보기" | "저장" | "공유", documentId: string | null) => {
    if (!documentId) return;
    setLastAction(`${action}: ${documentId}`);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.safe} testID="a79-stage1-physical-harness">
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>DEV / TEST ONLY</Text>
            <Text style={styles.title}>A79 리비전 문서 QA</Text>
            <Text style={styles.subtitle}>과거 A 생성본이 있어도 현재 B만 액션을 소유하는지 확인합니다.</Text>
          </View>
          <Pressable accessibilityLabel="A79 문서 QA 닫기" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.stateGrid}>
            {STATE_OPTIONS.map((option) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: state === option.key }}
                key={option.key}
                onPress={() => { setState(option.key); setLastAction("없음"); }}
                style={[styles.stateButton, state === option.key && styles.stateButtonSelected]}
              >
                <Text style={[styles.stateButtonText, state === option.key && styles.stateButtonTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>현재 상태 · {model.state}</Text>
            {model.state === "none" ? <Text style={styles.statusCopy}>현재 리비전의 PDF가 없습니다.</Text> : null}
            {model.state === "pending" ? <Text style={styles.statusCopy}>PDF를 생성 중입니다.</Text> : null}
            {model.state === "failed" ? <Text style={styles.statusCopy}>현재 리비전 PDF 생성에 실패했습니다.</Text> : null}
            {model.state === "generated" ? <Text style={styles.statusCopy}>현재 리비전 B의 PDF가 생성되었습니다.</Text> : null}
          </View>

          <View style={styles.actionRow}>
            {model.canView ? <Pressable accessibilityRole="button" onPress={() => record("보기", model.viewDocumentId)} style={styles.actionButton}><Text style={styles.actionText}>보기</Text></Pressable> : null}
            {model.canSave ? <Pressable accessibilityRole="button" onPress={() => record("저장", model.saveDocumentId)} style={styles.actionButton}><Text style={styles.actionText}>저장</Text></Pressable> : null}
            {model.canShare ? <Pressable accessibilityRole="button" onPress={() => record("공유", model.shareDocumentId)} style={styles.actionButton}><Text style={styles.actionText}>공유</Text></Pressable> : null}
            {model.canRetry ? (
              <Pressable accessibilityRole="button" onPress={() => { setGenerationRetryCount((count) => count + 1); setLastAction(`PDF 다시 생성: ${model.retryTarget?.id ?? "없음"}`); }} style={styles.actionButtonPrimary}>
                <Text style={styles.actionTextPrimary}>PDF 다시 생성</Text>
              </Pressable>
            ) : null}
          </View>

          {model.tokenDocumentId ? (
            <View style={styles.tokenCard} testID="a79-stage1-token-owner">
              <Text style={styles.tokenTitle}>공유 링크 관리</Text>
              <Text style={styles.tokenCopy}>{scenario.currentTokens.map((item) => item.tokenId).join(", ") || "현재 토큰 없음"}</Text>
            </View>
          ) : null}

          <View style={styles.diagnostics}>
            <Text style={styles.diagnosticsTitle}>진단</Text>
            <DiagnosticRow label="current revision" value={scenario.currentRevisionId} />
            <DiagnosticRow label="resolved state" value={model.state} />
            <DiagnosticRow label="view target" value={model.viewDocumentId ?? "없음"} />
            <DiagnosticRow label="save target" value={model.saveDocumentId ?? "없음"} />
            <DiagnosticRow label="share target" value={model.shareDocumentId ?? "없음"} />
            <DiagnosticRow label="viewer target" value={model.viewerDocumentId ?? "없음"} />
            <DiagnosticRow label="token owner" value={model.tokenDocumentId ?? "없음"} />
            <DiagnosticRow label="retry count" value={String(generationRetryCount)} />
            <DiagnosticRow label="Recipe issue count" value="0" />
            <DiagnosticRow label="last safe action" value={lastAction} />
            <DiagnosticRow label="historical A present" value={scenario.documents.some((item) => item.id === "doc-a-generated") ? "yes" : "no"} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: WAFL_THEME.color.paperMuted, flex: 1 },
  header: { alignItems: "flex-start", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", padding: 18 },
  headerCopy: { flex: 1, gap: 4, minWidth: 0 },
  eyebrow: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.bold, fontSize: 10, letterSpacing: 0.8 },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 22 },
  subtitle: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18 },
  closeButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.field, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  closeText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  body: { gap: 14, padding: 18, paddingBottom: 40 },
  stateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stateButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.field, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 13 },
  stateButtonSelected: { backgroundColor: WAFL_THEME.color.deepNavy, borderColor: WAFL_THEME.color.deepNavy },
  stateButtonText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  stateButtonTextSelected: { color: "#fffdf8" },
  statusCard: { backgroundColor: WAFL_THEME.color.paper, borderRadius: WAFL_THEME.radius.card, gap: 5, padding: 14 },
  statusTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 15 },
  statusCopy: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.deepNavy, borderRadius: WAFL_THEME.radius.field, borderWidth: 1, justifyContent: "center", minHeight: 44, minWidth: 72, paddingHorizontal: 14 },
  actionButtonPrimary: { alignItems: "center", backgroundColor: WAFL_THEME.color.deepNavy, borderRadius: WAFL_THEME.radius.field, justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  actionText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  actionTextPrimary: { color: "#fffdf8", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  tokenCard: { backgroundColor: "#eef1f6", borderRadius: WAFL_THEME.radius.card, gap: 4, padding: 12 },
  tokenTitle: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  tokenCopy: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: 12 },
  diagnostics: { backgroundColor: "#23272f", borderRadius: WAFL_THEME.radius.card, gap: 2, padding: 12 },
  diagnosticsTitle: { color: "#ffffff", fontFamily: WAFL_FONTS.bold, fontSize: 14, marginBottom: 6 },
  diagnosticRow: { alignItems: "flex-start", borderTopColor: "#3d424c", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10, paddingVertical: 7 },
  diagnosticLabel: { color: "#aeb6c2", fontFamily: WAFL_FONTS.medium, fontSize: 10, width: 118 },
  diagnosticValue: { color: "#ffffff", flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 11 },
});
