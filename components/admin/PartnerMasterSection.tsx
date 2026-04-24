"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import PartnerMasterFormModal from "@/components/admin/partnerMaster/PartnerMasterFormModal";
import PartnerMasterHeader from "@/components/admin/partnerMaster/PartnerMasterHeader";
import PartnerMasterList from "@/components/admin/partnerMaster/PartnerMasterList";
import PartnerProcessDeleteModal from "@/components/admin/partnerMaster/PartnerProcessDeleteModal";
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
  moveOutsourcingProcessDefinition,
  normalizeOutsourcingProcessDefinitions,
  normalizePartnerDraft,
  PARTNER_MASTER_FORM_ERRORS,
  removeOutsourcingProcessDefinition,
  togglePartnerFilterSelection,
  type BasePartnerType,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import { fetchPartnerMasterItemsFromApi, savePartnerMasterItemToApi } from "@/lib/admin/partnerMasterApiClient";
import {
  loadPartnerMasterInitialState,
  savePartnerMasterItem,
  savePartnerMasterProcessDefinitions,
} from "@/lib/admin/partnerMasterPersistence";
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
  const [selectedAvailableProcess, setSelectedAvailableProcess] = useState<OutsourcingProcessType | null>(null);
  const [selectedAssignedProcess, setSelectedAssignedProcess] = useState<OutsourcingProcessType | null>(null);
  const [formError, setFormError] = useState("");
  const [newProcessLabel, setNewProcessLabel] = useState("");
  const [processFormError, setProcessFormError] = useState("");
  const [deletingProcessType, setDeletingProcessType] = useState<OutsourcingProcessType | null>(null);
  const [repositoryStatus, setRepositoryStatus] = useState("저장소 확인 중");

  useEffect(() => {
    let isMounted = true;
    const initialState = loadPartnerMasterInitialState();
    setPartners(initialState.partners);
    setProcessDefinitions(initialState.processDefinitions);

    fetchPartnerMasterItemsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        setPartners(payload.partners);
        setRepositoryStatus(payload.repository?.mode === "db" ? "DB 연결" : "mock 저장소");
      })
      .catch(() => {
        if (!isMounted) return;
        setRepositoryStatus("local fallback");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    savePartnerMasterProcessDefinitions(processDefinitions);
  }, [processDefinitions]);

  const listViewModel = useMemo(
    () => buildPartnerListViewModel(partners, { selectedTypes, status: selectedStatus, searchTerm }, processDefinitions),
    [partners, processDefinitions, searchTerm, selectedStatus, selectedTypes],
  );

  const isOutsourcingEnabled = draft.partnerTypes.includes("outsourcing_vendor");
  const selectedPrimaryTypes = draft.partnerTypes.filter(isBasePartnerType);
  const availableProcessDefinitions = processDefinitions
    .filter((definition) => definition.isActive && !draft.outsourcingProcessTypes.includes(definition.type))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const assignedProcessDefinitions = processDefinitions
    .filter((definition) => draft.outsourcingProcessTypes.includes(definition.type))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const orderedProcessDefinitions = processDefinitions.slice().sort((a, b) => a.sortOrder - b.sortOrder);

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
  }, []);

  const openProcessModal = useCallback(() => {
    setNewProcessLabel("");
    setProcessFormError("");
    setIsProcessModalOpen(true);
  }, []);

  const setPrimaryType = useCallback((type: BasePartnerType) => {
    setDraft((current) => ({
      ...current,
      partnerTypes: applyPartnerTypeSelectionPolicy(current.partnerTypes, type),
    }));
  }, []);

  const setOutsourcingEnabled = useCallback((enabled: boolean) => {
    setDraft((current) => ({
      ...current,
      partnerTypes: enabled
        ? Array.from(new Set([...current.partnerTypes.filter((item) => item !== "outsourcing_vendor"), "outsourcing_vendor"]))
        : current.partnerTypes.filter((item) => item !== "outsourcing_vendor"),
      outsourcingProcessTypes: enabled ? current.outsourcingProcessTypes : [],
    }));
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

    savePartnerMasterItemToApi(editingPartnerId, normalizedDraft)
      .then((payload) => {
        setPartners(payload.partners);
        setRepositoryStatus(payload.repository?.mode === "db" ? "DB 연결" : "mock 저장소");
        closeModal();
      })
      .catch(() => {
        const nextPartners = savePartnerMasterItem(editingPartnerId, normalizedDraft);
        setPartners(nextPartners);
        setRepositoryStatus("local fallback");
        closeModal();
      });
  }, [closeModal, draft, editingPartnerId]);

  const updateProcessDefinition = useCallback(
    (type: OutsourcingProcessType, updater: (current: OutsourcingProcessDefinition) => OutsourcingProcessDefinition) => {
      setProcessDefinitions((current) =>
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

    if (processDefinitions.some((definition) => definition.label.trim() === normalizedLabel)) {
      setProcessFormError(PARTNER_MASTER_FORM_ERRORS.duplicateProcessLabel);
      return;
    }

    setProcessDefinitions((current) => [
      ...normalizeOutsourcingProcessDefinitions(current),
      createOutsourcingProcessDefinition(normalizedLabel, current),
    ]);
    setNewProcessLabel("");
    setProcessFormError("");
  }, [newProcessLabel, processDefinitions]);

  const moveProcessDefinition = useCallback((type: OutsourcingProcessType, direction: "up" | "down") => {
    setProcessDefinitions((current) => moveOutsourcingProcessDefinition(current, type, direction));
  }, []);

  const requestDeleteProcessDefinition = useCallback((type: OutsourcingProcessType) => {
    setDeletingProcessType(type);
  }, []);

  const confirmDeleteProcessDefinition = useCallback(() => {
    if (!deletingProcessType) return;

    setProcessDefinitions((current) => removeOutsourcingProcessDefinition(current, deletingProcessType));
    setDraft((current) => ({
      ...current,
      outsourcingProcessTypes: current.outsourcingProcessTypes.filter((item) => item !== deletingProcessType),
    }));
    setSelectedAvailableProcess((current) => (current === deletingProcessType ? null : current));
    setSelectedAssignedProcess((current) => (current === deletingProcessType ? null : current));
    setDeletingProcessType(null);
  }, [deletingProcessType]);

  const closeDeleteProcessModal = useCallback(() => {
    setDeletingProcessType(null);
  }, []);

  const resetProcessDefinitions = useCallback(() => {
    setProcessDefinitions(createDefaultOutsourcingProcessDefinitions());
    setNewProcessLabel("");
    setProcessFormError("");
  }, []);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
      <PartnerMasterHeader onOpenCreateModal={openCreateModal} onOpenProcessModal={openProcessModal} />

      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
        Partner 저장소 상태: {repositoryStatus}
      </div>

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
        activeCount={listViewModel.filteredSummary.active}
        inactiveCount={listViewModel.filteredSummary.inactive}
      />

      <PartnerMasterList
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
        onSetOutsourcingEnabled={setOutsourcingEnabled}
        onToggleOutsourcingProcess={toggleOutsourcingProcess}
        onOpenProcessModal={openProcessModal}
        onSelectAvailableProcess={setSelectedAvailableProcess}
        onSelectAssignedProcess={setSelectedAssignedProcess}
      />

      <PartnerProcessManagementModal
        open={isProcessModalOpen}
        newProcessLabel={newProcessLabel}
        processFormError={processFormError}
        orderedProcessDefinitions={orderedProcessDefinitions}
        onClose={closeProcessModal}
        onResetDefaults={resetProcessDefinitions}
        onNewProcessLabelChange={setNewProcessLabel}
        onAddProcessDefinition={addProcessDefinition}
        onUpdateProcessDefinition={updateProcessDefinition}
        onRequestDelete={requestDeleteProcessDefinition}
        onMove={moveProcessDefinition}
        onClearProcessFormError={() => setProcessFormError("")}
      />

      <PartnerProcessDeleteModal
        deletingProcessType={deletingProcessType}
        orderedProcessDefinitions={orderedProcessDefinitions}
        onClose={closeDeleteProcessModal}
        onConfirm={confirmDeleteProcessDefinition}
      />
    </section>
  );
}
