import { useI18n } from "@/lib/i18n";
import { formatProductionCompositionSummary } from "@/lib/workorder/detail/detailFormatting";
import { SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import WorkOrderDetailTabletMaterialSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ProductionCompositionProps = WorkOrderDetailViewModel["productionCompositionProps"];

export default function WorkOrderDetailTabletProductionCompositionSection(props: ProductionCompositionProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.productionComposition;
  const summary = formatProductionCompositionSummary(props.materials, [], i18n);

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={props.open} onToggle={props.onToggle} />
      {props.open ? (
        <div className="mt-3 grid gap-3">
          <WorkOrderDetailTabletMaterialSection
            materials={props.materials}
            open={props.materialOpen}
            onToggle={props.onToggleMaterial}
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
          />
        </div>
      ) : null}
    </section>
  );
}
