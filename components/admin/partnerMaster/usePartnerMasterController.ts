"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
  applyPartnerPrimaryTypeToDraft,
  buildPartnerDraftFromEntity,
  buildPartnerListViewModel,
  createDefaultOutsourcingProcessDefinitions,
  createEmptyPartnerDraft,
  DEFAULT_PARTNER_FILTER_STATE,
  normalizePartnerDraft,
  PARTNER_MASTER_FORM_ERRORS,
  selectAssignedOutsourcingProcessDefinitions,
  selectAvailableOutsourcingProcessDefinitions,
  selectIsOutsourcingEnabled,
  selectPartnerDraftPrimaryTypes,
  togglePartnerDraftOutsourcingProcess,
  type BasePartnerType,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partner";
import { fetchPartnerMasterItemsFromApi, savePartnerMasterItemToApi } from "@/lib/admin/partner/apiClient";
import type { OutsourcingProcessType, Partner, PartnerDraft } from "@/types/partner";

type PartnerMasterText = {
  typeLabels: Parameters<typeof buildPartnerListViewModel>[3];
  form: {
    saveFailed: string;
  };
};

export function usePartnerMasterController(partnerText: PartnerMasterText) {
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
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const isSavingPartnerRef = useRef(false);

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

  const listViewModel = useMemo(
    () =>
      buildPartnerListViewModel(
        partners,
        { selectedTypes, status: selectedStatus, searchTerm },
        processDefinitions,
        partnerText.typeLabels,
      ),
    [partners, partnerText.typeLabels, processDefinitions, searchTerm, selectedStatus, selectedTypes],
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

  const openEditModal = useCallback(
    (partnerId: string) => {
      const partner = listViewModel.editablePartnerMap[partnerId];

      if (!partner) return;

      setEditingPartnerId(partner.id);
      setDraft(buildPartnerDraftFromEntity(partner));
      setSelectedAvailableProcess(null);
      setSelectedAssignedProcess(null);
      setFormError("");
      setIsModalOpen(true);
    },
    [listViewModel.editablePartnerMap],
  );

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
    if (isSavingPartnerRef.current) return;

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

    isSavingPartnerRef.current = true;
    setIsSavingPartner(true);

    savePartnerMasterItemToApi(editingPartnerId, normalizedDraft)
      .then((payload) => {
        setPartners(payload.partners);
        if (payload.processDefinitions) setProcessDefinitions(payload.processDefinitions);
        closeModal();
      })
      .catch(() => {
        setFormError(partnerText.form.saveFailed);
      })
      .finally(() => {
        isSavingPartnerRef.current = false;
        setIsSavingPartner(false);
      });
  }, [closeModal, draft, editingPartnerId, partnerText.form.saveFailed]);

  return {
    partners,
    setPartners,
    selectedTypes,
    setSelectedTypes: setSelectedTypes as Dispatch<SetStateAction<typeof selectedTypes>>,
    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    editingPartnerId,
    draft,
    setDraft,
    processDefinitions,
    setProcessDefinitions,
    selectedAvailableProcess,
    setSelectedAvailableProcess,
    selectedAssignedProcess,
    setSelectedAssignedProcess,
    formError,
    isLoadingPartners,
    isSavingPartner,
    listViewModel,
    isOutsourcingEnabled,
    selectedPrimaryTypes,
    availableProcessDefinitions,
    assignedProcessDefinitions,
    openCreateModal,
    openEditModal,
    closeModal,
    setPrimaryType,
    toggleOutsourcingProcess,
    handleSubmit,
  };
}
