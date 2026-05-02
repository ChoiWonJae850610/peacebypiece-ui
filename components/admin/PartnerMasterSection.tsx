"use client";

import { useI18n } from "@/lib/i18n";
import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import PartnerMasterFormModal from "@/components/admin/partnerMaster/PartnerMasterFormModal";
import PartnerMasterHeader from "@/components/admin/partnerMaster/PartnerMasterHeader";
import PartnerMasterList from "@/components/admin/partnerMaster/PartnerMasterList";
import { togglePartnerFilterSelection } from "@/lib/admin/partner";
import { usePartnerMasterController } from "@/components/admin/partnerMaster/usePartnerMasterController";

export default function PartnerMasterSection() {
  const { i18n } = useI18n();
  const partnerText = i18n.admin.partnerMaster;
  const controller = usePartnerMasterController(partnerText);

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur md:p-6">
      <PartnerMasterHeader onOpenCreateModal={controller.openCreateModal} />

      <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-sky-900">
        {partnerText.filters.summaryDescription}
      </div>

      <PartnerMasterFilters
        searchTerm={controller.searchTerm}
        onSearchTermChange={controller.setSearchTerm}
        filterOptions={controller.listViewModel.filterOptions}
        selectedTypes={controller.selectedTypes}
        onToggleType={(value) =>
          controller.setSelectedTypes((current) => togglePartnerFilterSelection(current, value))
        }
        selectedStatus={controller.selectedStatus}
        onStatusChange={controller.setSelectedStatus}
        filteredCount={controller.listViewModel.filteredCount}
        hasSearch={controller.listViewModel.hasSearch}
      />

      <PartnerMasterList
        className="mt-5 min-h-0 flex-1"
        items={controller.listViewModel.items}
        isLoading={controller.isLoadingPartners}
        onEditPartner={controller.openEditModal}
      />

      <PartnerMasterFormModal
        open={controller.isModalOpen}
        editingPartnerId={controller.editingPartnerId}
        draft={controller.draft}
        formError={controller.formError}
        selectedPrimaryTypes={controller.selectedPrimaryTypes}
        isOutsourcingEnabled={controller.isOutsourcingEnabled}
        availableProcessDefinitions={controller.availableProcessDefinitions}
        assignedProcessDefinitions={controller.assignedProcessDefinitions}
        selectedAvailableProcess={controller.selectedAvailableProcess}
        selectedAssignedProcess={controller.selectedAssignedProcess}
        onClose={controller.closeModal}
        onSubmit={controller.handleSubmit}
        onDraftChange={controller.setDraft}
        onSetPrimaryType={controller.setPrimaryType}
        onToggleOutsourcingProcess={controller.toggleOutsourcingProcess}
        onSelectAvailableProcess={controller.setSelectedAvailableProcess}
        onSelectAssignedProcess={controller.setSelectedAssignedProcess}
      />
    </section>
  );
}
