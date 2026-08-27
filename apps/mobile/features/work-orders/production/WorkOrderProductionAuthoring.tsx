import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, FileUp, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react-native";

import ControlledInlineEditValue from "@/components/ControlledInlineEditValue";
import { createSerializedMutationQueue } from "@/application/mutationController";
import { runWaflProcessingAction } from "@/application/waflActionExecution";
import type { WorkOrderDraftBatchCoordinator } from "@/application/draftBatchCoordinator";
import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { isIntegerWonDraft, isIntegerWonValue } from "@/domain/integerWonInputPolicy";
import { MobileApiError, type WorkOrderProcess, type WorkOrderProcesses, type WorkOrderProductionOptions } from "@/domain/mobileContract";
import { resolveProductionOrderPolicy, type ProductionOrderAction } from "@/domain/productionOrderPolicy";
import { resolveProductionProcessAccentIndex } from "@/domain/productionCardAccentPolicy";
import { resolveCurrentProductionProcess } from "@/domain/productionProcessIdentityPolicy";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import WaflCharacterCounter from "@/features/inputs/WaflCharacterCounter";
import DelayedLoadingMessage from "@/features/work-orders/loading/DelayedLoadingMessage";
import { useWaflNestedSheetHandoff } from "@/features/inputs/useWaflNestedSheetHandoff";
import { WaflCompactActionRow, WaflCompactCardAction, WaflCompactEntityCard, WaflCompactEntityExpanded, WaflCompactEntityHeader, WaflCompactSummaryLine } from "@/features/layout/WaflCompactEntityCard";
import { WaflCompactField, WaflCompactSelectionField, waflCompactFieldStyles } from "@/features/layout/WaflCompactField";
import WaflSectionCard from "@/features/layout/WaflSectionCard";
import WaflSectionCategorySwitch from "@/features/layout/WaflSectionCategorySwitch";
import WaflSectionHeaderAction from "@/features/layout/WaflSectionHeaderAction";
import { requestWaflDecision, showWaflAlert } from "@/features/feedback/waflFeedbackStore";
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
import { flushProductionCategorySwitch } from "./productionCategorySwitchPolicy";

type PickerTarget =
  | { readonly kind: "factory" }
  | { readonly kind: "process"; readonly processId: string | null }
  | { readonly kind: "partner"; readonly processId: string | null; readonly processCode: string };
type InlineField = "unitPrice" | "memo";
type InlineSession = { readonly processId: string; readonly field: InlineField; readonly base: string; readonly draft: string; readonly error: string | null };
type ProductionPresentationSnapshot = { readonly data: WorkOrderProcesses; readonly options: WorkOrderProductionOptions };
type ProductionCategory = "basic" | "additional";
type PendingProductionStructureOperation =
  | { readonly kind: "create"; readonly tempId: string; readonly input: ProductionProcessWriteInput; readonly idempotencyKey: string }
  | { readonly kind: "update"; readonly process: WorkOrderProcess; readonly patch: Partial<ProductionProcessWriteInput>; readonly idempotencyKey: string }
  | { readonly kind: "delete"; readonly process: WorkOrderProcess; readonly idempotencyKey: string };

const PRODUCTION_MEMO_MAX_LENGTH = 100;
const requestId = (scope: string) => `a65-production-${scope}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const productionPresentationCache = new Map<string, ProductionPresentationSnapshot>();

function processInput(process: WorkOrderProcess, patch: Partial<ProductionProcessWriteInput> = {}): ProductionProcessWriteInput {
  const unitPrice = patch.memo !== undefined && patch.unitPrice === undefined ? process.unitPrice : stripDecimalTrailingZeros(process.unitPrice);
  return { role: process.role, processCode: process.role === "factory" ? null : process.processTypeCode, partnerId: process.partnerId ?? "", unitPrice, memo: process.memo, ...patch };
}

function ProductionInlineField({ process, field, label, placeholder, active, draft, editable, forceEditable, error, saving, onActivate, onChange, onCancel, onSave }: {
  readonly process: WorkOrderProcess; readonly field: InlineField; readonly label: string; readonly placeholder: string; readonly active: boolean; readonly draft: string; readonly editable: boolean; readonly forceEditable?: boolean; readonly error: string | null; readonly saving: boolean; readonly onActivate: () => void; readonly onChange: (value: string) => void; readonly onCancel: () => void; readonly onSave: (value: string) => void;
}) {
  const memo = field === "memo";
  const raw = memo ? process.memo ?? "" : stripDecimalTrailingZeros(process.unitPrice);
  return <WaflCompactField label={label}><ControlledInlineEditValue accessibilityLabel={`${process.role === "factory" ? "제작 공장" : process.processName} ${label}`} active={active} commitMode="blur-submit" containerStyle={styles.compactInline} dirty={active && draft !== raw} displayPlaceholder={placeholder} displayStyle={memo ? waflCompactFieldStyles.memo : waflCompactFieldStyles.value} displayValue={memo ? raw : formatWon(raw)} editable={editable && (forceEditable || (process.editable && process.status === "ready"))} errorMessage={active ? error : null} invalid={active && error !== null} keyboardType={memo ? "default" : "number-pad"} maxLength={memo ? PRODUCTION_MEMO_MAX_LENGTH : 12} multiline={memo} numberOfLines={memo ? null : 1} onActivate={onActivate} onCancel={onCancel} onChange={onChange} onSave={onSave} placeholder={placeholder} saving={saving} value={active ? draft : raw} valueSemantics={memo ? "nullable-text" : "numeric"} />{memo && active ? <WaflCharacterCounter current={draft.length} maximum={PRODUCTION_MEMO_MAX_LENGTH} /> : null}</WaflCompactField>;
}

const ORDER_ACTION_VIEW = {
  request: { label: "발주요청", caption: "발주", Icon: FileUp, emphasized: true, danger: false },
  cancel: { label: "발주 취소", caption: "취소", Icon: RotateCcw, emphasized: false, danger: true },
} as const;

export default function WorkOrderProductionAuthoring({ workOrderId, onMutationCommitted, onConfirmedMutableCommitted, onActionProcessing, onActionSuccess, draftBatch, reorderDraft = false, confirmedMemoEditable = false }: { readonly workOrderId: string; readonly onMutationCommitted?: () => void; readonly onConfirmedMutableCommitted?: () => Promise<void> | void; readonly onActionProcessing: (message: string | null, helper?: string | null) => void; readonly onActionSuccess: (message: string) => void; readonly draftBatch: WorkOrderDraftBatchCoordinator; readonly reorderDraft?: boolean; readonly confirmedMemoEditable?: boolean }) {
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
  const [categorySwitchPending, setCategorySwitchPending] = useState(false);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [mutationQueue] = useState(createSerializedMutationQueue);
  const pickerHandoff = useWaflNestedSheetHandoff<PickerTarget["kind"]>("factory", { initialVisible: false });
  const pendingInlinePatches = useRef(new Map<string, { readonly process: WorkOrderProcess; readonly patch: Partial<ProductionProcessWriteInput> }>());
  const pendingStructureOperations = useRef(new Map<string, PendingProductionStructureOperation>());
  const processIdAliases = useRef(new Map<string, string>());
  const localProcessSequence = useRef(0);

  function presentPicker(target: PickerTarget) { setPickerTarget(target); pickerHandoff.present(target.kind); }
  function dismissPicker() { pickerHandoff.dismiss(); }
  function toggleExpanded(id: string) { setExpandedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function publishData(next: WorkOrderProcesses) { dataRef.current = next; setData(next); if (optionsRef.current) productionPresentationCache.set(workOrderId, { data: next, options: optionsRef.current }); }
  const publishSnapshot = useCallback((nextData: WorkOrderProcesses, nextOptions: WorkOrderProductionOptions) => { dataRef.current = nextData; optionsRef.current = nextOptions; productionPresentationCache.set(workOrderId, { data: nextData, options: nextOptions }); setData(nextData); setOptions(nextOptions); }, [workOrderId]);
  const publishLoadError = useCallback((reason: unknown) => { if (reason instanceof MobileApiError && (reason.status === 401 || reason.status === 403 || reason.code === "TENANT_SCOPE_VIOLATION" || reason.code === "NOT_FOUND")) { productionPresentationCache.delete(workOrderId); dataRef.current = null; optionsRef.current = null; setData(null); setOptions(null); } setError("제작 정보를 불러오지 못했습니다."); }, [workOrderId]);
  async function load() { try { const [processes, nextOptions] = await Promise.all([getWorkOrderProcesses(workOrderId), getWorkOrderProductionOptions(workOrderId)]); publishSnapshot(processes, nextOptions); setError(null); } catch (reason) { publishLoadError(reason); } }

  useEffect(() => { let active = true; void Promise.all([getWorkOrderProcesses(workOrderId), getWorkOrderProductionOptions(workOrderId)]).then(([processes, nextOptions]) => { if (active) { publishSnapshot(processes, nextOptions); setError(null); } }).catch((reason) => { if (active) publishLoadError(reason); }); return () => { active = false; }; }, [publishLoadError, publishSnapshot, workOrderId]);

  useEffect(() => draftBatch.register("production", async () => {
    const queuedStructures = [...pendingStructureOperations.current.entries()];
    const queuedInline = [...pendingInlinePatches.current.values()];
    if (queuedStructures.length === 0 && queuedInline.length === 0) return true;
    try {
      await mutationQueue.enqueue(async () => {
        let current = await getWorkOrderProcesses(workOrderId);
        for (const [operationKey, operation] of queuedStructures) {
          if (operation.kind === "create") {
            const created = await createWorkOrderProductionProcess(workOrderId, {
              clientRequestId: requestId(`batch-create-${operation.input.role}`),
              expectedVersion: current.entityVersion,
              process: operation.input,
            }, operation.idempotencyKey);
            if (!created.processId) throw new Error("생성된 제작 정보의 식별자를 확인할 수 없습니다.");
            processIdAliases.current.set(operation.tempId, created.processId);
          } else {
            const resolvedId = processIdAliases.current.get(operation.process.id) ?? operation.process.id;
            const latest = current.processes.find((candidate) => candidate.id === resolvedId)
              ?? resolveCurrentProductionProcess(current, operation.process);
            if (!latest) throw new Error("제작 정보가 갱신되었습니다. 현재 카드를 다시 확인해 주세요.");
            if (operation.kind === "update") {
              await updateWorkOrderProductionProcess(workOrderId, latest.id, {
                clientRequestId: requestId(`batch-update-${latest.id}`),
                expectedVersion: current.entityVersion,
                process: processInput(latest, operation.patch),
              }, operation.idempotencyKey);
            } else {
              await deleteWorkOrderProductionProcess(workOrderId, latest.id, {
                clientRequestId: requestId(`batch-delete-${latest.id}`),
                expectedVersion: current.entityVersion,
              }, operation.idempotencyKey);
            }
          }
          current = await getWorkOrderProcesses(workOrderId);
          const pendingOperation = pendingStructureOperations.current.get(operationKey);
          if (pendingOperation === operation) {
            pendingStructureOperations.current.delete(operationKey);
          } else if (operation.kind === "create" && pendingOperation?.kind === "create") {
            const resolvedId = processIdAliases.current.get(operation.tempId);
            const authoritative = current.processes.find((candidate) => candidate.id === resolvedId);
            pendingStructureOperations.current.delete(operationKey);
            if (authoritative) pendingStructureOperations.current.set(`update-${operation.tempId}`, {
              kind: "update",
              process: { ...authoritative, id: operation.tempId },
              patch: pendingOperation.input,
              idempotencyKey: requestId(`batch-followup-${operation.tempId}`),
            });
          }
        }
        for (const entry of queuedInline) {
          const resolvedId = processIdAliases.current.get(entry.process.id) ?? entry.process.id;
          const latest = current.processes.find((candidate) => candidate.id === resolvedId)
            ?? resolveCurrentProductionProcess(current, entry.process);
          if (!latest) throw new Error("제작 정보가 갱신되었습니다. 현재 카드를 다시 확인해 주세요.");
          const clientRequestId = requestId(`batch-${latest.id}`);
          await updateWorkOrderProductionProcess(workOrderId, latest.id, {
            clientRequestId,
            expectedVersion: current.entityVersion,
            process: processInput(latest, entry.patch),
          }, clientRequestId);
          const pending = pendingInlinePatches.current.get(entry.process.id);
          if (pending && JSON.stringify(pending.patch) === JSON.stringify(entry.patch)) pendingInlinePatches.current.delete(entry.process.id);
          current = await getWorkOrderProcesses(workOrderId);
        }
        for (const pending of pendingInlinePatches.current.values()) {
          const resolvedId = processIdAliases.current.get(pending.process.id) ?? pending.process.id;
          const index = current.processes.findIndex((candidate) => candidate.id === resolvedId);
          if (index >= 0) current = { ...current, processes: current.processes.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, ...pending.patch, memo: pending.patch.memo === undefined ? candidate.memo : pending.patch.memo, unitPrice: pending.patch.unitPrice ?? candidate.unitPrice } : candidate) };
        }
        for (const pending of pendingStructureOperations.current.values()) {
          if (pending.kind === "create") continue;
          const resolvedId = processIdAliases.current.get(pending.process.id) ?? pending.process.id;
          if (pending.kind === "delete") current = { ...current, processes: current.processes.filter((candidate) => candidate.id !== resolvedId) };
          else current = { ...current, processes: current.processes.map((candidate) => candidate.id === resolvedId ? { ...candidate, ...pending.patch } : candidate) };
        }
        publishData(current);
      });
      onMutationCommitted?.();
      return true;
    } catch (reason) {
      showWaflAlert(reason instanceof Error ? reason.message : "제작 정보를 확인해 주세요.", "error");
      return false;
    }
  }), [draftBatch, mutationQueue, onMutationCommitted, workOrderId]);

  const factory = data?.processes.find((item) => item.role === "factory") ?? null;
  const additional = data?.processes.filter((item) => item.role === "additional") ?? [];

  async function runMutation(key: string, command: (current: WorkOrderProcesses) => Promise<unknown>) {
    setPendingKey(key);
    try { await mutationQueue.enqueue(async () => { const current = await getWorkOrderProcesses(workOrderId); publishData(current); await command(current); publishData(await getWorkOrderProcesses(workOrderId)); }); setInlineSession(null); onMutationCommitted?.(); return true; }
    catch (reason) { showWaflAlert(reason instanceof Error ? reason.message : "제작 정보를 확인해 주세요.", "error"); return false; }
    finally { setPendingKey((current) => current === key ? null : current); }
  }

  function stageProductionDraft() {
    draftBatch.stage("production", {
      structures: [...pendingStructureOperations.current.values()],
      inline: [...pendingInlinePatches.current.values()],
    });
  }
  function createProcess(input: ProductionProcessWriteInput) {
    localProcessSequence.current += 1;
    const tempId = `local-process-${input.role}-${localProcessSequence.current}`;
    const idempotencyKey = requestId(`create-${input.role}`);
    pendingStructureOperations.current.set(tempId, { kind: "create", tempId, input, idempotencyKey });
    const current = dataRef.current;
    if (current) {
      const partnerName = input.role === "factory"
        ? optionsRef.current?.factoryPartners.find((item) => item.id === input.partnerId)?.name ?? null
        : optionsRef.current?.processPartners.find((item) => item.processCode === input.processCode && item.partnerId === input.partnerId)?.partnerName ?? null;
      const standard = optionsRef.current?.processStandards.find((item) => item.code === input.processCode);
      const optimistic: WorkOrderProcess = {
        id: tempId,
        processTypeCode: input.role === "factory" ? "SEWING" : input.processCode ?? "",
        processName: input.role === "factory" ? "제작 공장" : standard?.name ?? input.processCode ?? "추가 공정",
        partnerId: input.partnerId,
        partnerName,
        quantity: current.totalQuantity,
        dueDate: null,
        unitCode: "EA",
        currency: "KRW",
        unitPrice: input.unitPrice,
        amount: "0",
        memo: input.memo,
        applicationArea: null,
        applicationColorTarget: null,
        status: "ready",
        displayOrder: current.processes.length + 1,
        editable: true,
        locked: false,
        role: input.role,
      };
      publishData({ ...current, processes: [...current.processes, optimistic] });
    }
    stageProductionDraft();
  }
  function updateProcess(process: WorkOrderProcess, patch: Partial<ProductionProcessWriteInput>, key: string) {
    const create = pendingStructureOperations.current.get(process.id);
    if (create?.kind === "create") pendingStructureOperations.current.set(process.id, { ...create, input: { ...create.input, ...patch } });
    else {
      const existing = pendingStructureOperations.current.get(`update-${process.id}`);
      const mergedPatch = existing?.kind === "update" ? { ...existing.patch, ...patch } : patch;
      pendingStructureOperations.current.set(`update-${process.id}`, { kind: "update", process, patch: mergedPatch, idempotencyKey: requestId(key) });
    }
    const current = dataRef.current;
    if (current) publishData({ ...current, processes: current.processes.map((candidate) => candidate.id === process.id ? { ...candidate, ...patch } : candidate) });
    stageProductionDraft();
  }
  async function commitProcessImmediately(process: WorkOrderProcess, patch: Partial<ProductionProcessWriteInput>, key: string) { await runMutation(key, async (current) => { const latest = resolveCurrentProductionProcess(current, process); if (!latest) throw new Error("제작 정보가 갱신되었습니다. 현재 카드를 다시 확인해 주세요."); const clientRequestId = requestId(key); await updateWorkOrderProductionProcess(workOrderId, latest.id, { clientRequestId, expectedVersion: current.entityVersion, process: processInput(latest, patch) }, clientRequestId); }); }
  function removeProcess(process: WorkOrderProcess) {
    const create = pendingStructureOperations.current.get(process.id);
    if (create?.kind === "create") pendingStructureOperations.current.delete(process.id);
    else pendingStructureOperations.current.set(`delete-${process.id}`, { kind: "delete", process, idempotencyKey: requestId(`delete-${process.id}`) });
    pendingInlinePatches.current.delete(process.id);
    const current = dataRef.current;
    if (current) publishData({ ...current, processes: current.processes.filter((candidate) => candidate.id !== process.id) });
    stageProductionDraft();
  }
  function requestDelete(process: WorkOrderProcess) { requestWaflDecision({ title: "추가 공정을 삭제합니다", helper: `${process.processName} 공정이 삭제됩니다.`, cancelAccessibilityLabel: "추가 공정 유지", confirmAccessibilityLabel: "추가 공정 삭제", safeOptionLabel: "유지", actionOptionLabel: "삭제", destructive: true, onConfirm: () => { void removeProcess(process); } }); }
  function beginInline(process: WorkOrderProcess, field: InlineField) { const base = field === "memo" ? process.memo ?? "" : stripDecimalTrailingZeros(process.unitPrice); setInlineSession({ processId: process.id, field, base, draft: base, error: null }); }
  async function saveInline(process: WorkOrderProcess, field: InlineField, finalizedValue: string) { const value = field === "memo" ? finalizedValue.trim() : finalizedValue.trim() || "0"; if (field === "unitPrice" && !isIntegerWonValue(value)) { setInlineSession((current) => current && current.processId === process.id && current.field === field ? { ...current, error: "장당 공임은 0 이상의 정수 원 단위로 입력해 주세요." } : current); return false; } const original = field === "memo" ? process.memo ?? "" : stripDecimalTrailingZeros(process.unitPrice); if (value === original) { setInlineSession(null); return true; } const patch = field === "memo" ? { memo: value || null } : { unitPrice: value }; if (confirmedMemoEditable && process.role === "factory" && field === "memo") { setInlineSession(null); await commitProcessImmediately(process, patch, `confirmed-memo-${process.id}`); await onConfirmedMutableCommitted?.(); return true; } const create = pendingStructureOperations.current.get(process.id); if (create?.kind === "create") pendingStructureOperations.current.set(process.id, { ...create, input: { ...create.input, ...patch } }); else pendingInlinePatches.current.set(process.id, { process, patch }); const currentData = dataRef.current; if (currentData) publishData({ ...currentData, processes: currentData.processes.map((candidate) => candidate.id === process.id ? { ...candidate, ...patch } : candidate) }); setInlineSession(null); stageProductionDraft(); return true; }

  async function switchCategory(nextCategory: ProductionCategory) {
    if (nextCategory === category || categorySwitchPending) return;
    setCategorySwitchPending(true);
    try {
      const active = inlineSession;
      if (active) {
        const process = dataRef.current?.processes.find((candidate) => candidate.id === active.processId);
        if (process && !(await saveInline(process, active.field, active.draft))) return;
      }
      await flushProductionCategorySwitch({
        dirty: draftBatch.isDirty("production"),
        flush: async () => (await draftBatch.flushSection("production", "explicit")).committed,
        onProcessing: onActionProcessing,
        onSwitch: () => setCategory(nextCategory),
      });
    } finally {
      setCategorySwitchPending(false);
    }
  }

  function partnerOptionsFor(processCode: string) { return options?.processPartners.filter((item) => item.processCode === processCode).map((item) => ({ id: item.partnerId, name: item.partnerName })) ?? []; }
  async function applyFactory(partnerId: string) { dismissPicker(); if (!partnerId) { if (factory) requestWaflDecision({ title: "제작 공장을 미지정으로 바꿉니다", helper: "현재 기본 공정 정보와 메모가 함께 삭제됩니다.", cancelAccessibilityLabel: "제작 공장 유지", confirmAccessibilityLabel: "제작 공장 미지정", safeOptionLabel: "유지", actionOptionLabel: "미지정", destructive: true, onConfirm: () => { void removeProcess(factory); } }); return; } if (factory) { if (factory.partnerId !== partnerId) await updateProcess(factory, { partnerId }, `factory-partner-${factory.id}`); return; } await createProcess({ role: "factory", processCode: null, partnerId, unitPrice: "0", memo: null }); }
  async function applyProcess(processCode: string, processId: string | null) { if (!processCode.trim()) return false; const process = processId ? dataRef.current?.processes.find((item) => item.id === processId) ?? null : null; const eligiblePartners = partnerOptionsFor(processCode); const partnerStillEligible = process?.partnerId && eligiblePartners.some((item) => item.id === process.partnerId); if (process && partnerStillEligible) { dismissPicker(); if (process.processTypeCode !== processCode) await updateProcess(process, { processCode }, `process-${process.id}`); return; } setPickerTarget({ kind: "partner", processId, processCode }); pickerHandoff.transition("partner"); }
  async function applyPartner(partnerId: string, processId: string | null, processCode: string) { dismissPicker(); if (!partnerId) return; const process = processId ? dataRef.current?.processes.find((item) => item.id === processId) ?? null : null; if (process) { if (process.partnerId !== partnerId || process.processTypeCode !== processCode) await updateProcess(process, { partnerId, processCode }, `partner-${process.id}`); return; } await createProcess({ role: "additional", processCode, partnerId, unitPrice: "0", memo: null }); }

  async function runOrderAction(action: ProductionOrderAction) {
    if (!factory) return;
    const policy = resolveProductionOrderPolicy({ status: factory.status, currentDraft: Boolean(dataRef.current?.editable), editable: factory.editable });
    if (!policy.actions.includes(action)) return;
    const execute = async () => {
      if (action !== "request" && action !== "cancel") return;
      const flushed = await draftBatch.flushSection("production", "explicit");
      if (!flushed.committed) {
        showWaflAlert("제작 정보를 저장한 뒤 다시 시도해 주세요.", "error");
        return;
      }
      await runWaflProcessingAction({
        processingMessage: action === "request" ? "제작 요청을 진행합니다." : "제작 요청을 취소 중입니다.",
        successMessage: action === "request" ? "발주 요청이 완료되었습니다." : "발주 요청이 취소되었습니다.",
        onProcessing: onActionProcessing,
        onSuccess: onActionSuccess,
        isSuccess: (succeeded) => succeeded,
        command: () => runMutation(`order-${action}-${factory.id}`, async (current) => {
          const latest = current.processes.find((candidate) => candidate.role === "factory");
          if (!latest) throw new Error("제작 정보가 갱신되었습니다. 현재 카드를 다시 확인해 주세요.");
          const clientRequestId = requestId(`order-${action}`);
          await transitionWorkOrderProductionOrder(workOrderId, latest.id, action, { clientRequestId, expectedVersion: current.entityVersion }, clientRequestId);
        }),
      });
    };
    if (action === "request" && (Number(factory.unitPrice) <= 0 || Number(factory.quantity) <= 0 || !factory.partnerId)) {
      showWaflAlert("제작 공장, 장당 공임, 레시피 수량을 확인해 주세요.", "warning");
      return;
    }
    await execute();
  }
  function inlineField(process: WorkOrderProcess, field: InlineField, label: string, placeholder: string) { const active = inlineSession?.processId === process.id && inlineSession.field === field; const confirmedFactoryMemo = confirmedMemoEditable && process.role === "factory" && field === "memo"; const fieldEditable=confirmedFactoryMemo||!reorderDraft||field==="unitPrice"||(field==="memo"&&process.role==="factory"); return <ProductionInlineField active={active} draft={active ? inlineSession.draft : ""} editable={fieldEditable} error={active ? inlineSession.error : null} field={field} forceEditable={confirmedFactoryMemo} key={`${process.id}-${field}`} label={label} onActivate={() => beginInline(process, field)} onCancel={() => setInlineSession(null)} onChange={(nextDraft) => { const draft = field === "memo" ? nextDraft.slice(0, PRODUCTION_MEMO_MAX_LENGTH) : nextDraft; if (field === "unitPrice" && !isIntegerWonDraft(draft)) return; setInlineSession((current) => current && current.processId === process.id && current.field === field ? { ...current, draft, error: field === "unitPrice" && draft && !isIntegerWonValue(draft) ? "장당 공임은 0 이상의 정수 원 단위로 입력해 주세요." : null } : current); }} onSave={(value) => { void saveInline(process, field, value); }} placeholder={placeholder} process={process} saving={pendingKey === `${field}-${process.id}`} />; }

  if ((!data || !options) && error) return <View style={styles.container}><WaflSectionCard><View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityLabel="제작 정보 다시 불러오기" onPress={() => { void load(); }} style={styles.iconButton}><RefreshCw color={WAFL_THEME.color.navyInk} size={18} /></Pressable></View></WaflSectionCard></View>;
  if (!data || !options) return <DelayedLoadingMessage identity={`production:${workOrderId}`} loading scope="production" />;
  const currentData = data;

  const factoryPolicy = factory ? resolveProductionOrderPolicy({ status: factory.status, currentDraft: data.editable, editable: factory.editable }) : null;
  const basicAction = category === "basic" && factoryPolicy?.actions.length ? <View style={styles.actions}>{factoryPolicy.actions.map((action) => { const view = ORDER_ACTION_VIEW[action]; return <WaflCompactCardAction Icon={view.Icon} accessibilityLabel={view.label} busy={pendingKey === `order-${action}-${factory?.id}`} caption={view.caption} danger={view.danger} emphasized={view.emphasized} key={action} onPress={() => { void runOrderAction(action); }} />; })}</View> : null;
  const categoryAction = category === "additional" && data.editable && !reorderDraft ? <WaflSectionHeaderAction accessibilityLabel="추가 공정 등록" icon={<Plus color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.standard} />} onPress={() => presentPicker({ kind: "process", processId: null })} testID="production-add-process" /> : basicAction;
  const selectedProcess = pickerTarget?.kind === "process" && pickerTarget.processId ? additional.find((item) => item.id === pickerTarget.processId) ?? null : null;
  const selectedPartnerTarget = pickerTarget?.kind === "partner" ? pickerTarget : null;
  const selectedPartnerProcess = selectedPartnerTarget?.processId ? additional.find((item) => item.id === selectedPartnerTarget.processId) ?? null : null;

  function processCard(process: WorkOrderProcess) {
    const factoryRole = process.role === "factory";
    const expanded = expandedIds.has(process.id);
    const accentColor = factoryRole ? WAFL_THEME.productionAccent.factoryAccent : WAFL_THEME.productionAccent.processAccents[resolveProductionProcessAccentIndex(process.processTypeCode, WAFL_THEME.productionAccent.processAccents.length)];
    // The callbacks below execute only from native Pressable events; no ref is read while rendering.
    // eslint-disable-next-line react-hooks/refs
    const deleteAction = !reorderDraft && !factoryRole && process.editable && process.status === "ready" ? <WaflCompactCardAction Icon={Trash2} accessibilityLabel={`${process.processName} 삭제`} busy={pendingKey === `delete-${process.id}`} danger onPress={() => requestDelete(process)} /> : undefined;
    return <WaflCompactEntityCard accentColor={accentColor} key={process.id} testID={factoryRole ? "production-factory-card" : `production-process-card-${process.id}`}><WaflCompactEntityHeader expanded={expanded} label={factoryRole ? "기본 공정" : "추가 공정"} onToggle={() => toggleExpanded(process.id)} /><View style={styles.cardBody}>{!factoryRole ? <WaflCompactSelectionField accessibilityLabel={`${process.processName} 공정 선택`} editable={!reorderDraft && process.editable && process.status === "ready"} label="공정" onPress={() => presentPicker({ kind: "process", processId: process.id })} showChevron value={process.processName} /> : null}<WaflCompactSelectionField accessibilityLabel={`${factoryRole ? "제작 공장" : process.processName} 거래처 선택`} editable={!reorderDraft && process.editable && process.status === "ready"} label="거래처" onPress={() => factoryRole ? presentPicker({ kind: "factory" }) : presentPicker({ kind: "partner", processId: process.id, processCode: process.processTypeCode })} showChevron value={process.partnerName ?? ""} />{inlineField(process, "unitPrice", "공임", "0원")}</View>{expanded ? <WaflCompactEntityExpanded>{inlineField(process, "memo", "메모", WAFL_UNSET_PLACEHOLDER)}</WaflCompactEntityExpanded> : null}<WaflCompactActionRow actions={deleteAction} testID="production-process-summary-row"><WaflCompactSummaryLine testID="production-process-summary">수량 {formatQuantity(currentData.totalQuantity, "개")} · 금액 {formatWon(process.amount)}</WaflCompactSummaryLine></WaflCompactActionRow></WaflCompactEntityCard>;
  }

  const activePickerConfig = pickerHandoff.route === "factory"
    ? { allowUnset: true, emptyMessage: undefined, field: "factoryPartnerId", label: "제작 공장", onApply: (value: string) => applyFactory(value), optionItems: options.factoryPartners.map((item) => ({ value: item.id, label: item.name })), pending: pendingKey?.startsWith("factory") ?? false, requireSpecifiedValue: false, selectFirstRealOption: false, value: factory?.partnerId ?? "" }
    : pickerHandoff.route === "process"
      ? { allowUnset: selectedProcess === null, emptyMessage: undefined, field: "processCode", label: "공정", onApply: (value: string) => applyProcess(value, pickerTarget?.kind === "process" ? pickerTarget.processId : null), optionItems: options.processStandards.map((item) => ({ value: item.code, label: item.name })), pending: false, requireSpecifiedValue: selectedProcess === null, selectFirstRealOption: false, value: selectedProcess?.processTypeCode ?? "" }
      : { allowUnset: false, emptyMessage: "이 공정을 취급하는 등록 거래처가 없습니다.", field: "partnerId", label: "거래처", onApply: (value: string) => selectedPartnerTarget ? applyPartner(value, selectedPartnerTarget.processId, selectedPartnerTarget.processCode) : undefined, optionItems: selectedPartnerTarget ? partnerOptionsFor(selectedPartnerTarget.processCode).map((item) => ({ value: item.id, label: item.name })) : [], pending: Boolean(pendingKey?.startsWith("partner") || pendingKey === "create-additional"), requireSpecifiedValue: true, selectFirstRealOption: true, value: selectedPartnerProcess?.partnerId ?? "" };
  const activePicker = <WaflReelPickerSheet allowUnset={activePickerConfig.allowUnset} emptyMessage={activePickerConfig.emptyMessage} field={activePickerConfig.field} key={pickerHandoff.route} kind="option" label={activePickerConfig.label} onAfterClose={pickerHandoff.finishClose} onApply={activePickerConfig.onApply} onCancel={dismissPicker} optionItems={activePickerConfig.optionItems} pending={activePickerConfig.pending} presentationGeneration={pickerHandoff.presentationGeneration} requireSpecifiedValue={activePickerConfig.requireSpecifiedValue} selectFirstRealOption={activePickerConfig.selectFirstRealOption} unitCode="" value={activePickerConfig.value} visible={pickerHandoff.visible} />;

  return <View style={styles.container} testID="work-order-production-authoring">{error ? <View style={styles.refreshError}><Text style={styles.refreshErrorText}>{error}</Text><Pressable accessibilityLabel="제작 정보 다시 불러오기" onPress={() => { void load(); }} style={styles.iconButton}><RefreshCw color={WAFL_THEME.color.navyInk} size={18} /></Pressable></View> : null}<WaflSectionCard><WaflSectionCategorySwitch<ProductionCategory> action={categoryAction ?? undefined} onSelect={(nextCategory) => { void switchCategory(nextCategory); }} optionTestIDPrefix="production-category" options={[{ value: "basic", label: "기본 공정", count: factory ? 1 : 0, badgeTone: WAFL_THEME.badge.fabric }, { value: "additional", label: "추가 공정", count: additional.length, badgeTone: WAFL_THEME.badge.accessory }]} selected={category} testID="production-category-switch" />{category === "basic" ? <View style={styles.processList}>{factory ? processCard(factory) : <WaflCompactEntityCard accentColor={WAFL_THEME.productionAccent.factoryAccent} testID="production-factory-card-empty"><View style={styles.emptyFactory}><Text style={styles.empty}>제작 공장이 미지정입니다.</Text>{data.editable ? <Pressable accessibilityLabel="제작 공장 선택" accessibilityRole="button" onPress={() => presentPicker({ kind: "factory" })} style={({ pressed }) => [styles.emptyFactoryAction, pressed && styles.pressed]}><Text style={styles.emptyFactoryActionText}>제작 공장 선택</Text><ChevronRight color={WAFL_THEME.color.navyInk} size={18} /></Pressable> : null}</View></WaflCompactEntityCard>}</View> : additional.length ? <View style={styles.processList}>{additional.map(processCard)}</View> : <Text style={styles.empty}>등록된 추가 공정이 없습니다.</Text>}</WaflSectionCard>{activePicker}</View>;
}

const styles = StyleSheet.create({
  container: { gap: WAFL_THEME.layout.sectionGap, paddingBottom: WAFL_THEME.layout.sectionGapLarge }, processList: { gap: WAFL_THEME.layout.sectionGap }, cardBody: { flexDirection: "row", gap: WAFL_THEME.layout.controlGap, paddingBottom: WAFL_THEME.layout.compactCardInsetVertical, paddingHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal }, compactInline: { flex: 1, minWidth: 0 }, characterCount: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, textAlign: "right" }, empty: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.body, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight, paddingVertical: WAFL_THEME.spacing.sm }, emptyFactory: { gap: WAFL_THEME.layout.tightGap, padding: WAFL_THEME.layout.compactCardInsetHorizontal }, emptyFactoryAction: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: WAFL_THEME.touch.minimum }, emptyFactoryActionText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.bodyText.fontSize }, actions: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.tightGap }, iconButton: { alignItems: "center", justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, minWidth: WAFL_THEME.touch.minimum }, error: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, errorText: { color: WAFL_THEME.color.error, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize }, refreshError: { alignItems: "center", backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.cardCompact, flexDirection: "row", justifyContent: "space-between", padding: WAFL_THEME.layout.compactCardPadding }, refreshErrorText: { color: WAFL_THEME.color.error, flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize }, pressed: { opacity: 0.68 },
});
