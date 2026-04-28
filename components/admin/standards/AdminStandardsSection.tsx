"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PartnerProcessManagementModal from "@/components/admin/partnerMaster/PartnerProcessManagementModal";
import {
  createDefaultOutsourcingProcessDefinitions,
  createOutsourcingProcessDefinition,
  normalizeOutsourcingProcessDefinitions,
  PARTNER_MASTER_FORM_ERRORS,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import { fetchPartnerMasterItemsFromApi, savePartnerMasterProcessesToApi } from "@/lib/admin/partnerMasterApiClient";
import type { OutsourcingProcessType } from "@/types/partner";

type StandardAction = {
  key: "units" | "processes" | "items";
  title: string;
  description: string;
  statusLabel: string;
  onClick?: () => void;
};

function sortProcessesByLabel(items: OutsourcingProcessDefinition[]) {
  return items.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
}

export default function AdminStandardsSection() {
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>(createDefaultOutsourcingProcessDefinitions());
  const [processDraftDefinitions, setProcessDraftDefinitions] = useState<OutsourcingProcessDefinition[]>(createDefaultOutsourcingProcessDefinitions());
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [newProcessLabel, setNewProcessLabel] = useState("");
  const [processFormError, setProcessFormError] = useState("");
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

  const resetProcessDefinitions = useCallback(() => {
    const nextDefinitions = createDefaultOutsourcingProcessDefinitions();
    setProcessDraftDefinitions(nextDefinitions);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
  }, []);

  const actions: StandardAction[] = [
    {
      key: "units",
      title: "단위 관리",
      description: "고객사별 원단, 부자재, 생산 수량 단위를 관리합니다.",
      statusLabel: "SQL 준비",
    },
    {
      key: "processes",
      title: "외주공정 기준",
      description: "나염, 자수, 워싱, 후가공 등 외주공정 사용 여부를 관리합니다.",
      statusLabel: "관리",
      onClick: openProcessModal,
    },
    {
      key: "items",
      title: "품목 관리",
      description: "작지 생성의 대분류, 중분류, 소분류 기준을 관리합니다.",
      statusLabel: "다음 단계",
    },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">MASTER DATA</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-950 md:text-2xl">기준 관리</h2>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 py-5 md:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={!action.onClick}
            className="flex min-h-[180px] flex-col justify-between rounded-[28px] border border-stone-200 bg-stone-50/70 p-5 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:border-stone-300 enabled:hover:bg-white enabled:hover:shadow-sm disabled:cursor-default"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-stone-950">{action.title}</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-500 shadow-sm">{action.statusLabel}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-stone-500">{action.description}</p>
            </div>
            <span className="mt-8 text-sm font-semibold text-stone-900">{action.onClick ? "열기" : "준비중"}</span>
          </button>
        ))}
      </div>

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
