"use client";

import { useI18n } from "@/lib/i18n";
import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import PartnerMasterFormModal from "@/components/admin/partnerMaster/PartnerMasterFormModal";
import PartnerMasterHeader from "@/components/admin/partnerMaster/PartnerMasterHeader";
import PartnerMasterList from "@/components/admin/partnerMaster/PartnerMasterList";
import PartnerMasterSummaryCards from "@/components/admin/partnerMaster/PartnerMasterSummaryCards";
import { togglePartnerFilterSelection } from "@/lib/admin/partner";
import { usePartnerMasterController } from "@/components/admin/partnerMaster/usePartnerMasterController";

export default function PartnerMasterSection() {
  const { i18n } = useI18n();
  const partnerText = i18n.admin.partnerMaster;
  const controller = usePartnerMasterController(partnerText);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-visible rounded-[32px] border border-stone-200 bg-white/95 p-5 shadow-sm backdrop-blur md:h-full md:max-h-full md:overflow-hidden md:p-5 xl:p-6">
      <PartnerMasterHeader onOpenCreateModal={controller.openCreateModal} />

      <PartnerMasterSummaryCards
        summary={controller.listViewModel.summary}
        filteredSummary={controller.listViewModel.filteredSummary}
        hasFilter={controller.listViewModel.hasSearch || controller.selectedStatus !== "all" || !controller.selectedTypes.includes("all")}
      />


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
        className="mt-4 min-h-[360px] md:min-h-0 md:flex-1"
        items={controller.listViewModel.items}
        isLoading={controller.isLoadingPartners}
        onEditPartner={controller.openEditModal}
      />

      <PartnerMasterFormModal
        open={controller.isModalOpen}
        editingPartnerId={controller.editingPartnerId}
        draft={controller.draft}
        formError={controller.formError}
        isSubmitting={controller.isSavingPartner}
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
