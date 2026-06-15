"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ToastTone } from "@/components/common/ToastMessage";

import {
  applyPartnerPrimaryTypeToDraft,
  buildPartnerDraftFromEntity,
  buildPartnerListViewModel,
  createEmptyPartnerDraft,
  DEFAULT_PARTNER_FILTER_STATE,
  hasDuplicatePartnerNameAndPhone,
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
import { PartnerMasterApiError, fetchPartnerMasterItemsFromApi, savePartnerMasterItemToApi } from "@/lib/admin/partner/apiClient";
import type { OutsourcingProcessType, Partner, PartnerDraft } from "@/types/partner";
import type { PartnerMasterCapabilities } from "@/components/admin/PartnerMasterSection";

type PartnerMasterText = {
  typeLabels: Parameters<typeof buildPartnerListViewModel>[3];
  form: {
    saveFailed: string;
    saveCompleted: string;
  };
};

export function usePartnerMasterController(partnerText: PartnerMasterText, capabilities: PartnerMasterCapabilities = {}) {
  const canCreatePartner = capabilities.canCreate ?? false;
  const canUpdatePartner = capabilities.canUpdate ?? false;

  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedTypes, setSelectedTypes] = useState(DEFAULT_PARTNER_FILTER_STATE.selectedTypes);
  const [selectedStatus, setSelectedStatus] = useState(DEFAULT_PARTNER_FILTER_STATE.status);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_PARTNER_FILTER_STATE.searchTerm);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const canSubmitPartner = editingPartnerId ? canUpdatePartner : canCreatePartner;
  const [draft, setDraft] = useState<PartnerDraft>(createEmptyPartnerDraft());
  const [processDefinitions, setProcessDefinitions] = useState<OutsourcingProcessDefinition[]>([]);
  const [selectedAvailableProcess, setSelectedAvailableProcess] = useState<OutsourcingProcessType | null>(null);
  const [selectedAssignedProcess, setSelectedAssignedProcess] = useState<OutsourcingProcessType | null>(null);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");
  const [toastEventKey, setToastEventKey] = useState(0);
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
    if (!canCreatePartner) return;
    resetDraftState();
    setIsModalOpen(true);
  }, [canCreatePartner, resetDraftState]);

  const openEditModal = useCallback(
    (partnerId: string) => {
      if (!canUpdatePartner) return;
      const partner = listViewModel.editablePartnerMap[partnerId];

      if (!partner) return;

      setEditingPartnerId(partner.id);
      setDraft(buildPartnerDraftFromEntity(partner));
      setSelectedAvailableProcess(null);
      setSelectedAssignedProcess(null);
      setFormError("");
      setIsModalOpen(true);
    },
    [canUpdatePartner, listViewModel.editablePartnerMap],
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
    if (isSavingPartnerRef.current || !canSubmitPartner) return;

    const normalizedDraft = normalizePartnerDraft(draft);

    if (!normalizedDraft.name) {
      setFormError(PARTNER_MASTER_FORM_ERRORS.nameRequired);
      return;
    }

    if (normalizedDraft.partnerTypes.length === 0) {
      setFormError(PARTNER_MASTER_FORM_ERRORS.typeRequired);
      return;
    }

    if (!normalizedDraft.phone) {
      setFormError(PARTNER_MASTER_FORM_ERRORS.phoneRequired);
      return;
    }

    if (hasDuplicatePartnerNameAndPhone(normalizedDraft, partners, editingPartnerId)) {
      setFormError(PARTNER_MASTER_FORM_ERRORS.duplicateNameAndPhone);
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
        setToastTone("success");
        setToastEventKey((currentKey) => currentKey + 1);
        setToastMessage(partnerText.form.saveCompleted);
        closeModal();
      })
      .catch((error) => {
        const message = error instanceof PartnerMasterApiError
          ? {
              PARTNER_MASTER_PHONE_REQUIRED: PARTNER_MASTER_FORM_ERRORS.phoneRequired,
              PARTNER_MASTER_DUPLICATE_NAME_PHONE: PARTNER_MASTER_FORM_ERRORS.duplicateNameAndPhone,
              PARTNER_MASTER_NAME_REQUIRED: PARTNER_MASTER_FORM_ERRORS.nameRequired,
              PARTNER_MASTER_TYPE_REQUIRED: PARTNER_MASTER_FORM_ERRORS.typeRequired,
              PARTNER_MASTER_EMAIL_INVALID: PARTNER_MASTER_FORM_ERRORS.emailInvalid,
            }[error.code] ?? partnerText.form.saveFailed
          : partnerText.form.saveFailed;
        setFormError(message);
        setToastTone("danger");
        setToastEventKey((currentKey) => currentKey + 1);
        setToastMessage(message);
      })
      .finally(() => {
        isSavingPartnerRef.current = false;
        setIsSavingPartner(false);
      });
  }, [canSubmitPartner, closeModal, draft, editingPartnerId, partnerText.form.saveCompleted, partnerText.form.saveFailed, partners]);

  return {
    canCreatePartner,
    canUpdatePartner,
    canSubmitPartner,
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
    toastMessage,
    toastTone,
    toastEventKey,
  };
}
