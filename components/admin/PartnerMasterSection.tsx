"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import PartnerMasterFormModal from "@/components/admin/partnerMaster/PartnerMasterFormModal";
import PartnerMasterHeader from "@/components/admin/partnerMaster/PartnerMasterHeader";
import PartnerMasterList from "@/components/admin/partnerMaster/PartnerMasterList";
import {
  applyPartnerPrimaryTypeToDraft,
  buildPartnerDraftFromEntity,
  buildPartnerListViewModel,
  createDefaultOutsourcingProcessDefinitions,
  createEmptyPartnerDraft,
  DEFAULT_PARTNER_FILTER_STATE,
  selectAssignedOutsourcingProcessDefinitions,
  selectAvailableOutsourcingProcessDefinitions,
  selectIsOutsourcingEnabled,
  selectPartnerDraftPrimaryTypes,
  togglePartnerDraftOutsourcingProcess,
  normalizePartnerDraft,
  PARTNER_MASTER_FORM_ERRORS,
  togglePartnerFilterSelection,
  type BasePartnerType,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partner";
import { fetchPartnerMasterItemsFromApi, savePartnerMasterItemToApi } from "@/lib/admin/partner/apiClient";
import type { OutsourcingProcessType, Partner, PartnerDraft } from "@/types/partner";

export default function PartnerMasterSection() {
  const { i18n } = useI18n();
  const partnerText = i18n.admin.partnerMaster;
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedTypes, setSelectedTypes] = useState(DEFAULT_PARTNER_FILTER_STATE.selectedTypes);
  const [selectedStatus, setSelectedStatus] = useState(DEFAULT_PARTNER_FILTER_STATE.status);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_PARTNER_FILTER_STATE.searchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PartnerDraft>(createEmptyPartnerDraft());
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>(
    createDefaultOutsourcingProcessDefinitions(),
  );
  const [selectedAvailableProcess, setSelectedAvailableProcess] = useState<OutsourcingProcessType | null>(null);
  const [selectedAssignedProcess, setSelectedAssignedProcess] = useState<OutsourcingProcessType | null>(null);
  const [formError, setFormError] = useState("");
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setIsLoadingPartners(true);

    fetchPartnerMasterItemsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        setPartners(payload.partners);
        if (payload.processDefinitions) setProcessDefinitions(payload.processDefinitions);
        setIsLoadingPartners(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setPartners([]);
        setIsLoadingPartners(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const typeLabels = partnerText.typeLabels;

  const listViewModel = useMemo(
    () => buildPartnerListViewModel(partners, { selectedTypes, status: selectedStatus, searchTerm }, processDefinitions, typeLabels),
    [partners, processDefinitions, searchTerm, selectedStatus, selectedTypes, typeLabels],
  );

  const isOutsourcingEnabled = selectIsOutsourcingEnabled(draft);
  const selectedPrimaryTypes = selectPartnerDraftPrimaryTypes(draft);
  const availableProcessDefinitions = selectAvailableOutsourcingProcessDefinitions(draft, processDefinitions);
  const assignedProcessDefinitions = selectAssignedOutsourcingProcessDefinitions(draft, processDefinitions);
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

  const setPrimaryType = useCallback((type: BasePartnerType) => {
    setDraft((current) => applyPartnerPrimaryTypeToDraft(current, type));
    setSelectedAvailableProcess(null);
    setSelectedAssignedProcess(null);
  }, []);

  const toggleOutsourcingProcess = useCallback((type: OutsourcingProcessType) => {
    setDraft((current) => togglePartnerDraftOutsourcingProcess(current, type));
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
        closeModal();
      })
      .catch(() => {
        setFormError(partnerText.form.saveFailed);
      });
  }, [closeModal, draft, editingPartnerId, partnerText.form.saveFailed]);

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur md:p-6">
      <PartnerMasterHeader onOpenCreateModal={openCreateModal} />

      <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-sky-900">
        {partnerText.filters.summaryDescription}
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
      />

      <PartnerMasterList
        className="mt-5 min-h-0 flex-1"
        items={listViewModel.items}
        isLoading={isLoadingPartners}
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
        onSelectAvailableProcess={setSelectedAvailableProcess}
        onSelectAssignedProcess={setSelectedAssignedProcess}
      />
    </section>
  );
}
