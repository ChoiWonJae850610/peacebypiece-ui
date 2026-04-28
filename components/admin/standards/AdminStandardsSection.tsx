"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNotificationSettingsModal from "@/components/admin/AdminNotificationSettingsModal";
import PartnerProcessManagementModal from "@/components/admin/partnerMaster/PartnerProcessManagementModal";
import AdminItemCategoryManagementModal from "@/components/admin/standards/AdminItemCategoryManagementModal";
import AdminFilePolicySettingsModal from "@/components/admin/standards/AdminFilePolicySettingsModal";
import AdminUnitManagementModal from "@/components/admin/standards/AdminUnitManagementModal";
import {
  createDefaultOutsourcingProcessDefinitions,
  createOutsourcingProcessDefinition,
  normalizeOutsourcingProcessDefinitions,
  PARTNER_MASTER_FORM_ERRORS,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import { createDefaultItemCategoryDefinitions, createDefaultUnitDefinitions } from "@/lib/admin/standards.defaults";
import { fetchPartnerMasterItemsFromApi, savePartnerMasterProcessesToApi } from "@/lib/admin/partnerMasterApiClient";
import { fetchAdminStandardsFromApi, saveAdminItemCategoriesToApi, saveAdminUnitsToApi } from "@/lib/admin/standardsApiClient";
import type { AdminItemCategoryDefinition, AdminUnitDefinition } from "@/lib/admin/standards.types";
import { useAdminWorkspaceTools } from "@/lib/admin/useAdminWorkspaceTools";
import type { OutsourcingProcessType } from "@/types/partner";

type StandardAction = {
  key: "items" | "units" | "processes" | "logs" | "filePolicy";
  title: string;
  statusLabel: string;
  onClick?: () => void;
};

function sortProcessesByLabel(items: OutsourcingProcessDefinition[]) {
  return items.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
}

export default function AdminStandardsSection() {
  const notificationTools = useAdminWorkspaceTools();
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>(createDefaultOutsourcingProcessDefinitions());
  const [processDraftDefinitions, setProcessDraftDefinitions] = useState<OutsourcingProcessDefinition[]>(createDefaultOutsourcingProcessDefinitions());
  const [unitDefinitions, setUnitDefinitions] = useState<AdminUnitDefinition[]>(createDefaultUnitDefinitions());
  const [itemCategoryDefinitions, setItemCategoryDefinitions] = useState<AdminItemCategoryDefinition[]>(createDefaultItemCategoryDefinitions());
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isItemCategoryModalOpen, setIsItemCategoryModalOpen] = useState(false);
  const [isFilePolicyModalOpen, setIsFilePolicyModalOpen] = useState(false);
  const [newProcessLabel, setNewProcessLabel] = useState("");
  const [processFormError, setProcessFormError] = useState("");
  const [standardFormError, setStandardFormError] = useState("");
  const [isSavingUnits, setIsSavingUnits] = useState(false);
  const [isSavingItemCategories, setIsSavingItemCategories] = useState(false);
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
        setUnitDefinitions(payload.units.length > 0 ? payload.units : createDefaultUnitDefinitions());
        setItemCategoryDefinitions(payload.itemCategories.length > 0 ? payload.itemCategories : createDefaultItemCategoryDefinitions());
      })
      .catch(() => {
        if (!isMounted) return;
        setUnitDefinitions(createDefaultUnitDefinitions());
        setItemCategoryDefinitions(createDefaultItemCategoryDefinitions());
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
    setIsProcessModalOpen(false);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
    setProcessDraftDefinitions(processDefinitions);
  }, [processDefinitions]);

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
    const nextDefinitions = normalizeOutsourcingProcessDefinitions(processDraftDefinitions);
    setProcessDefinitions(nextDefinitions);
    savePartnerMasterProcessesToApi(nextDefinitions)
      .then((payload) => {
        if (payload.processDefinitions) setProcessDefinitions(payload.processDefinitions);
      })
      .catch(() => {
        setProcessFormError("저장에 실패했습니다. DB 연결 상태를 확인하세요.");
        return;
      });
    setIsProcessModalOpen(false);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
  }, [processDraftDefinitions]);

  const saveUnitDefinitions = useCallback((nextUnits: AdminUnitDefinition[]) => {
    setIsSavingUnits(true);
    setStandardFormError("");
    saveAdminUnitsToApi(nextUnits)
      .then((payload) => {
        setUnitDefinitions(payload.units.length > 0 ? payload.units : nextUnits);
        setIsUnitModalOpen(false);
      })
      .catch(() => setStandardFormError("단위 저장에 실패했습니다. DB 연결 상태를 확인하세요."))
      .finally(() => setIsSavingUnits(false));
  }, []);

  const saveItemCategoryDefinitions = useCallback((nextCategories: AdminItemCategoryDefinition[]) => {
    setIsSavingItemCategories(true);
    setStandardFormError("");
    saveAdminItemCategoriesToApi(nextCategories)
      .then((payload) => {
        setItemCategoryDefinitions(payload.itemCategories.length > 0 ? payload.itemCategories : nextCategories);
        setIsItemCategoryModalOpen(false);
      })
      .catch(() => setStandardFormError("품목 저장에 실패했습니다. DB 연결 상태를 확인하세요."))
      .finally(() => setIsSavingItemCategories(false));
  }, []);

  const resetProcessDefinitions = useCallback(() => {
    const nextDefinitions = createDefaultOutsourcingProcessDefinitions();
    setProcessDraftDefinitions(nextDefinitions);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
  }, []);

  const actions: StandardAction[] = [
    { key: "items", title: "생산품 유형", statusLabel: "관리", onClick: () => setIsItemCategoryModalOpen(true) },
    { key: "units", title: "단위 표준", statusLabel: "관리", onClick: () => setIsUnitModalOpen(true) },
    { key: "processes", title: "외주 공정", statusLabel: "관리", onClick: openProcessModal },
    { key: "logs", title: "로그 이벤트", statusLabel: "관리", onClick: notificationTools.openNotificationModal },
    { key: "filePolicy", title: "파일 정책", statusLabel: "관리", onClick: () => setIsFilePolicyModalOpen(true) },
  ];

  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={!action.onClick}
            className="flex min-h-[84px] items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-left transition enabled:hover:border-stone-300 enabled:hover:bg-white disabled:cursor-default disabled:opacity-70"
          >
            <span className="text-sm font-semibold text-stone-950">{action.title}</span>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-stone-500 shadow-sm">{action.statusLabel}</span>
          </button>
        ))}
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
        saving={isSavingItemCategories}
        error={standardFormError}
        onClose={() => setIsItemCategoryModalOpen(false)}
        onSave={saveItemCategoryDefinitions}
      />


      <AdminFilePolicySettingsModal
        open={isFilePolicyModalOpen}
        onClose={() => setIsFilePolicyModalOpen(false)}
      />

      <AdminNotificationSettingsModal
        open={notificationTools.activeModal === "notification"}
        onClose={notificationTools.closeModal}
        notificationSettings={notificationTools.notificationSettings}
        onToggleNotificationSetting={notificationTools.handleToggleNotificationSetting}
        title="로그 이벤트"
        description=""
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
