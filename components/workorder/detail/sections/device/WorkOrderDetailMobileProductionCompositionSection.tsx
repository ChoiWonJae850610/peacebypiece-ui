import { useI18n } from "@/lib/i18n";
import { formatProductionCompositionSummary } from "@/lib/workorder/detail/detailFormatting";
import WorkOrderDetailMobileMaterialSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileMaterialSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ProductionCompositionProps = WorkOrderDetailViewModel["productionCompositionProps"];

export default function WorkOrderDetailMobileProductionCompositionSection(props: ProductionCompositionProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.productionComposition;
  const summary = formatProductionCompositionSummary(props.materials, [], i18n);

  return (
    <WorkOrderDetailMobileMaterialSection
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
