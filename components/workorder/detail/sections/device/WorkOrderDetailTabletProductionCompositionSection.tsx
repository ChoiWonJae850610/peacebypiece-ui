import { useI18n } from "@/lib/i18n";
import { formatProductionCompositionSummary } from "@/lib/workorder/detail/detailFormatting";
import WorkOrderDetailTabletMaterialSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ProductionCompositionProps = WorkOrderDetailViewModel["productionCompositionProps"];

export default function WorkOrderDetailTabletProductionCompositionSection(props: ProductionCompositionProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.productionComposition;
  const summary = formatProductionCompositionSummary(props.materials, [], i18n);

  return (
    <WorkOrderDetailTabletMaterialSection
      materials={props.materials}
      open={props.open}
      onToggle={props.onToggle}
      editingCell={props.editingCell}
      editingValue={props.editingValue}
      onStartEdit={props.onStartEdit}
      onCommitEdit={props.onCommitEdit}
      onCancelEdit={props.onCancelEdit}
      onAdd={props.onAddMaterial}
      onRemove={props.onRemoveMaterial}
      onRemoveZeroQuantity={props.onRemoveZeroQuantityMaterials}
      onSaveDraft={props.onSaveMaterialDraft}
      vendorOptionsById={props.materialVendorOptionsById}
      locked={props.locked}
      title={copy.title}
      summary={summary}
    />
  );
}
