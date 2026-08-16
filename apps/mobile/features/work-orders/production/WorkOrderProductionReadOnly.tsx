import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WorkOrderProcesses, WorkOrderProcessStatus } from "@/domain/mobileContract";
import WaflSectionCard from "@/features/layout/WaflSectionCard";
import { getWorkOrderProcesses } from "@/lib/api/workOrdersApi";

const FLOW_LABELS = {
  order: "발주",
  material: "자재",
  cutting: "재단",
  process: "공정",
  inspection: "검수",
  shipment: "출고",
} as const;

const STATUS_LABELS: Record<WorkOrderProcessStatus, string> = {
  ready: "준비",
  in_progress: "작업중",
  completed: "완료",
};

export default function WorkOrderProductionReadOnly({ workOrderId }: { readonly workOrderId: string }) {
  const [data, setData] = useState<WorkOrderProcesses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void getWorkOrderProcesses(workOrderId).then((next) => {
      if (!active) return;
      setData(next);
      setError(null);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError("제작 정보를 불러오지 못했습니다.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey, workOrderId]);

  function retry() {
    setLoading(true);
    setError(null);
    setRefreshKey((current) => current + 1);
  }

  return <View style={styles.container} testID="work-order-production-read-only">
    <WaflSectionCard title="제작 흐름">
      {loading ? <Text style={styles.meta}>제작 정보를 불러오는 중입니다.</Text> : error ? <View style={styles.errorPanel}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable accessibilityLabel="제작 정보 다시 불러오기" accessibilityRole="button" onPress={retry} style={styles.retry}><RefreshCw color={WAFL_THEME.color.navyInk} size={16}/></Pressable>
      </View> : <>
        <View style={styles.flowRail}>{data?.flowSummary.map((step) => <View key={step.stepCode} style={styles.flowStep}>
          <View style={[styles.flowDot, step.status === "completed" && styles.flowDotComplete, step.status === "in_progress" && styles.flowDotActive]}/>
          <Text style={styles.flowLabel}>{FLOW_LABELS[step.stepCode]}</Text>
          <Text style={styles.flowStatus}>{STATUS_LABELS[step.status]}</Text>
        </View>)}</View>
        <Text style={styles.meta}>현재 제작 단계와 등록된 세부 공정을 읽기 전용으로 표시합니다.</Text>
      </>}
    </WaflSectionCard>
    {!loading && !error ? <WaflSectionCard title={`세부 공정 ${data?.processes.length ?? 0}개`}>
      {data?.processes.length ? data.processes.map((process) => <View key={process.id} style={styles.processRow}>
        <View style={styles.processHeading}><Text style={styles.processName}>{process.processName}</Text><Text style={styles.statusBadge}>{STATUS_LABELS[process.status]}</Text></View>
        <Text style={styles.processMeta}>{process.partnerName ?? "업체 미지정"} · {process.quantity} {process.unitCode} · {process.dueDate ?? "납기 미지정"}</Text>
        {process.memo ? <Text style={styles.memo}>{process.memo}</Text> : null}
      </View>) : <Text style={styles.meta}>등록된 세부 공정이 없습니다.</Text>}
    </WaflSectionCard> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: WAFL_THEME.layout.sectionGap, paddingBottom: WAFL_THEME.layout.sectionGapLarge, paddingHorizontal: WAFL_THEME.layout.cardPadding },
  errorPanel: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.controlGap, justifyContent: "space-between" },
  errorText: { color: WAFL_THEME.color.error, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  retry: { alignItems: "center", justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, minWidth: WAFL_THEME.touch.minimum },
  flowRail: { flexDirection: "row", justifyContent: "space-between" },
  flowStep: { alignItems: "center", flex: 1, gap: 3, minWidth: 0 },
  flowDot: { backgroundColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.pill, height: 10, width: 10 },
  flowDotActive: { backgroundColor: WAFL_THEME.color.brickOrange },
  flowDotComplete: { backgroundColor: WAFL_THEME.color.olive },
  flowLabel: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.meta.fontSize },
  flowStatus: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.badge.fontSize },
  meta: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.body, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight },
  processRow: { borderTopColor: WAFL_THEME.color.border, borderTopWidth: StyleSheet.hairlineWidth, gap: 3, paddingVertical: WAFL_THEME.spacing.sm },
  processHeading: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.controlGap, justifyContent: "space-between" },
  processName: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  statusBadge: { backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.pill, color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.badge.fontSize, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  processMeta: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize },
  memo: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.body, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
});
