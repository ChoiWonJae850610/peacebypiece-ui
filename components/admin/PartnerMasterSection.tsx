"use client";

import { useI18n } from "@/lib/i18n";
import ToastMessage from "@/components/common/ToastMessage";
import PartnerMasterFilters from "@/components/admin/partnerMaster/PartnerMasterFilters";
import PartnerMasterFormModal from "@/components/admin/partnerMaster/PartnerMasterFormModal";
import { Plus } from "lucide-react";
import { AdminButton } from "@/components/admin/common/AdminButton";
import WaflPageHero from "@/components/admin/common/WaflPageHero";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import PartnerMasterList from "@/components/admin/partnerMaster/PartnerMasterList";
import PartnerMasterSummaryCards from "@/components/admin/partnerMaster/PartnerMasterSummaryCards";
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
    <section className="flex min-h-fit w-full touch-pan-y flex-col gap-4 overflow-visible overscroll-auto">
      <WaflPageHero
        eyebrow={partnerText.header.eyebrow || "Partner network"}
        title={partnerText.header.title}
        description={partnerText.header.description}
        actions={
          controller.canCreatePartner ? (
            <AdminButton
              type="button"
              onClick={controller.openCreateModal}
              variant="primary"
              size="sm"
              className="h-8 min-h-8 w-full rounded-full px-3 text-[12px] md:w-auto"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{partnerText.header.createPartner}</span>
            </AdminButton>
          ) : null
        }
      >
        <PartnerMasterSummaryCards summary={controller.listViewModel.summary} className="mt-0" />
      </WaflPageHero>

      <WaflSectionPanel
        eyebrow={partnerText.list.eyebrow || "PARTNER LIST"}
        title={partnerText.list.title || "업체 목록"}
        description={partnerText.list.description || "공장, 원단·부자재, 외주 거래처 정보를 한 목록에서 확인합니다."}
        className="min-h-fit touch-pan-y overflow-visible overscroll-auto"
        bodyClassName="pt-3"
      >
        <PartnerMasterFilters
          searchTerm={controller.searchTerm}
          onSearchTermChange={controller.setSearchTerm}
          filterOptions={controller.listViewModel.filterOptions}
          selectedType={controller.selectedTypes[0] ?? "all"}
          onTypeChange={(value) => controller.setSelectedTypes([value])}
          selectedStatus={controller.selectedStatus}
          onStatusChange={controller.setSelectedStatus}
        />

        <PartnerMasterList
          className="mt-3 min-h-fit touch-pan-y overflow-visible overscroll-auto"
          items={controller.listViewModel.items}
          isLoading={controller.isLoadingPartners}
          canUpdate={controller.canUpdatePartner}
          onEditPartner={controller.openEditModal}
        />
      </WaflSectionPanel>

      <ToastMessage message={controller.toastMessage} tone={controller.toastTone} eventKey={controller.toastEventKey} />

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
