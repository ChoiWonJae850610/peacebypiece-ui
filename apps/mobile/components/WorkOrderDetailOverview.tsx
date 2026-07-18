import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import type { WorkOrderDetailCore, WorkOrderStatus } from "@/lib/apiTypes";

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  draft: "작성중", ready_to_issue: "발행 준비", issued: "발행됨", revised: "정정 작성중", completed: "완료", cancelled: "취소",
};

function amount(value: string, currency: string) {
  const numeric = Number(value);
  return `${Number.isFinite(numeric) ? numeric.toLocaleString("ko-KR") : value} ${currency}`;
}

const COUNT_LABELS: Record<keyof WorkOrderDetailCore["tabCounts"], string> = {
  fabric: "원단", accessory: "부자재", colors: "색상", sizes: "사이즈", processes: "공정",
  images: "이미지", attachments: "첨부", documents: "문서", history: "이력",
};

function documentStatusLabel(status: string | null) {
  if (!status) return "없음";
  return ({ pending: "생성 대기", generated: "생성 완료", failed: "생성 실패", revoked: "공유 취소", deleted: "삭제됨" } as Record<string, string>)[status] ?? "상태 확인";
}

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><Text style={styles.fieldValue}>{value}</Text></View>;
}

type Props = { readonly detail: WorkOrderDetailCore; readonly phone: boolean; readonly onBack: () => void };

export default function WorkOrderDetailOverview({ detail, phone, onBack }: Props) {
  const { header } = detail;
  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        {phone ? (
          <Pressable accessibilityLabel="제작 카드 목록으로 돌아가기" accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ChevronLeft color="#3f352d" size={22} /><Text style={styles.backText}>목록</Text>
          </Pressable>
        ) : null}
        <View style={styles.headingMain}>
          <Text numberOfLines={2} style={styles.title}>{header.productName}</Text>
          <Text style={styles.subtitle}>상세 개요 · 읽기 전용</Text>
        </View>
        <Text style={styles.status}>{STATUS_LABEL[header.status]}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.priorityRow}>
          <View style={styles.priorityMetric}><Text style={styles.priorityLabel}>수량</Text><Text style={styles.priorityValue}>{header.totalQuantity.toLocaleString("ko-KR")}</Text></View>
          <View style={styles.priorityMetric}><Text style={styles.priorityLabel}>납기</Text><Text style={styles.priorityValue}>{header.dueDate ?? "미정"}</Text></View>
          <View style={styles.priorityMetric}><Text style={styles.priorityLabel}>Revision</Text><Text style={styles.priorityValue}>R{header.currentRevisionNumber}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.grid}>
            <Field label="제품 유형" value={header.productTypeAlias ?? header.productTypeCode ?? "미정"} />
            <Field label="시즌" value={header.seasonCode ?? "미정"} />
            <Field label="품목 코드" value={header.itemCode ?? "미정"} />
            <Field label="Entity version" value={String(header.entityVersion)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>준비 상태</Text>
          <Text style={styles.readiness}>{header.readiness.canIssue ? "발행 준비 충족" : `필수 확인 ${header.readiness.hardBlockers.length}개`}</Text>
          {header.readiness.hardBlockers.map((item) => <Text key={item.code} style={styles.issue}>• {item.message}</Text>)}
          {header.readiness.warnings.map((item) => <Text key={item.code} style={styles.warning}>• {item.message}</Text>)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>금액 요약</Text>
          <View style={styles.grid}>
            <Field label="단가" value={amount(detail.amounts.unitPrice, detail.amounts.currency)} />
            <Field label="원단" value={amount(detail.amounts.fabricTotal, detail.amounts.currency)} />
            <Field label="부자재" value={amount(detail.amounts.accessoryTotal, detail.amounts.currency)} />
            <Field label="공정" value={amount(detail.amounts.processTotal, detail.amounts.currency)} />
          </View>
          <Text style={styles.total}>예상 합계 {amount(detail.amounts.estimatedTotal, detail.amounts.currency)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>포함 개수 요약</Text>
          <View style={styles.chips}>
            {(Object.entries(detail.tabCounts) as [keyof WorkOrderDetailCore["tabCounts"], number][]).map(([label, value]) => <Text key={label} style={styles.chip}>{COUNT_LABELS[label]} {value}</Text>)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>문서 요약</Text>
          <Field label="상태" value={documentStatusLabel(header.document.status)} />
          <Field label="문서 번호" value={header.document.displayDocumentNumber ?? "없음"} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  headingRow: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 12 },
  headingMain: { flex: 1, minWidth: 0 },
  title: { color: "#17263d", fontFamily: WAFL_FONTS.black, fontSize: 21, lineHeight: 27 },
  subtitle: { color: "#776b60", fontFamily: WAFL_FONTS.regular, fontSize: 11, marginTop: 2 },
  status: { backgroundColor: "#f2e2d3", borderRadius: 999, color: "#874423", fontFamily: WAFL_FONTS.bold, fontSize: 11, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5 },
  backButton: { alignItems: "center", flexDirection: "row", minHeight: 44, paddingRight: 4 },
  backText: { color: "#3f352d", fontFamily: WAFL_FONTS.semibold, fontSize: 14 },
  pressed: { opacity: 0.68 },
  body: { gap: 11, paddingBottom: 30 },
  priorityRow: { backgroundColor: "#17263d", borderRadius: 15, flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 15 },
  priorityMetric: { flexGrow: 1, minWidth: 90 },
  priorityLabel: { color: "#bdc7d5", fontFamily: WAFL_FONTS.medium, fontSize: 10, marginBottom: 3 },
  priorityValue: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 15 },
  section: { backgroundColor: "#fffdf8", borderColor: "#dfd5c8", borderRadius: 15, borderWidth: 1, gap: 10, padding: 15 },
  sectionTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  field: { flexGrow: 1, minWidth: 105 },
  fieldLabel: { color: "#897c70", fontFamily: WAFL_FONTS.medium, fontSize: 10, marginBottom: 3 },
  fieldValue: { color: "#3d352e", fontFamily: WAFL_FONTS.semibold, fontSize: 13 },
  readiness: { color: "#3d5b2f", fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  issue: { color: "#a33d33", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 18 },
  warning: { color: "#8a631e", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 18 },
  total: { borderTopColor: "#eee4d8", borderTopWidth: 1, color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 14, paddingTop: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: "#f2ece3", borderRadius: 999, color: "#61564b", fontFamily: WAFL_FONTS.medium, fontSize: 11, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5 },
});
