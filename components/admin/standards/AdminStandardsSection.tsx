"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminNotificationSettingsModal from "@/components/admin/AdminNotificationSettingsModal";
import PartnerProcessManagementModal from "@/components/admin/partnerMaster/PartnerProcessManagementModal";
import AdminItemCategoryManagementModal from "@/components/admin/standards/AdminItemCategoryManagementModal";
import AdminFilePolicySettingsModal from "@/components/admin/standards/AdminFilePolicySettingsModal";
import AdminNotificationPolicySettingsModal from "@/components/admin/standards/AdminNotificationPolicySettingsModal";
import AdminUnitManagementModal from "@/components/admin/standards/AdminUnitManagementModal";
import {
  createOutsourcingProcessDefinition,
  normalizeOutsourcingProcessDefinitions,
  PARTNER_MASTER_FORM_ERRORS,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partner";
import { fetchAdminStandardProcessesFromApi, saveAdminStandardProcessesToApi } from "@/lib/admin/settings/standardsApiClient";
import { fetchAdminStandardsFromApi, saveAdminItemCategoriesToApi, saveAdminUnitsToApi } from "@/lib/admin/settings/standardsApiClient";
import type { AdminItemCategoryDefinition, AdminUnitDefinition } from "@/lib/admin/settings/standardsTypes";
import { useAdminWorkspaceTools } from "@/lib/admin/useAdminWorkspaceTools";
import type { OutsourcingProcessType } from "@/types/partner";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type StandardAction = {
  key: "items" | "units" | "processes" | "logs" | "filePolicy" | "notifications";
  title: string;
  description: string;
  statusLabel: string;
  onClick?: () => void;
};

type StandardTabKey = "items" | "units" | "processes";

type StandardTabConfig = {
  key: StandardTabKey;
  title: string;
  description: string;
  activeCount: number;
  totalCount: number;
  emptyLabel: string;
  onManage?: () => void;
};

function sortProcessesByLabel(items: OutsourcingProcessDefinition[]) {
  return items.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
}

function formatStandardUsageDescription(activeCount: number, totalCount: number, emptyLabel: string, inUseSuffix: string) {
  if (totalCount === 0) return emptyLabel;
  return `${activeCount}/${totalCount}${inUseSuffix}`;
}

type AdminStandardsSectionProps = {
  mode?: "full" | "standards-only";
  capabilities?: {
    canManage?: boolean;
  };
};

export default function AdminStandardsSection({ mode = "full", capabilities }: AdminStandardsSectionProps) {
  const notificationTools = useAdminWorkspaceTools();
  const t = useAdminTranslation();
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>([]);
  const [processDraftDefinitions, setProcessDraftDefinitions] = useState<OutsourcingProcessDefinition[]>([]);
  const [unitDefinitions, setUnitDefinitions] = useState<AdminUnitDefinition[]>([]);
  const [itemCategoryDefinitions, setItemCategoryDefinitions] = useState<AdminItemCategoryDefinition[]>([]);
  const [defaultItemCategoryDefinitions, setDefaultItemCategoryDefinitions] = useState<AdminItemCategoryDefinition[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isItemCategoryModalOpen, setIsItemCategoryModalOpen] = useState(false);
  const [isFilePolicyModalOpen, setIsFilePolicyModalOpen] = useState(false);
  const [isNotificationPolicyModalOpen, setIsNotificationPolicyModalOpen] = useState(false);
  const [newProcessLabel, setNewProcessLabel] = useState("");
  const [processFormError, setProcessFormError] = useState("");
  const [standardFormError, setStandardFormError] = useState("");
  const [isSavingUnits, setIsSavingUnits] = useState(false);
  const [isSavingItemCategories, setIsSavingItemCategories] = useState(false);
  const [isSavingProcesses, setIsSavingProcesses] = useState(false);
  const [selectedInactiveProcessDefinition, setSelectedInactiveProcessDefinition] = useState<OutsourcingProcessType | null>(null);
  const [selectedActiveProcessDefinition, setSelectedActiveProcessDefinition] = useState<OutsourcingProcessType | null>(null);
  const standardsLoadSeqRef = useRef(0);
  const [activeStandardTab, setActiveStandardTab] = useState<StandardTabKey>("items");
  const canManageStandards = capabilities?.canManage ?? true;

  useEffect(() => {
    let isMounted = true;
    const requestId = standardsLoadSeqRef.current + 1;
    standardsLoadSeqRef.current = requestId;

    fetchAdminStandardProcessesFromApi()
      .then((payload) => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        if (payload.processDefinitions) {
          setProcessDefinitions(payload.processDefinitions);
          setProcessDraftDefinitions(payload.processDefinitions);
        }
      })
      .catch(() => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setProcessDefinitions([]);
        setProcessDraftDefinitions([]);
      });

    fetchAdminStandardsFromApi()
      .then((payload) => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setUnitDefinitions(Array.isArray(payload.units) ? payload.units : []);
        setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : []);
        setDefaultItemCategoryDefinitions(Array.isArray(payload.defaultItemCategories) ? payload.defaultItemCategories : []);
      })
      .catch(() => {
        if (!isMounted || standardsLoadSeqRef.current !== requestId) return;
        setUnitDefinitions([]);
        setItemCategoryDefinitions([]);
        setDefaultItemCategoryDefinitions([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeProcessDefinitions = useMemo(
    () => sortProcessesByLabel(processDraftDefinitions.filter((definition) => definition.isActive)),
    [processDraftDefinitions],
  );
  const inactiveProcessDefinitions = useMemo(
    () => sortProcessesByLabel(processDraftDefinitions.filter((definition) => !definition.isActive)),
    [processDraftDefinitions],
  );

  const openProcessModal = useCallback(() => {
    if (!canManageStandards) return;
    setProcessDraftDefinitions(processDefinitions);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
    setIsProcessModalOpen(true);
  }, [canManageStandards, processDefinitions]);

  const closeProcessModal = useCallback(() => {
    if (isSavingProcesses) return;
    setIsProcessModalOpen(false);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
    setProcessDraftDefinitions(processDefinitions);
  }, [isSavingProcesses, processDefinitions]);

  const updateProcessDefinition = useCallback(
    (type: OutsourcingProcessType, updater: (current: OutsourcingProcessDefinition) => OutsourcingProcessDefinition) => {
      setProcessDraftDefinitions((current) =>
        normalizeOutsourcingProcessDefinitions(
          current.map((definition) => (definition.type === type ? updater(definition) : definition)),
        ),
      );
    },
    [],
  );

  const addProcessDefinition = useCallback(() => {
    const normalizedLabel = newProcessLabel.trim();

    if (!normalizedLabel) {
      setProcessFormError(PARTNER_MASTER_FORM_ERRORS.processNameRequired);
      return;
    }

    if (processDraftDefinitions.some((definition) => definition.label.trim() === normalizedLabel)) {
      setProcessFormError(PARTNER_MASTER_FORM_ERRORS.duplicateProcessLabel);
      return;
    }

    setProcessDraftDefinitions((current) => [
      ...normalizeOutsourcingProcessDefinitions(current),
      createOutsourcingProcessDefinition(normalizedLabel, current),
    ]);
    setNewProcessLabel("");
    setProcessFormError("");
  }, [newProcessLabel, processDraftDefinitions]);

  const saveProcessDefinitions = useCallback(() => {
    if (isSavingProcesses) return;
    const nextDefinitions = normalizeOutsourcingProcessDefinitions(processDraftDefinitions);
    setIsSavingProcesses(true);
    setProcessFormError("");
    saveAdminStandardProcessesToApi(nextDefinitions)
      .then((payload) => {
        const savedDefinitions = payload.processDefinitions ? payload.processDefinitions : nextDefinitions;
        setProcessDefinitions(savedDefinitions);
        setProcessDraftDefinitions(savedDefinitions);
        setIsProcessModalOpen(false);
        setNewProcessLabel("");
        setSelectedInactiveProcessDefinition(null);
        setSelectedActiveProcessDefinition(null);
      })
      .catch(() => {
        setProcessFormError(t("standards.section.saveProcessFailed", "저장에 실패했습니다. 연결 상태를 확인하세요."));
      })
      .finally(() => setIsSavingProcesses(false));
  }, [isSavingProcesses, processDraftDefinitions, t]);

  const saveUnitDefinitions = useCallback((nextUnits: AdminUnitDefinition[]) => {
    if (!canManageStandards) return;
    setIsSavingUnits(true);
    setStandardFormError("");
    saveAdminUnitsToApi(nextUnits)
      .then((payload) => {
        setUnitDefinitions(Array.isArray(payload.units) ? payload.units : nextUnits);
        setIsUnitModalOpen(false);
      })
      .catch(() => setStandardFormError(t("standards.section.saveUnitFailed", "단위 저장에 실패했습니다. 연결 상태를 확인하세요.")))
      .finally(() => setIsSavingUnits(false));
  }, [canManageStandards, t]);

  const saveItemCategoryDefinitions = useCallback((nextCategories: AdminItemCategoryDefinition[]) => {
    if (!canManageStandards) return;
    setIsSavingItemCategories(true);
    setStandardFormError("");
    saveAdminItemCategoriesToApi(nextCategories)
      .then((payload) => {
        setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : nextCategories);
        setIsItemCategoryModalOpen(false);
      })
      .catch(() => setStandardFormError(t("standards.section.saveItemFailed", "품목 저장에 실패했습니다. 연결 상태를 확인하세요.")))
      .finally(() => setIsSavingItemCategories(false));
  }, [canManageStandards, t]);

  const resetProcessDefinitions = useCallback(() => {
    setProcessDraftDefinitions((current) => current.map((definition) => ({ ...definition, isActive: true })));
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
  }, []);

  const policyActions: StandardAction[] = [
    { key: "notifications", title: t("standards.actions.notifications.title", "알림 정책"), description: t("standards.actions.notifications.description", "검토·발주·용량·삭제 결과"), statusLabel: t("standards.common.manage", "관리"), onClick: () => setIsNotificationPolicyModalOpen(true) },
    { key: "logs", title: t("standards.actions.logs.title", "로그 이벤트"), description: t("standards.actions.logs.description", "작업지시서 변경 기록 이벤트"), statusLabel: t("standards.common.manage", "관리"), onClick: notificationTools.openNotificationModal },
    { key: "filePolicy", title: t("standards.actions.filePolicy.title", "저장 정책"), description: t("standards.actions.filePolicy.description", "용량·휴지통·실제삭제 기준"), statusLabel: t("standards.common.manage", "관리"), onClick: () => setIsFilePolicyModalOpen(true) },
  ];

  const inUseSuffix = t("standards.common.inUseSuffix", "개 사용중");
  const emptyDbLabel = t("standards.common.emptyDbLabel", "등록된 항목 없음");

  const standardTabs: StandardTabConfig[] = [
    {
      key: "items",
      title: t("standards.actions.items.title", "생산품 유형"),
      description: formatStandardUsageDescription(itemCategoryDefinitions.filter((item) => item.is_active).length, itemCategoryDefinitions.length, t("standards.actions.items.empty", "고객사 품목 없음"), inUseSuffix),
      activeCount: itemCategoryDefinitions.filter((item) => item.is_active).length,
      totalCount: itemCategoryDefinitions.length,
      emptyLabel: t("standards.actions.items.empty", "고객사 품목 없음"),
      onManage: canManageStandards ? () => setIsItemCategoryModalOpen(true) : undefined,
    },
    {
      key: "units",
      title: t("standards.actions.units.title", "단위 표준"),
      description: formatStandardUsageDescription(unitDefinitions.filter((unit) => unit.is_active).length, unitDefinitions.length, emptyDbLabel, inUseSuffix),
      activeCount: unitDefinitions.filter((unit) => unit.is_active).length,
      totalCount: unitDefinitions.length,
      emptyLabel: emptyDbLabel,
      onManage: canManageStandards ? () => setIsUnitModalOpen(true) : undefined,
    },
    {
      key: "processes",
      title: t("standards.actions.processes.title", "외주 공정 유형"),
      description: formatStandardUsageDescription(activeProcessDefinitions.length, processDraftDefinitions.length, emptyDbLabel, inUseSuffix),
      activeCount: activeProcessDefinitions.length,
      totalCount: processDraftDefinitions.length,
      emptyLabel: emptyDbLabel,
      onManage: canManageStandards ? openProcessModal : undefined,
    },
  ];

  const selectedStandardTab = standardTabs.find((tab) => tab.key === activeStandardTab) ?? standardTabs[0];
  const hasMissingDbStandards = unitDefinitions.length === 0 || processDraftDefinitions.length === 0 || defaultItemCategoryDefinitions.length === 0;

  const renderActionGrid = (actions: StandardAction[]) => (
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          disabled={!action.onClick}
          className="flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left transition enabled:hover:border-stone-300 enabled:hover:bg-white disabled:cursor-default disabled:opacity-70"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-stone-950">{action.title}</span>
            <span className="mt-0.5 block text-xs font-medium leading-5 text-stone-500">{action.description}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-stone-600 shadow-sm">{action.statusLabel}</span>
        </button>
      ))}
    </div>
  );

  const renderStandardStatus = (isActive: boolean) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
      {isActive ? t("standards.common.active", "사용") : t("standards.common.inactive", "미사용")}
    </span>
  );

  const renderStandardTable = () => {
    if (activeStandardTab === "items") {
      const rows = itemCategoryDefinitions.slice().sort((a, b) => a.sort_order - b.sort_order || a.level - b.level || a.name.localeCompare(b.name, "ko-KR"));

      return (
        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <div className="grid grid-cols-[minmax(0,1fr)_72px_86px_64px] bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-500">
            <span>{t("standards.table.name", "이름")}</span>
            <span>{t("standards.table.level", "단계")}</span>
            <span>{t("standards.table.status", "상태")}</span>
            <span className="text-right">{t("standards.table.order", "순서")}</span>
          </div>
          <div className="max-h-[320px] overflow-auto divide-y divide-stone-100 bg-white">
            {rows.length > 0 ? rows.map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_72px_86px_64px] items-center px-4 py-3 text-sm">
                <span className="truncate font-semibold text-stone-900">{item.name}</span>
                <span className="text-xs font-medium text-stone-500">{item.level}</span>
                <span>{renderStandardStatus(item.is_active)}</span>
                <span className="text-right text-xs font-medium text-stone-500">{item.sort_order}</span>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-sm font-medium text-stone-500">{selectedStandardTab.emptyLabel}</div>
            )}
          </div>
        </div>
      );
    }

    if (activeStandardTab === "units") {
      const rows = unitDefinitions.slice().sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));

      return (
        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <div className="grid grid-cols-[minmax(0,1fr)_96px_86px_64px] bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-500">
            <span>{t("standards.table.name", "이름")}</span>
            <span>{t("standards.table.code", "코드")}</span>
            <span>{t("standards.table.status", "상태")}</span>
            <span className="text-right">{t("standards.table.order", "순서")}</span>
          </div>
          <div className="max-h-[320px] overflow-auto divide-y divide-stone-100 bg-white">
            {rows.length > 0 ? rows.map((unit) => (
              <div key={unit.id} className="grid grid-cols-[minmax(0,1fr)_96px_86px_64px] items-center px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-stone-900">{unit.name}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-stone-500">{unit.category ?? "-"}</span>
                </span>
                <span className="truncate text-xs font-semibold text-stone-600">{unit.code}</span>
                <span>{renderStandardStatus(unit.is_active)}</span>
                <span className="text-right text-xs font-medium text-stone-500">{unit.sort_order}</span>
              </div>
            )) : (
              <div className="px-4 py-8 text-center text-sm font-medium text-stone-500">{selectedStandardTab.emptyLabel}</div>
            )}
          </div>
        </div>
      );
    }

    const rows = processDraftDefinitions.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "ko-KR"));

    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_86px_64px] bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-500">
          <span>{t("standards.table.name", "이름")}</span>
          <span>{t("standards.table.code", "코드")}</span>
          <span>{t("standards.table.status", "상태")}</span>
          <span className="text-right">{t("standards.table.order", "순서")}</span>
        </div>
        <div className="max-h-[320px] overflow-auto divide-y divide-stone-100 bg-white">
          {rows.length > 0 ? rows.map((process) => (
            <div key={process.type} className="grid grid-cols-[minmax(0,1fr)_120px_86px_64px] items-center px-4 py-3 text-sm">
              <span className="truncate font-semibold text-stone-900">{process.label}</span>
              <span className="truncate text-xs font-semibold text-stone-600">{process.type}</span>
              <span>{renderStandardStatus(process.isActive)}</span>
              <span className="text-right text-xs font-medium text-stone-500">{process.sortOrder}</span>
            </div>
          )) : (
            <div className="px-4 py-8 text-center text-sm font-medium text-stone-500">{selectedStandardTab.emptyLabel}</div>
          )}
        </div>
      </div>
    );
  };

  const showPolicySection = mode === "full";

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {showPolicySection ? (
        <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="shrink-0 text-lg font-semibold text-stone-950">{t("standards.section.policyTitle", "정책 관리")}</h2>
          <div className="mt-3">{renderActionGrid(policyActions)}</div>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-stone-200 bg-white p-3.5 shadow-sm">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-950">{t("standards.section.standardTitle", "기준정보 설정")}</h2>
            <p className="mt-1 text-xs font-medium text-stone-500">{t("standards.section.standardDescription", "작업지시서 생성에 쓰는 기준값을 탭별로 관리합니다.")}</p>
          </div>
          <button
            type="button"
            onClick={selectedStandardTab.onManage}
            disabled={!selectedStandardTab.onManage}
            className="rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition enabled:hover:bg-stone-800 disabled:cursor-default disabled:bg-stone-200 disabled:text-stone-500"
          >
            {canManageStandards ? t("standards.common.manageSelected", "선택 항목 관리") : t("standards.common.readOnly", "조회 전용")}
          </button>
        </div>

        <div className="mt-3 grid gap-2 rounded-2xl bg-stone-100 p-1 sm:grid-cols-3">
          {standardTabs.map((tab) => {
            const selected = tab.key === activeStandardTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStandardTab(tab.key)}
                className={`rounded-xl px-3 py-2 text-left transition ${selected ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
              >
                <span className={`block text-sm font-semibold ${selected ? "text-stone-950" : "text-stone-600"}`}>{tab.title}</span>
                <span className="mt-0.5 block text-xs font-medium text-stone-500">{tab.description}</span>
              </button>
            );
          })}
        </div>

        {hasMissingDbStandards ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            {t("standards.section.missingSeedNotice", "일부 기준정보가 비어 있습니다. 필요한 항목만 선택해 관리하세요.")}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">{selectedStandardTab.title}</p>
          <p className="text-xs font-medium text-stone-500">
            {t("standards.section.activeSummary", "사용")} {selectedStandardTab.activeCount} / {t("standards.section.totalSummary", "전체")} {selectedStandardTab.totalCount}
          </p>
        </div>

        <div className="mt-2.5">{renderStandardTable()}</div>
      </div>

      <AdminUnitManagementModal
        open={isUnitModalOpen}
        units={unitDefinitions}
        saving={isSavingUnits}
        error={standardFormError}
        onClose={() => setIsUnitModalOpen(false)}
        onSave={saveUnitDefinitions}
      />

      <AdminItemCategoryManagementModal
        open={isItemCategoryModalOpen}
        categories={itemCategoryDefinitions}
        defaultCategories={defaultItemCategoryDefinitions}
        saving={isSavingItemCategories}
        error={standardFormError}
        onClose={() => setIsItemCategoryModalOpen(false)}
        onSave={saveItemCategoryDefinitions}
      />

      <AdminFilePolicySettingsModal
        open={isFilePolicyModalOpen}
        onClose={() => setIsFilePolicyModalOpen(false)}
      />

      <AdminNotificationPolicySettingsModal
        open={isNotificationPolicyModalOpen}
        onClose={() => setIsNotificationPolicyModalOpen(false)}
      />

      <AdminNotificationSettingsModal
        open={notificationTools.activeModal === "notification"}
        onClose={notificationTools.closeModal}
        notificationSettings={notificationTools.notificationSettings}
        onToggleNotificationSetting={notificationTools.handleToggleNotificationSetting}
        title={t("standards.section.logEventsTitle", "로그 이벤트")}
        description=""
        onResetNotificationSettings={notificationTools.resetNotificationSettings}
      />

      <PartnerProcessManagementModal
        open={isProcessModalOpen}
        newProcessLabel={newProcessLabel}
        processFormError={processFormError}
        inactiveProcessDefinitions={inactiveProcessDefinitions}
        activeProcessDefinitions={activeProcessDefinitions}
        selectedInactiveProcess={selectedInactiveProcessDefinition}
        selectedActiveProcess={selectedActiveProcessDefinition}
        onClose={closeProcessModal}
        onSave={saveProcessDefinitions}
        saving={isSavingProcesses}
        onResetDefaults={resetProcessDefinitions}
        onNewProcessLabelChange={setNewProcessLabel}
        onAddProcessDefinition={addProcessDefinition}
        onSetProcessActive={(type, isActive) => updateProcessDefinition(type, (definition) => ({ ...definition, isActive }))}
        onClearProcessFormError={() => setProcessFormError("")}
        onSelectInactiveProcess={setSelectedInactiveProcessDefinition}
        onSelectActiveProcess={setSelectedActiveProcessDefinition}
      />
    </section>
  );
}
