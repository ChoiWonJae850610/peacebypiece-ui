import PartnerFactoryRegistryModal from "@/components/workorder/PartnerFactoryRegistryModal";
import BasicInfoEditModal from "@/components/workorder/detail/modals/BasicInfoEditModal";
import OrderInspectionModal from "@/components/workorder/detail/modals/OrderInspectionModal";
import type { ReturnTypeUseWorkOrderDetailEditor } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailSharedModals({
  editor,
  currentInventoryQuantity,
}: {
  editor: ReturnTypeUseWorkOrderDetailEditor;
  currentInventoryQuantity: number;
}) {
  return (
    <>
      <OrderInspectionModal
        open={editor.inspectionModalOpen}
        orderEntries={editor.orderItems}
        currentInventoryQuantity={currentInventoryQuantity}
        onClose={editor.handleCloseInspectionModal}
        onApply={editor.handleApplyInspection}
      />

      <BasicInfoEditModal
        open={editor.basicInfoModalOpen}
        value={editor.basicInfoDraft}
        onChange={editor.setBasicInfoDraft}
        onClose={editor.handleCloseBasicInfoModal}
        onSave={editor.handleSaveBasicInfoModal}
      />

      <PartnerFactoryRegistryModal
        open={editor.registryModalOpen}
        initialType={editor.registryType}
        onClose={editor.closeRegistryModal}
        onSave={editor.handleRegistrySave}
      />
    </>
  );
}
