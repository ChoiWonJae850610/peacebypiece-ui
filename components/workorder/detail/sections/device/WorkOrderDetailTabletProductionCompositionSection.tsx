import { useI18n } from "@/lib/i18n";
import { SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import WorkOrderDetailTabletMaterialSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletMaterialSection";
import WorkOrderDetailTabletOutsourcingSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletOutsourcingSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ProductionCompositionProps = WorkOrderDetailViewModel["productionCompositionProps"];

export default function WorkOrderDetailTabletProductionCompositionSection(props: ProductionCompositionProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.productionComposition;
  const common = i18n.workorder.ui.common;
  const materialCount = props.materials.length;
  const outsourcingCount = props.outsourcing.length;
  const materialTotal = props.materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const outsourcingTotal = props.outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = [
    copy.summaryMaterialCount.replace("{count}", String(materialCount)),
    copy.summaryOutsourcingCount.replace("{count}", String(outsourcingCount)),
    copy.summaryTotal.replace("{total}", `${(materialTotal + outsourcingTotal).toLocaleString()}${common.currencySuffix}`),
  ].join(" · ");

  return (
    <section className="overflow-hidden rounded-2xl bg-stone-50 p-4">
      <SectionHeader title={copy.title} summary={summary} open={props.open} onToggle={props.onToggle} />
      {props.open ? (
        <div className="mt-4 grid gap-4">
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
            vendorOptionsById={props.materialVendorOptionsById}
            locked={props.locked}
          />
          <WorkOrderDetailTabletOutsourcingSection
            outsourcing={props.outsourcing}
            open={props.outsourcingOpen}
            onToggle={props.onToggleOutsourcing}
            editingCell={props.editingCell}
            editingValue={props.editingValue}
            onStartEdit={props.onStartEdit}
            onCommitEdit={props.onCommitEdit}
            onCancelEdit={props.onCancelEdit}
            onAdd={props.onAddOutsourcing}
            onRemove={props.onRemoveOutsourcing}
            vendorOptionsById={props.outsourcingVendorOptionsById}
            locked={props.locked}
          />
        </div>
      ) : null}
    </section>
  );
}
