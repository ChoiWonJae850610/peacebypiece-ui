import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import type { SizeColorCacheEntry } from "./sizeColorCache";
import type { SizeColorStructureEditBoundary } from "./useSizeColorStructureEditController";
import {
  displayMeasurement,
  formatDecimal,
  quantityCellMap,
  sizeSpecCellMap,
  sumQuantities,
  type MeasurementDisplayUnit,
} from "./sizeColorDisplayModel";

type Props = {
  readonly identity: string;
  readonly state: SizeColorCacheEntry;
  readonly onRetry: () => void;
  readonly edit?: SizeColorStructureEditBoundary;
};

type UnitSelection = {
  readonly identity: string;
  readonly unit: MeasurementDisplayUnit;
};

const CONTENT_INSET = 12;

function EmptyNotice({ children }: { readonly children: string }) {
  return (
    <View style={styles.contentInset}>
      <Text style={styles.emptyNotice}>{children}</Text>
    </View>
  );
}

function QuantityCellEditor(props: {
  readonly colorId: string;
  readonly sizeRowId: string;
  readonly colorName: string;
  readonly sizeLabel: string;
  readonly value: string;
  readonly edit: SizeColorStructureEditBoundary;
  readonly onEditingChange: (active: boolean) => void;
}) {
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState(props.value);
  return (
    <ControlledInlineEditValue
      accessibilityLabel={`${props.colorName} ${props.sizeLabel} 수량`}
      active={active}
      commitMode="blur-submit"
      dirty={draft !== props.value}
      displayStyle={styles.cellText}
      displayValue={formatDecimal(props.value)}
      editable={!props.edit.busy}
      keyboardType="number-pad"
      maxLength={9}
      onActivate={() => {
        setDraft(props.value);
        setActive(true);
        props.onEditingChange(true);
      }}
      onCancel={() => {
        setDraft(props.value);
        setActive(false);
        props.onEditingChange(false);
      }}
      onChange={setDraft}
      onSave={(value) => {
        const quantity = /^\d+$/.test(value) ? Number(value) : -1;
        void props.edit.onSetQuantity(props.colorId, props.sizeRowId, quantity).then((saved) => {
          if (!saved) setDraft(props.value);
          setActive(false);
          props.onEditingChange(false);
        });
      }}
      placeholder="0"
      saving={props.edit.busy}
      testID={`size-color-quantity-${props.colorId}-${props.sizeRowId}`}
      value={draft}
    />
  );
}

export default function WorkOrderSizeColorReadOnly({ identity, state, onRetry, edit }: Props) {
  const availableSpecifications = state.bundle?.specifications;
  const storedMeasurementUnit = availableSpecifications?.measurementUnit ?? "cm";
  const measurementIdentity = availableSpecifications
    ? `${availableSpecifications.workOrderId}:${availableSpecifications.revisionId}:${availableSpecifications.entityVersion}:${storedMeasurementUnit}`
    : `unavailable:${state.status}`;
  const [unitSelection, setUnitSelection] = useState<UnitSelection>({
    identity: measurementIdentity,
    unit: storedMeasurementUnit,
  });
  const displayUnit = unitSelection.identity === measurementIdentity
    ? unitSelection.unit
    : storedMeasurementUnit;
  const [sectionSessions, setSectionSessions] = useState<Record<string, { readonly quantityExpanded: boolean; readonly measurementExpanded: boolean }>>({});
  const sectionState = sectionSessions[identity] ?? { quantityExpanded: false, measurementExpanded: false };
  const setSectionState = (patch: Partial<typeof sectionState>) => {
    setSectionSessions((current) => ({ ...current, [identity]: { ...sectionState, ...patch } }));
  };

  if (!state.bundle && (state.status === "not-loaded" || state.status === "loading" || state.status === "retrying" || state.status === "refreshing")) {
    return (
      <DelayedLoadingMessage
        identity={`${identity}:size-color`}
        loading
        scope="sizeColor"
      />
    );
  }

  if (state.status === "error" || !state.bundle) {
    return (
      <View style={styles.statePanel}>
        <AlertTriangle color="#a94f32" size={20} />
        <Text style={styles.stateTitle}>사이즈·색상을 불러오지 못했습니다.</Text>
        <Text style={styles.stateText}>{state.errorMessage ?? "연결 상태를 확인한 뒤 다시 시도해 주세요."}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <RefreshCw color="#fffdf8" size={15} />
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  const { matrix, specifications } = state.bundle;
  const quantities = quantityCellMap(matrix.quantityCells);
  const measurements = sizeSpecCellMap(specifications.cells);
  const structuredMatrixEmpty = matrix.sizes.length === 0 && matrix.colors.length === 0 && matrix.quantityCells.length === 0;

  return (
    <View accessibilityLabel="사이즈·색상 읽기 전용 정보" style={styles.container}>
      {!matrix.projectionsMatch ? (
        <View style={styles.contentStack}>
          <View style={styles.warning}>
            <AlertTriangle color="#9a4d2f" size={16} />
            <Text style={styles.warningText}>저장된 총수량과 색상×사이즈 합계가 다릅니다. 수량 셀을 저장하면 합계가 함께 정리됩니다.</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.contentInset}>
          <Pressable
            accessibilityLabel={`색상×사이즈 ${sectionState.quantityExpanded ? "접기" : "펼치기"}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: sectionState.quantityExpanded }}
            onPress={() => setSectionState({ quantityExpanded: !sectionState.quantityExpanded })}
            style={styles.collapsibleHeader}
          >
            <Text style={styles.sectionTitle}>색상×사이즈</Text>
            {sectionState.quantityExpanded ? <ChevronDown color="#23375a" size={18} /> : <ChevronRight color="#23375a" size={18} />}
          </Pressable>
        </View>
        {sectionState.quantityExpanded ? matrix.sizes.length === 0 && matrix.colors.length === 0 ? (
          <EmptyNotice>등록된 사이즈와 색상이 없습니다.</EmptyNotice>
        ) : matrix.sizes.length === 0 ? (
          <EmptyNotice>색상은 있지만 등록된 사이즈가 없어 수량표를 만들 수 없습니다.</EmptyNotice>
        ) : matrix.colors.length === 0 ? (
          <EmptyNotice>사이즈는 있지만 등록된 색상이 없어 수량표를 만들 수 없습니다.</EmptyNotice>
        ) : (
          <>
            {matrix.quantityCells.length === 0 ? <EmptyNotice>등록된 수량 셀이 없어 각 값을 0으로 표시합니다.</EmptyNotice> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.table} nestedScrollEnabled>
              <View>
                <View style={styles.tableRow}>
                  <View style={[styles.cell, styles.nameCell, styles.headerCell]}><Text style={styles.headerText}>색상</Text></View>
                  {matrix.sizes.map((size) => (
                    <View key={size.id} style={[styles.cell, styles.numberCell, styles.headerCell]}><Text style={styles.headerText}>{size.displayLabel}</Text></View>
                  ))}
                  <View style={[styles.cell, styles.numberCell, styles.headerCell]}><Text style={styles.headerText}>행 합계</Text></View>
                </View>
                {matrix.colors.map((color) => {
                  const rowValues = matrix.sizes.map((size) => quantities.get(`${color.id}:${size.id}`) ?? "0");
                  return (
                    <View key={color.id} style={styles.tableRow}>
                      <View style={[styles.cell, styles.nameCell]}>
                        <View style={[styles.swatch, { backgroundColor: color.hexValue ?? "#e7dfd3" }]} />
                        <Text numberOfLines={2} style={styles.cellText}>{color.displayName}</Text>
                      </View>
                      {rowValues.map((value, index) => {
                        const size = matrix.sizes[index];
                        return (
                          <View key={size.id} style={[styles.cell, styles.numberCell]}>
                            {edit?.canEdit ? (
                              <QuantityCellEditor
                                colorId={color.id}
                                colorName={color.displayName}
                                edit={edit}
                              sizeLabel={size.displayLabel}
                              sizeRowId={size.id}
                              onEditingChange={(active) => {
                                if (active) setSectionState({ quantityExpanded: true });
                              }}
                              value={value}
                              />
                            ) : <Text style={styles.cellText}>{formatDecimal(value)}</Text>}
                          </View>
                        );
                      })}
                      <View style={[styles.cell, styles.numberCell, styles.totalCell]}><Text style={styles.totalText}>{formatDecimal(String(sumQuantities(rowValues)))}</Text></View>
                    </View>
                  );
                })}
                <View style={styles.tableRow}>
                  <View style={[styles.cell, styles.nameCell, styles.totalCell]}><Text style={styles.totalText}>열 합계</Text></View>
                  {matrix.sizes.map((size) => {
                    const columnValues = matrix.colors.map((color) => quantities.get(`${color.id}:${size.id}`) ?? "0");
                    return <View key={size.id} style={[styles.cell, styles.numberCell, styles.totalCell]}><Text style={styles.totalText}>{formatDecimal(String(sumQuantities(columnValues)))}</Text></View>;
                  })}
                  <View style={[styles.cell, styles.numberCell, styles.grandTotalCell]}><Text style={styles.grandTotalText}>{formatDecimal(matrix.matrixTotal)}</Text></View>
                </View>
              </View>
            </ScrollView>
          </>
        ) : null}
        {sectionState.quantityExpanded && structuredMatrixEmpty && matrix.memoFallback?.trim() ? (
          <View style={styles.contentInset}>
            <View style={styles.memo}>
              <Text style={styles.memoLabel}>기존 수량 메모</Text>
              <Text style={styles.memoText}>{matrix.memoFallback}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.contentInset}>
          <View style={styles.sectionHeadingRow}>
            <Pressable
              accessibilityLabel={`완성 치수표 ${sectionState.measurementExpanded ? "접기" : "펼치기"}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: sectionState.measurementExpanded }}
              onPress={() => setSectionState({ measurementExpanded: !sectionState.measurementExpanded })}
              style={styles.measurementToggle}
            >
              <Text style={styles.sectionTitle}>완성 치수표</Text>
              {sectionState.measurementExpanded ? <ChevronDown color="#23375a" size={18} /> : <ChevronRight color="#23375a" size={18} />}
            </Pressable>
            {sectionState.measurementExpanded ? <View accessibilityLabel="완성 치수 표시 단위" style={styles.unitSegment}>
              {(["cm", "inch"] as const).map((unit) => {
                const selected = displayUnit === unit;
                return (
                  <Pressable
                    accessibilityHint="표시만 변경하며 저장되지 않습니다."
                    accessibilityLabel={`완성 치수 ${unit} 표시`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    hitSlop={6}
                    key={unit}
                    onPress={() => setUnitSelection({ identity: measurementIdentity, unit })}
                    style={({ pressed }) => [
                      styles.unitOption,
                      selected && styles.unitOptionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.unitText, selected && styles.unitTextSelected]}>{unit}</Text>
                  </Pressable>
                );
              })}
            </View> : null}
          </View>
        </View>
        {sectionState.measurementExpanded ? specifications.pomColumns.length === 0 || specifications.sizes.length === 0 ? (
          <EmptyNotice>등록된 완성 치수 정보가 없습니다.</EmptyNotice>
        ) : (
          <>
            {specifications.cells.length === 0 ? <EmptyNotice>등록된 치수 값이 없어 각 셀을 -로 표시합니다.</EmptyNotice> : null}
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.table} nestedScrollEnabled>
              <View>
                <View style={styles.tableRow}>
                  <View style={[styles.cell, styles.measurementCell, styles.headerCell]}><Text style={styles.headerText}>치수 항목</Text></View>
                  {specifications.sizes.map((size) => (
                    <View key={size.id} style={[styles.cell, styles.numberCell, styles.headerCell]}><Text style={styles.headerText}>{size.displayLabel}</Text></View>
                  ))}
                </View>
                {specifications.pomColumns.map((pom) => (
                  <View key={pom.id} style={styles.tableRow}>
                    <View style={[styles.cell, styles.measurementCell]}><Text numberOfLines={2} style={styles.cellText}>{pom.displayName}</Text></View>
                    {specifications.sizes.map((size) => (
                      <View key={size.id} style={[styles.cell, styles.numberCell]}>
                        <Text style={styles.cellText}>
                          {displayMeasurement(
                            measurements.get(`${pom.id}:${size.id}`),
                            specifications.measurementUnit,
                            displayUnit,
                          )}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 22 },
  contentStack: { gap: 12, paddingHorizontal: CONTENT_INSET, paddingTop: CONTENT_INSET },
  contentInset: { paddingHorizontal: CONTENT_INSET },
  warning: { alignItems: "flex-start", backgroundColor: "#fff3e9", borderColor: "#efd0bc", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, padding: 11 },
  warningText: { color: "#744531", flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18 },
  section: { borderTopColor: "#eee3d5", borderTopWidth: 1, gap: 10, marginTop: 18, paddingTop: 11 },
  sectionHeadingRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  collapsibleHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 44 },
  measurementToggle: { alignItems: "center", flex: 1, flexDirection: "row", gap: 7, minHeight: 44 },
  sectionTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 12, lineHeight: 18 },
  unitSegment: { backgroundColor: "#f4ede4", borderColor: "#ded2c4", borderRadius: 9, borderWidth: 1, flexDirection: "row", padding: 2 },
  unitOption: { alignItems: "center", borderRadius: 7, justifyContent: "center", minHeight: 32, minWidth: 44, paddingHorizontal: 9 },
  unitOptionSelected: { backgroundColor: "#23375a" },
  unitText: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 10, lineHeight: 15 },
  unitTextSelected: { color: "#fffdf8", fontFamily: WAFL_FONTS.bold },
  emptyNotice: { backgroundColor: "#faf7f1", borderRadius: 9, color: "#75665b", fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18, padding: 12 },
  table: { paddingBottom: 4, paddingHorizontal: CONTENT_INSET },
  tableRow: { flexDirection: "row" },
  cell: { alignItems: "center", borderBottomColor: "#e8ded2", borderBottomWidth: 1, borderRightColor: "#e8ded2", borderRightWidth: 1, flexDirection: "row", justifyContent: "center", minHeight: 44, paddingHorizontal: 8, paddingVertical: 7 },
  nameCell: { justifyContent: "flex-start", width: 132 },
  measurementCell: { justifyContent: "flex-start", width: 148 },
  numberCell: { width: 82 },
  headerCell: { backgroundColor: "#f4ede4", borderTopColor: "#e8ded2", borderTopWidth: 1 },
  headerText: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 10, lineHeight: 15, textAlign: "center" },
  cellText: { color: "#17263d", fontFamily: WAFL_FONTS.medium, fontSize: 11, lineHeight: 17, textAlign: "center" },
  swatch: { borderColor: "#c8bcae", borderRadius: 7, borderWidth: 1, height: 14, marginRight: 7, width: 14 },
  totalCell: { backgroundColor: "#faf4ec" },
  totalText: { color: "#23375a", fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 17 },
  grandTotalCell: { backgroundColor: "#e9dfd2" },
  grandTotalText: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 11, lineHeight: 17 },
  memo: { backgroundColor: "#fbf6ee", borderRadius: 10, gap: 5, padding: 12 },
  memoLabel: { color: "#806e60", fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  memoText: { color: "#443930", fontFamily: WAFL_FONTS.regular, fontSize: 13, lineHeight: 20 },
  statePanel: { alignItems: "center", backgroundColor: "#faf7f1", borderRadius: 12, gap: 9, margin: CONTENT_INSET, padding: 24 },
  stateTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 15, textAlign: "center" },
  stateText: { color: "#75665b", fontFamily: WAFL_FONTS.medium, fontSize: 12, lineHeight: 18, textAlign: "center" },
  retryButton: { alignItems: "center", backgroundColor: "#9a4d2f", borderRadius: 9, flexDirection: "row", gap: 6, marginTop: 4, minHeight: 42, paddingHorizontal: 14 },
  retryText: { color: "#fffdf8", fontFamily: WAFL_FONTS.semibold, fontSize: 12 },
  pressed: { opacity: 0.76 },
});
