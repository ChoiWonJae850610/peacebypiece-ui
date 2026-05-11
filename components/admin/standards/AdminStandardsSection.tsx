"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { fetchPartnerMasterItemsFromApi, savePartnerMasterProcessesToApi } from "@/lib/admin/partner/apiClient";
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

function sortProcessesByLabel(items: OutsourcingProcessDefinition[]) {
  return items.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
}

type AdminStandardsSectionProps = {
  mode?: "full" | "standards-only";
};

export default function AdminStandardsSection({ mode = "full" }: AdminStandardsSectionProps) {
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

  useEffect(() => {
    let isMounted = true;

    fetchPartnerMasterItemsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        if (payload.processDefinitions) {
          setProcessDefinitions(payload.processDefinitions);
          setProcessDraftDefinitions(payload.processDefinitions);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setProcessDefinitions([]);
        setProcessDraftDefinitions([]);
      });

    fetchAdminStandardsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        setUnitDefinitions(Array.isArray(payload.units) ? payload.units : []);
        setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : []);
        setDefaultItemCategoryDefinitions(Array.isArray(payload.defaultItemCategories) ? payload.defaultItemCategories : []);
      })
      .catch(() => {
        if (!isMounted) return;
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
    setProcessDraftDefinitions(processDefinitions);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
    setIsProcessModalOpen(true);
  }, [processDefinitions]);

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
    savePartnerMasterProcessesToApi(nextDefinitions)
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
        setProcessFormError(t("standards.section.saveProcessFailed", "저장에 실패했습니다. DB 연결 상태를 확인하세요."));
      })
      .finally(() => setIsSavingProcesses(false));
  }, [isSavingProcesses, processDraftDefinitions, t]);

  const saveUnitDefinitions = useCallback((nextUnits: AdminUnitDefinition[]) => {
    setIsSavingUnits(true);
    setStandardFormError("");
    saveAdminUnitsToApi(nextUnits)
      .then((payload) => {
        setUnitDefinitions(Array.isArray(payload.units) ? payload.units : nextUnits);
        setIsUnitModalOpen(false);
      })
      .catch(() => setStandardFormError(t("standards.section.saveUnitFailed", "단위 저장에 실패했습니다. DB 연결 상태를 확인하세요.")))
      .finally(() => setIsSavingUnits(false));
  }, [t]);

  const saveItemCategoryDefinitions = useCallback((nextCategories: AdminItemCategoryDefinition[]) => {
    setIsSavingItemCategories(true);
    setStandardFormError("");
    saveAdminItemCategoriesToApi(nextCategories)
      .then((payload) => {
        setItemCategoryDefinitions(Array.isArray(payload.itemCategories) ? payload.itemCategories : nextCategories);
        setIsItemCategoryModalOpen(false);
      })
      .catch(() => setStandardFormError(t("standards.section.saveItemFailed", "품목 저장에 실패했습니다. DB 연결 상태를 확인하세요.")))
      .finally(() => setIsSavingItemCategories(false));
  }, [t]);

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

  const standardActions: StandardAction[] = [
    { key: "items", title: t("standards.actions.items.title", "생산품 유형"), description: `${itemCategoryDefinitions.filter((item) => item.is_active).length}/${itemCategoryDefinitions.length}${t("standards.common.inUseSuffix", "개 사용중")}`, statusLabel: t("standards.common.manage", "관리"), onClick: () => setIsItemCategoryModalOpen(true) },
    { key: "units", title: t("standards.actions.units.title", "단위 표준"), description: `${unitDefinitions.filter((unit) => unit.is_active).length}/${unitDefinitions.length}${t("standards.common.inUseSuffix", "개 사용중")}`, statusLabel: t("standards.common.manage", "관리"), onClick: () => setIsUnitModalOpen(true) },
    { key: "processes", title: t("standards.actions.processes.title", "외주 공정 유형"), description: `${activeProcessDefinitions.length}/${processDraftDefinitions.length}${t("standards.common.inUseSuffix", "개 사용중")}`, statusLabel: t("standards.common.manage", "관리"), onClick: openProcessModal },
  ];

  const renderActionGrid = (actions: StandardAction[]) => (
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          disabled={!action.onClick}
          className="flex min-h-[86px] items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-left transition enabled:hover:border-stone-300 enabled:hover:bg-white disabled:cursor-default disabled:opacity-70"
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold text-stone-950">{action.title}</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-stone-500">{action.description}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-stone-600 shadow-sm">{action.statusLabel}</span>
        </button>
      ))}
    </div>
  );

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
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-950">{t("standards.section.standardTitle", "기준 관리")}</h2>
          <p className="hidden text-xs font-semibold text-stone-400 sm:block">작업지시서 생성 기준값</p>
        </div>
        <div className="mt-2.5">{renderActionGrid(standardActions)}</div>
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
