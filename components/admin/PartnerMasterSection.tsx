"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import PartnerMasterFormModal from "@/components/admin/partnerMaster/PartnerMasterFormModal";
import PartnerMasterHeader from "@/components/admin/partnerMaster/PartnerMasterHeader";
import PartnerMasterList from "@/components/admin/partnerMaster/PartnerMasterList";
import PartnerProcessManagementModal from "@/components/admin/partnerMaster/PartnerProcessManagementModal";
import {
  applyPartnerTypeSelectionPolicy,
  buildPartnerDraftFromEntity,
  buildPartnerListViewModel,
  createDefaultOutsourcingProcessDefinitions,
  createEmptyPartnerDraft,
  createOutsourcingProcessDefinition,
  DEFAULT_PARTNER_FILTER_STATE,
  isBasePartnerType,
  normalizeOutsourcingProcessDefinitions,
  normalizePartnerDraft,
  PARTNER_MASTER_FORM_ERRORS,
  togglePartnerFilterSelection,
  type BasePartnerType,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import { fetchPartnerMasterItemsFromApi, savePartnerMasterItemToApi, savePartnerMasterProcessesToApi } from "@/lib/admin/partnerMasterApiClient";
import type { OutsourcingProcessType, Partner, PartnerDraft } from "@/types/partner";

export default function PartnerMasterSection() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedTypes, setSelectedTypes] = useState(DEFAULT_PARTNER_FILTER_STATE.selectedTypes);
  const [selectedStatus, setSelectedStatus] = useState(DEFAULT_PARTNER_FILTER_STATE.status);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_PARTNER_FILTER_STATE.searchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PartnerDraft>(createEmptyPartnerDraft());
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>(
    createDefaultOutsourcingProcessDefinitions(),
  );
  const [processDraftDefinitions, setProcessDraftDefinitions] = useState<OutsourcingProcessDefinition[]>(
    createDefaultOutsourcingProcessDefinitions(),
  );
  const [selectedAvailableProcess, setSelectedAvailableProcess] = useState<OutsourcingProcessType | null>(null);
  const [selectedAssignedProcess, setSelectedAssignedProcess] = useState<OutsourcingProcessType | null>(null);
  const [selectedInactiveProcessDefinition, setSelectedInactiveProcessDefinition] = useState<OutsourcingProcessType | null>(null);
  const [selectedActiveProcessDefinition, setSelectedActiveProcessDefinition] = useState<OutsourcingProcessType | null>(null);
  const [formError, setFormError] = useState("");
  const [newProcessLabel, setNewProcessLabel] = useState("");
  const [processFormError, setProcessFormError] = useState("");
  const [, setRepositoryStatus] = useState("저장소 확인 중");

  useEffect(() => {
    let isMounted = true;

    fetchPartnerMasterItemsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        setPartners(payload.partners);
        if (payload.processDefinitions) setProcessDefinitions(payload.processDefinitions);
        setRepositoryStatus(payload.repository?.mode === "db" ? "DB 연결" : "mock 저장소");
      })
      .catch(() => {
        if (!isMounted) return;
        setPartners([]);
        setRepositoryStatus("DB 연결 실패");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const listViewModel = useMemo(
    () => buildPartnerListViewModel(partners, { selectedTypes, status: selectedStatus, searchTerm }, processDefinitions),
    [partners, processDefinitions, searchTerm, selectedStatus, selectedTypes],
  );

  const isOutsourcingEnabled = draft.partnerTypes.includes("outsourcing_vendor");
  const selectedPrimaryTypes = draft.partnerTypes.filter(isBasePartnerType);
  const availableProcessDefinitions = processDefinitions
    .filter((definition) => definition.isActive && !draft.outsourcingProcessTypes.includes(definition.type))
    .sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
  const assignedProcessDefinitions = processDefinitions
    .filter((definition) => draft.outsourcingProcessTypes.includes(definition.type))
    .sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
  const sortProcessesByLabel = (items: OutsourcingProcessDefinition[]) =>
    items.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
  const activeProcessDefinitions = sortProcessesByLabel(processDraftDefinitions.filter((definition) => definition.isActive));
  const inactiveProcessDefinitions = sortProcessesByLabel(processDraftDefinitions.filter((definition) => !definition.isActive));
  const resetDraftState = useCallback(() => {
    setEditingPartnerId(null);
    setDraft(createEmptyPartnerDraft());
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
    setFormError("");
  }, []);

  const openCreateModal = useCallback(() => {
    resetDraftState();
    setIsModalOpen(true);
  }, [resetDraftState]);

  const openEditModal = useCallback((partnerId: string) => {
    const partner = listViewModel.editablePartnerMap[partnerId];
    if (!partner) return;

    setEditingPartnerId(partner.id);
    setDraft(buildPartnerDraftFromEntity(partner));
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
    setFormError("");
    setIsModalOpen(true);
  }, [listViewModel.editablePartnerMap]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetDraftState();
  }, [resetDraftState]);

  const closeProcessModal = useCallback(() => {
    setIsProcessModalOpen(false);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
    setProcessDraftDefinitions(processDefinitions);
  }, [processDefinitions]);

  const openProcessModal = useCallback(() => {
    setProcessDraftDefinitions(processDefinitions);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
    setIsProcessModalOpen(true);
  }, [processDefinitions]);


  const persistProcessDefinitions = useCallback((nextDefinitions: OutsourcingProcessDefinition[]) => {
    savePartnerMasterProcessesToApi(nextDefinitions)
      .then((payload) => {
        if (payload.processDefinitions) setProcessDefinitions(payload.processDefinitions);
        if (payload.partners) setPartners(payload.partners);
        setRepositoryStatus(payload.repository?.mode === "db" ? "DB 연결" : "mock 저장소");
      })
      .catch(() => {
        setRepositoryStatus("DB 연결 실패");
      });
  }, []);

  const setPrimaryType = useCallback((type: BasePartnerType) => {
    setDraft((current) => {
      const nextPartnerTypes = applyPartnerTypeSelectionPolicy(current.partnerTypes, type);
      return {
        ...current,
        partnerTypes: nextPartnerTypes,
        outsourcingProcessTypes: nextPartnerTypes.includes("outsourcing_vendor") ? current.outsourcingProcessTypes : [],
      };
    });
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
  }, []);

  const toggleOutsourcingProcess = useCallback((type: OutsourcingProcessType) => {
    setDraft((current) => ({
      ...current,
      outsourcingProcessTypes: current.outsourcingProcessTypes.includes(type)
        ? current.outsourcingProcessTypes.filter((item) => item !== type)
        : [...current.outsourcingProcessTypes, type],
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const normalizedDraft = normalizePartnerDraft(draft);

    if (!normalizedDraft.name) {
      setFormError(PARTNER_MASTER_FORM_ERRORS.nameRequired);
      return;
    }
    if (normalizedDraft.partnerTypes.length === 0) {
      setFormError(PARTNER_MASTER_FORM_ERRORS.typeRequired);
      return;
    }
    if (normalizedDraft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedDraft.email)) {
      setFormError(PARTNER_MASTER_FORM_ERRORS.emailInvalid);
      return;
    }

    savePartnerMasterItemToApi(editingPartnerId, normalizedDraft)
      .then((payload) => {
        setPartners(payload.partners);
        if (payload.processDefinitions) setProcessDefinitions(payload.processDefinitions);
        setRepositoryStatus(payload.repository?.mode === "db" ? "DB 연결" : "mock 저장소");
        closeModal();
      })
      .catch(() => {
        setFormError("저장에 실패했습니다. DB 연결 상태를 확인하세요.");
      });
  }, [closeModal, draft, editingPartnerId]);

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

  const setProcessDefinitionActive = useCallback(
    (type: OutsourcingProcessType, isActive: boolean) => {
      updateProcessDefinition(type, (definition) => ({ ...definition, isActive }));
    },
    [updateProcessDefinition],
  );

  const resetProcessDefinitions = useCallback(() => {
    const nextDefinitions = createDefaultOutsourcingProcessDefinitions();
    setProcessDraftDefinitions(nextDefinitions);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
  }, []);

  const saveProcessDefinitions = useCallback(() => {
    const nextDefinitions = normalizeOutsourcingProcessDefinitions(processDraftDefinitions);
    setProcessDefinitions(nextDefinitions);
    persistProcessDefinitions(nextDefinitions);
    setIsProcessModalOpen(false);
    setNewProcessLabel("");
    setProcessFormError("");
    setSelectedInactiveProcessDefinition(null);
    setSelectedActiveProcessDefinition(null);
  }, [persistProcessDefinitions, processDraftDefinitions]);
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur md:p-6">
      <PartnerMasterHeader onOpenCreateModal={openCreateModal} onOpenProcessModal={openProcessModal} />

      <PartnerMasterFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filterOptions={listViewModel.filterOptions}
        selectedTypes={selectedTypes}
        onToggleType={(value) => setSelectedTypes((current) => togglePartnerFilterSelection(current, value))}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        filteredCount={listViewModel.filteredCount}
        hasSearch={listViewModel.hasSearch}
      />

      <PartnerMasterList
        className="mt-5 min-h-0 flex-1"
        items={listViewModel.items}
        onEditPartner={openEditModal}
      />

      <PartnerMasterFormModal
        open={isModalOpen}
        editingPartnerId={editingPartnerId}
        draft={draft}
        formError={formError}
        selectedPrimaryTypes={selectedPrimaryTypes}
        isOutsourcingEnabled={isOutsourcingEnabled}
        availableProcessDefinitions={availableProcessDefinitions}
        assignedProcessDefinitions={assignedProcessDefinitions}
        selectedAvailableProcess={selectedAvailableProcess}
        selectedAssignedProcess={selectedAssignedProcess}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDraftChange={setDraft}
        onSetPrimaryType={setPrimaryType}
        onToggleOutsourcingProcess={toggleOutsourcingProcess}
        onOpenProcessModal={openProcessModal}
        onSelectAvailableProcess={setSelectedAvailableProcess}
        onSelectAssignedProcess={setSelectedAssignedProcess}
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
        onSetProcessActive={setProcessDefinitionActive}
        onClearProcessFormError={() => setProcessFormError("")}
        onSelectInactiveProcess={setSelectedInactiveProcessDefinition}
        onSelectActiveProcess={setSelectedActiveProcessDefinition}
      />

    </section>
  );
}
