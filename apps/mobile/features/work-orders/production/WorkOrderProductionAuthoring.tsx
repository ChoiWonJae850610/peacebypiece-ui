import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, ChevronRight, FileUp, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react-native";

import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import { createSerializedMutationQueue } from "@/application/mutationController";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { isIntegerWonDraft, isIntegerWonValue } from "@/domain/integerWonInputPolicy";
import { MobileApiError, type WorkOrderProcess, type WorkOrderProcesses, type WorkOrderProductionOptions } from "@/domain/mobileContract";
import { resolveProductionOrderPolicy, type ProductionOrderAction } from "@/domain/productionOrderPolicy";
import { resolveProductionProcessAccentIndex } from "@/domain/productionCardAccentPolicy";
import { resolveCurrentProductionProcess } from "@/domain/productionProcessIdentityPolicy";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import { useWaflNestedSheetHandoff } from "@/features/inputs/useWaflNestedSheetHandoff";
import { WaflCompactActionRow, WaflCompactCardAction, WaflCompactEntityCard, WaflCompactEntityExpanded, WaflCompactEntityHeader, WaflCompactSummaryLine } from "@/features/layout/WaflCompactEntityCard";
import { WaflCompactField, WaflCompactSelectionField, waflCompactFieldStyles } from "@/features/layout/WaflCompactField";
import WaflSectionCard from "@/features/layout/WaflSectionCard";
import WaflSectionCategorySwitch from "@/features/layout/WaflSectionCategorySwitch";
import WaflSectionHeaderAction from "@/features/layout/WaflSectionHeaderAction";
import { getWorkOrderProcesses } from "@/lib/api/workOrdersApi";
import {
  createWorkOrderProductionProcess,
  deleteWorkOrderProductionProcess,
  getWorkOrderProductionOptions,
  transitionWorkOrderProductionOrder,
  updateWorkOrderProductionProcess,
  type ProductionProcessWriteInput,
} from "@/lib/api/productionApi";
import { WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import { formatQuantity, formatWon, stripDecimalTrailingZeros } from "@/lib/mobileDisplay";

type PickerTarget =
  | { readonly kind: "factory" }
  | { readonly kind: "process"; readonly processId: string | null }
  | { readonly kind: "partner"; readonly processId: string | null; readonly processCode: string };
type InlineField = "unitPrice" | "memo";
type InlineSession = { readonly processId: string; readonly field: InlineField; readonly base: string; readonly draft: string; readonly error: string | null };
type ProductionPresentationSnapshot = { readonly data: WorkOrderProcesses; readonly options: WorkOrderProductionOptions };
type ProductionCategory = "basic" | "additional";

const PRODUCTION_MEMO_MAX_LENGTH = 100;
const requestId = (scope: string) => `a65-production-${scope}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const productionPresentationCache = new Map<string, ProductionPresentationSnapshot>();

function processInput(process: WorkOrderProcess, patch: Partial<ProductionProcessWriteInput> = {}): ProductionProcessWriteInput {
  return { role: process.role, processCode: process.role === "factory" ? null : process.processTypeCode, partnerId: process.partnerId ?? "", unitPrice: stripDecimalTrailingZeros(process.unitPrice), memo: process.memo, ...patch };
}

function ProductionInlineField({ process, field, label, placeholder, active, draft, error, saving, onActivate, onChange, onCancel, onSave }: {
  readonly process: WorkOrderProcess; readonly field: InlineField; readonly label: string; readonly placeholder: string; readonly active: boolean; readonly draft: string; readonly error: string | null; readonly saving: boolean; readonly onActivate: () => void; readonly onChange: (value: string) => void; readonly onCancel: () => void; readonly onSave: (value: string) => void;
}) {
  const memo = field === "memo";
  const raw = memo ? process.memo ?? "" : stripDecimalTrailingZeros(process.unitPrice);
  return <WaflCompactField label={label}><ControlledInlineEditValue accessibilityLabel={`${process.role === "factory" ? "제작 공장" : process.processName} ${label}`} active={active} commitMode="blur-submit" containerStyle={styles.compactInline} dirty={active && draft !== raw} displayPlaceholder={placeholder} displayStyle={memo ? waflCompactFieldStyles.memo : waflCompactFieldStyles.value} displayValue={memo ? raw : formatWon(raw)} editable={process.editable && process.status === "ready"} errorMessage={active ? error : null} invalid={active && error !== null} keyboardType={memo ? "default" : "number-pad"} maxLength={memo ? PRODUCTION_MEMO_MAX_LENGTH : 12} multiline={memo} numberOfLines={memo ? null : 1} onActivate={onActivate} onCancel={onCancel} onChange={onChange} onSave={onSave} placeholder={placeholder} saving={saving} value={active ? draft : raw} valueSemantics={memo ? "nullable-text" : "numeric"} />{memo && active ? <Text style={styles.characterCount}>{draft.length} / {PRODUCTION_MEMO_MAX_LENGTH}</Text> : null}</WaflCompactField>;
}

const ORDER_ACTION_VIEW = {
  request: { label: "발주요청", caption: "발주", Icon: FileUp, emphasized: true, danger: false },
  complete: { label: "발주완료", caption: "완료", Icon: Check, emphasized: true, danger: false },
  cancel: { label: "발주취소", caption: "취소", Icon: RotateCcw, emphasized: false, danger: true },
} as const;

export default function WorkOrderProductionAuthoring({ workOrderId }: { readonly workOrderId: string }) {
  const cachedSnapshot = productionPresentationCache.get(workOrderId) ?? null;
  const [data, setData] = useState<WorkOrderProcesses | null>(cachedSnapshot?.data ?? null);
  const dataRef = useRef<WorkOrderProcesses | null>(cachedSnapshot?.data ?? null);
  const [options, setOptions] = useState<WorkOrderProductionOptions | null>(cachedSnapshot?.options ?? null);
  const optionsRef = useRef<WorkOrderProductionOptions | null>(cachedSnapshot?.options ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [inlineSession, setInlineSession] = useState<InlineSession | null>(null);
  const [category, setCategory] = useState<ProductionCategory>("basic");
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const mutationQueue = useRef(createSerializedMutationQueue()).current;
  const pickerHandoff = useWaflNestedSheetHandoff<PickerTarget["kind"]>("factory", { initialVisible: false });

  function presentPicker(target: PickerTarget) { setPickerTarget(target); pickerHandoff.present(target.kind); }
  function dismissPicker() { pickerHandoff.dismiss(); }
  function toggleExpanded(id: string) { setExpandedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function publishData(next: WorkOrderProcesses) { dataRef.current = next; setData(next); if (optionsRef.current) productionPresentationCache.set(workOrderId, { data: next, options: optionsRef.current }); }
  const publishSnapshot = useCallback((nextData: WorkOrderProcesses, nextOptions: WorkOrderProductionOptions) => { dataRef.current = nextData; optionsRef.current = nextOptions; productionPresentationCache.set(workOrderId, { data: nextData, options: nextOptions }); setData(nextData); setOptions(nextOptions); }, [workOrderId]);
  const publishLoadError = useCallback((reason: unknown) => { if (reason instanceof MobileApiError && (reason.status === 401 || reason.status === 403 || reason.code === "TENANT_SCOPE_VIOLATION" || reason.code === "NOT_FOUND")) { productionPresentationCache.delete(workOrderId); dataRef.current = null; optionsRef.current = null; setData(null); setOptions(null); } setError("제작 정보를 불러오지 못했습니다."); }, [workOrderId]);
  async function load() { try { const [processes, nextOptions] = await Promise.all([getWorkOrderProcesses(workOrderId), getWorkOrderProductionOptions(workOrderId)]); publishSnapshot(processes, nextOptions); setError(null); } catch (reason) { publishLoadError(reason); } }

  useEffect(() => { let active = true; void Promise.all([getWorkOrderProcesses(workOrderId), getWorkOrderProductionOptions(workOrderId)]).then(([processes, nextOptions]) => { if (active) { publishSnapshot(processes, nextOptions); setError(null); } }).catch((reason) => { if (active) publishLoadError(reason); }); return () => { active = false; }; }, [publishLoadError, publishSnapshot, workOrderId]);

  const factory = data?.processes.find((item) => item.role === "factory") ?? null;
  const additional = data?.processes.filter((item) => item.role === "additional") ?? [];

  async function runMutation(key: string, command: (current: WorkOrderProcesses) => Promise<unknown>) {
    setPendingKey(key);
    try { await mutationQueue.enqueue(async () => { const current = await getWorkOrderProcesses(workOrderId); publishData(current); await command(current); publishData(await getWorkOrderProcesses(workOrderId)); }); setInlineSession(null); }
    catch (reason) { Alert.alert("저장할 수 없습니다.", reason instanceof Error ? reason.message : "제작 정보를 확인해 주세요."); }
    finally { setPendingKey((current) => current === key ? null : current); }
  }

  async function createProcess(input: ProductionProcessWriteInput) { const key = `create-${input.role}`; await runMutation(key, async (current) => { const clientRequestId = requestId(key); await createWorkOrderProductionProcess(workOrderId, { clientRequestId, expectedVersion: current.entityVersion, process: input }, clientRequestId); }); }
  async function updateProcess(process: WorkOrderProcess, patch: Partial<ProductionProcessWriteInput>, key: string) { await runMutation(key, async (current) => { const latest = resolveCurrentProductionProcess(current, process); if (!latest) throw new Error("제작 정보가 갱신되었습니다. 현재 카드를 다시 확인해 주세요."); const clientRequestId = requestId(key); await updateWorkOrderProductionProcess(workOrderId, latest.id, { clientRequestId, expectedVersion: current.entityVersion, process: processInput(latest, patch) }, clientRequestId); }); }
  async function removeProcess(process: WorkOrderProcess) { await runMutation(`delete-${process.id}`, async (current) => { const latest = resolveCurrentProductionProcess(current, process); if (!latest) throw new Error("제작 정보가 갱신되었습니다. 현재 카드를 다시 확인해 주세요."); const clientRequestId = requestId("delete"); await deleteWorkOrderProductionProcess(workOrderId, latest.id, { clientRequestId, expectedVersion: current.entityVersion }, clientRequestId); }); }
  function requestDelete(process: WorkOrderProcess) { Alert.alert("추가 공정을 삭제하시겠습니까?", `${process.processName} 공정이 삭제됩니다.`, [{ text: "취소", style: "cancel" }, { text: "삭제", style: "destructive", onPress: () => { void removeProcess(process); } }]); }
  function beginInline(process: WorkOrderProcess, field: InlineField) { const base = field === "memo" ? process.memo ?? "" : stripDecimalTrailingZeros(process.unitPrice); setInlineSession({ processId: process.id, field, base, draft: base, error: null }); }
  async function saveInline(process: WorkOrderProcess, field: InlineField, finalizedValue: string) { const value = field === "memo" ? finalizedValue.trim() : finalizedValue.trim() || "0"; if (field === "unitPrice" && !isIntegerWonValue(value)) { setInlineSession((current) => current && current.processId === process.id && current.field === field ? { ...current, error: "장당 공임은 0 이상의 정수 원 단위로 입력해 주세요." } : current); return; } const original = field === "memo" ? process.memo ?? "" : stripDecimalTrailingZeros(process.unitPrice); if (value === original) { setInlineSession(null); return; } await updateProcess(process, field === "memo" ? { memo: value || null } : { unitPrice: value }, `${field}-${process.id}`); }

  function partnerOptionsFor(processCode: string) { return options?.processPartners.filter((item) => item.processCode === processCode).map((item) => ({ id: item.partnerId, name: item.partnerName })) ?? []; }
  async function applyFactory(partnerId: string) { dismissPicker(); if (!partnerId) { if (factory) Alert.alert("제작 공장을 미지정으로 바꾸시겠습니까?", "현재 기본 공정 정보와 메모가 함께 삭제됩니다.", [{ text: "유지", style: "cancel" }, { text: "미지정", style: "destructive", onPress: () => { void removeProcess(factory); } }]); return; } if (factory) { if (factory.partnerId !== partnerId) await updateProcess(factory, { partnerId }, `factory-partner-${factory.id}`); return; } await createProcess({ role: "factory", processCode: null, partnerId, unitPrice: "0", memo: null }); }
  async function applyProcess(processCode: string, processId: string | null) { if (!processCode.trim()) return false; const process = processId ? dataRef.current?.processes.find((item) => item.id === processId) ?? null : null; const eligiblePartners = partnerOptionsFor(processCode); const partnerStillEligible = process?.partnerId && eligiblePartners.some((item) => item.id === process.partnerId); if (process && partnerStillEligible) { dismissPicker(); if (process.processTypeCode !== processCode) await updateProcess(process, { processCode }, `process-${process.id}`); return; } setPickerTarget({ kind: "partner", processId, processCode }); pickerHandoff.transition("partner"); }
  async function applyPartner(partnerId: string, processId: string | null, processCode: string) { dismissPicker(); if (!partnerId) return; const process = processId ? dataRef.current?.processes.find((item) => item.id === processId) ?? null : null; if (process) { if (process.partnerId !== partnerId || process.processTypeCode !== processCode) await updateProcess(process, { partnerId, processCode }, `partner-${process.id}`); return; } await createProcess({ role: "additional", processCode, partnerId, unitPrice: "0", memo: null }); }

  async function runOrderAction(action: ProductionOrderAction) { if (!factory) return; const policy = resolveProductionOrderPolicy({ status: factory.status, currentDraft: Boolean(dataRef.current?.editable), editable: factory.editable }); if (!policy.actions.includes(action)) return; const execute = async () => runMutation(`order-${action}-${factory.id}`, async (current) => { const latest = resolveCurrentProductionProcess(current, factory); if (!latest) throw new Error("제작 정보가 갱신되었습니다. 현재 카드를 다시 확인해 주세요."); const clientRequestId = requestId(`order-${action}`); await transitionWorkOrderProductionOrder(workOrderId, latest.id, action, { clientRequestId, expectedVersion: current.entityVersion }, clientRequestId); }); if (action === "request" && (Number(factory.unitPrice) <= 0 || Number(factory.quantity) <= 0 || !factory.partnerId)) { Alert.alert("발주요청할 수 없습니다.", "제작 공장, 장당 공임, 작업지시서 수량을 확인해 주세요."); return; } if (action === "complete") { Alert.alert("제작 공장 발주를 완료하시겠습니까?", "완료 후에는 수정하거나 취소할 수 없습니다.", [{ text: "취소", style: "cancel" }, { text: "완료", onPress: () => { void execute(); } }]); return; } if (action === "cancel") { Alert.alert("제작 공장 발주요청을 취소하시겠습니까?", "발주 전 상태로 돌아갑니다.", [{ text: "유지", style: "cancel" }, { text: "요청 취소", style: "destructive", onPress: () => { void execute(); } }]); return; } await execute(); }
  function inlineField(process: WorkOrderProcess, field: InlineField, label: string, placeholder: string) { const active = inlineSession?.processId === process.id && inlineSession.field === field; return <ProductionInlineField active={active} draft={active ? inlineSession.draft : ""} error={active ? inlineSession.error : null} field={field} key={`${process.id}-${field}`} label={label} onActivate={() => beginInline(process, field)} onCancel={() => setInlineSession(null)} onChange={(nextDraft) => { const draft = field === "memo" ? nextDraft.slice(0, PRODUCTION_MEMO_MAX_LENGTH) : nextDraft; if (field === "unitPrice" && !isIntegerWonDraft(draft)) return; setInlineSession((current) => current && current.processId === process.id && current.field === field ? { ...current, draft, error: field === "unitPrice" && draft && !isIntegerWonValue(draft) ? "장당 공임은 0 이상의 정수 원 단위로 입력해 주세요." : null } : current); }} onSave={(value) => { void saveInline(process, field, value); }} placeholder={placeholder} process={process} saving={pendingKey === `${field}-${process.id}`} />; }

  if ((!data || !options) && error) return <View style={styles.container}><WaflSectionCard><View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityLabel="제작 정보 다시 불러오기" onPress={() => { void load(); }} style={styles.iconButton}><RefreshCw color={WAFL_THEME.color.navyInk} size={18} /></Pressable></View></WaflSectionCard></View>;
  if (!data || !options) return <DelayedLoadingMessage identity={`production:${workOrderId}`} loading scope="production" />;
  const currentData = data;

  const factoryPolicy = factory ? resolveProductionOrderPolicy({ status: factory.status, currentDraft: data.editable, editable: factory.editable }) : null;
  const basicAction = category === "basic" && factoryPolicy?.actions.length ? <View style={styles.actions}>{factoryPolicy.actions.map((action) => { const view = ORDER_ACTION_VIEW[action]; return <WaflCompactCardAction Icon={view.Icon} accessibilityLabel={view.label} busy={pendingKey === `order-${action}-${factory?.id}`} caption={view.caption} danger={view.danger} emphasized={view.emphasized} key={action} onPress={() => { void runOrderAction(action); }} />; })}</View> : null;
  const categoryAction = category === "additional" && data.editable ? <WaflSectionHeaderAction accessibilityLabel="추가 공정 등록" icon={<Plus color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.standard} />} onPress={() => presentPicker({ kind: "process", processId: null })} testID="production-add-process" /> : basicAction;
  const selectedProcess = pickerTarget?.kind === "process" && pickerTarget.processId ? additional.find((item) => item.id === pickerTarget.processId) ?? null : null;
  const selectedPartnerTarget = pickerTarget?.kind === "partner" ? pickerTarget : null;
  const selectedPartnerProcess = selectedPartnerTarget?.processId ? additional.find((item) => item.id === selectedPartnerTarget.processId) ?? null : null;

  function processCard(process: WorkOrderProcess) {
    const factoryRole = process.role === "factory";
    const expanded = expandedIds.has(process.id);
    const accentColor = factoryRole ? WAFL_THEME.productionAccent.factoryAccent : WAFL_THEME.productionAccent.processAccents[resolveProductionProcessAccentIndex(process.processTypeCode, WAFL_THEME.productionAccent.processAccents.length)];
    // The callbacks below execute only from native Pressable events; no ref is read while rendering.
    // eslint-disable-next-line react-hooks/refs
    const deleteAction = !factoryRole && process.editable && process.status === "ready" ? <WaflCompactCardAction Icon={Trash2} accessibilityLabel={`${process.processName} 삭제`} busy={pendingKey === `delete-${process.id}`} danger onPress={() => requestDelete(process)} /> : undefined;
    return <WaflCompactEntityCard accentColor={accentColor} key={process.id} testID={factoryRole ? "production-factory-card" : `production-process-card-${process.id}`}><WaflCompactEntityHeader expanded={expanded} label={factoryRole ? "기본 공정" : "추가 공정"} onToggle={() => toggleExpanded(process.id)} /><View style={styles.cardBody}>{!factoryRole ? <WaflCompactSelectionField accessibilityLabel={`${process.processName} 공정 선택`} editable={process.editable && process.status === "ready"} label="공정" onPress={() => presentPicker({ kind: "process", processId: process.id })} showChevron value={process.processName} /> : null}<WaflCompactSelectionField accessibilityLabel={`${factoryRole ? "제작 공장" : process.processName} 거래처 선택`} editable={process.editable && process.status === "ready"} label="거래처" onPress={() => factoryRole ? presentPicker({ kind: "factory" }) : presentPicker({ kind: "partner", processId: process.id, processCode: process.processTypeCode })} showChevron value={process.partnerName ?? ""} />{inlineField(process, "unitPrice", "공임", "0원")}</View>{expanded ? <WaflCompactEntityExpanded>{inlineField(process, "memo", "메모", WAFL_UNSET_PLACEHOLDER)}</WaflCompactEntityExpanded> : null}<WaflCompactActionRow actions={deleteAction} testID="production-process-summary-row"><WaflCompactSummaryLine testID="production-process-summary">수량 {formatQuantity(currentData.totalQuantity, "개")} · 금액 {formatWon(process.amount)}</WaflCompactSummaryLine></WaflCompactActionRow></WaflCompactEntityCard>;
  }

  const activePickerConfig = pickerHandoff.route === "factory"
    ? { allowUnset: true, emptyMessage: undefined, field: "factoryPartnerId", label: "제작 공장", onApply: (value: string) => applyFactory(value), optionItems: options.factoryPartners.map((item) => ({ value: item.id, label: item.name })), pending: pendingKey?.startsWith("factory") ?? false, requireSpecifiedValue: false, selectFirstRealOption: false, value: factory?.partnerId ?? "" }
    : pickerHandoff.route === "process"
      ? { allowUnset: selectedProcess === null, emptyMessage: undefined, field: "processCode", label: "공정", onApply: (value: string) => applyProcess(value, pickerTarget?.kind === "process" ? pickerTarget.processId : null), optionItems: options.processStandards.map((item) => ({ value: item.code, label: item.name })), pending: false, requireSpecifiedValue: selectedProcess === null, selectFirstRealOption: false, value: selectedProcess?.processTypeCode ?? "" }
      : { allowUnset: false, emptyMessage: "이 공정을 취급하는 등록 거래처가 없습니다.", field: "partnerId", label: "거래처", onApply: (value: string) => selectedPartnerTarget ? applyPartner(value, selectedPartnerTarget.processId, selectedPartnerTarget.processCode) : undefined, optionItems: selectedPartnerTarget ? partnerOptionsFor(selectedPartnerTarget.processCode).map((item) => ({ value: item.id, label: item.name })) : [], pending: Boolean(pendingKey?.startsWith("partner") || pendingKey === "create-additional"), requireSpecifiedValue: true, selectFirstRealOption: true, value: selectedPartnerProcess?.partnerId ?? "" };
  const activePicker = <WaflReelPickerSheet allowUnset={activePickerConfig.allowUnset} emptyMessage={activePickerConfig.emptyMessage} field={activePickerConfig.field} key={pickerHandoff.route} kind="option" label={activePickerConfig.label} onAfterClose={pickerHandoff.finishClose} onApply={activePickerConfig.onApply} onCancel={dismissPicker} optionItems={activePickerConfig.optionItems} pending={activePickerConfig.pending} presentationGeneration={pickerHandoff.presentationGeneration} requireSpecifiedValue={activePickerConfig.requireSpecifiedValue} selectFirstRealOption={activePickerConfig.selectFirstRealOption} unitCode="" value={activePickerConfig.value} visible={pickerHandoff.visible} />;

  return <View style={styles.container} testID="work-order-production-authoring">{error ? <View style={styles.refreshError}><Text style={styles.refreshErrorText}>{error}</Text><Pressable accessibilityLabel="제작 정보 다시 불러오기" onPress={() => { void load(); }} style={styles.iconButton}><RefreshCw color={WAFL_THEME.color.navyInk} size={18} /></Pressable></View> : null}<WaflSectionCard><WaflSectionCategorySwitch<ProductionCategory> action={categoryAction ?? undefined} onSelect={setCategory} optionTestIDPrefix="production-category" options={[{ value: "basic", label: "기본 공정", count: factory ? 1 : 0, badgeTone: WAFL_THEME.badge.fabric }, { value: "additional", label: "추가 공정", count: additional.length, badgeTone: WAFL_THEME.badge.accessory }]} selected={category} testID="production-category-switch" />{category === "basic" ? <View style={styles.processList}>{factory ? processCard(factory) : <WaflCompactEntityCard accentColor={WAFL_THEME.productionAccent.factoryAccent} testID="production-factory-card-empty"><View style={styles.emptyFactory}><Text style={styles.empty}>제작 공장이 미지정입니다.</Text>{data.editable ? <Pressable accessibilityLabel="제작 공장 선택" accessibilityRole="button" onPress={() => presentPicker({ kind: "factory" })} style={({ pressed }) => [styles.emptyFactoryAction, pressed && styles.pressed]}><Text style={styles.emptyFactoryActionText}>제작 공장 선택</Text><ChevronRight color={WAFL_THEME.color.navyInk} size={18} /></Pressable> : null}</View></WaflCompactEntityCard>}</View> : additional.length ? <View style={styles.processList}>{additional.map(processCard)}</View> : <Text style={styles.empty}>등록된 추가 공정이 없습니다.</Text>}</WaflSectionCard>{activePicker}</View>;
}

const styles = StyleSheet.create({
  container: { gap: WAFL_THEME.layout.sectionGap, paddingBottom: WAFL_THEME.layout.sectionGapLarge }, processList: { gap: WAFL_THEME.layout.sectionGap }, cardBody: { flexDirection: "row", gap: WAFL_THEME.layout.controlGap, paddingBottom: WAFL_THEME.layout.compactCardInsetVertical, paddingHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal }, compactInline: { flex: 1, minWidth: 0 }, characterCount: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, textAlign: "right" }, empty: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.body, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight, paddingVertical: WAFL_THEME.spacing.sm }, emptyFactory: { gap: WAFL_THEME.layout.tightGap, padding: WAFL_THEME.layout.compactCardInsetHorizontal }, emptyFactoryAction: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: WAFL_THEME.touch.minimum }, emptyFactoryActionText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.bodyText.fontSize }, actions: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.tightGap }, iconButton: { alignItems: "center", justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, minWidth: WAFL_THEME.touch.minimum }, error: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, errorText: { color: WAFL_THEME.color.error, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize }, refreshError: { alignItems: "center", backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.cardCompact, flexDirection: "row", justifyContent: "space-between", padding: WAFL_THEME.layout.compactCardPadding }, refreshErrorText: { color: WAFL_THEME.color.error, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize }, pressed: { opacity: 0.68 },
});
