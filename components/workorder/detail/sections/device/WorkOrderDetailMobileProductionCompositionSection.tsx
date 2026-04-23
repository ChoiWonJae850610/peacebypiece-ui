import { useI18n } from "@/lib/i18n";
import { SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import WorkOrderDetailMobileMaterialSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileMaterialSection";
import WorkOrderDetailMobileOutsourcingSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileOutsourcingSection";
import type { ReturnTypeBuildWorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ProductionCompositionProps = ReturnTypeBuildWorkOrderDetailViewModel["productionCompositionProps"];

export default function WorkOrderDetailMobileProductionCompositionSection(props: ProductionCompositionProps) {
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
    <section className="overflow-hidden rounded-2xl bg-stone-50 p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={props.open} onToggle={props.onToggle} />
      {props.open ? (
        <div className="mt-3 grid gap-3">
          <WorkOrderDetailMobileMaterialSection
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
          <WorkOrderDetailMobileOutsourcingSection
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
