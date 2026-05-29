"use client";

import { useI18n } from "@/lib/i18n";
import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import PartnerMasterFormModal from "@/components/admin/partnerMaster/PartnerMasterFormModal";
import PartnerMasterHeader from "@/components/admin/partnerMaster/PartnerMasterHeader";
import PartnerMasterList from "@/components/admin/partnerMaster/PartnerMasterList";
import PartnerMasterSummaryCards from "@/components/admin/partnerMaster/PartnerMasterSummaryCards";
import { togglePartnerFilterSelection } from "@/lib/admin/partner";
import { usePartnerMasterController } from "@/components/admin/partnerMaster/usePartnerMasterController";

export type PartnerMasterCapabilities = {
  canCreate?: boolean;
  canUpdate?: boolean;
};

type PartnerMasterSectionProps = {
  capabilities?: PartnerMasterCapabilities;
};

export default function PartnerMasterSection({ capabilities }: PartnerMasterSectionProps = {}) {
  const { i18n } = useI18n();
  const partnerText = i18n.admin.partnerMaster;
  const controller = usePartnerMasterController(partnerText, capabilities);

  return (
    <section className="flex min-h-fit touch-pan-y flex-col overflow-visible 2xl:min-h-0 2xl:flex-1 rounded-[34px] border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] p-4 shadow-[var(--pbp-shadow-elevated)] md:p-5 2xl:h-full 2xl:max-h-full 2xl:overflow-hidden 2xl:p-6">
      <div className="rounded-[30px] border border-[var(--pbp-border)] bg-[linear-gradient(135deg,var(--pbp-surface-soft),var(--pbp-surface))] p-4 shadow-sm md:p-5">
        <PartnerMasterHeader canCreate={controller.canCreatePartner} onOpenCreateModal={controller.openCreateModal} />

        <PartnerMasterSummaryCards summary={controller.listViewModel.summary} className="mt-5" />
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
        className="mt-4 min-h-fit touch-pan-y 2xl:min-h-0 2xl:flex-1"
        items={controller.listViewModel.items}
        isLoading={controller.isLoadingPartners}
        canUpdate={controller.canUpdatePartner}
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
        canEdit={controller.canSubmitPartner}
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
