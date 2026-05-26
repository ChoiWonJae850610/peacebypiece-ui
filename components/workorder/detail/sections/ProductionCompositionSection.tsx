import { useI18n } from "@/lib/i18n";
import { formatProductionCompositionSummary } from "@/lib/workorder/detail/detailFormatting";
import MaterialSection from "@/components/workorder/detail/sections/MaterialSection";
import OutsourcingSection from "@/components/workorder/detail/sections/OutsourcingSection";
import { SectionHeader, type EditableCell, type EditableSectionKey } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Material, Outsourcing } from "@/types/workorder";

export default function ProductionCompositionSection({
  materials,
  outsourcing,
  open,
  onToggle,
  materialOpen,
  outsourcingOpen,
  onToggleMaterial,
  onToggleOutsourcing,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAddMaterial,
  onRemoveMaterial,
  onAddOutsourcing,
  onRemoveOutsourcing,
  materialVendorOptionsById,
  outsourcingVendorOptionsById,
  outsourcingProcessOptions,
  locked = false,
}: {
  materials: Material[];
  outsourcing: Outsourcing[];
  open: boolean;
  onToggle: () => void;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
  onAddOutsourcing: () => void;
  onRemoveOutsourcing: (id: string) => void;
  materialVendorOptionsById: Record<string, string[]>;
  outsourcingVendorOptionsById: Record<string, string[]>;
  outsourcingProcessOptions: string[];
  locked?: boolean;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.productionComposition;
  const summary = formatProductionCompositionSummary(materials, outsourcing, i18n);

  return (
    <div className="overflow-hidden rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm xl:p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-3 grid gap-3">
          <MaterialSection
            materials={materials}
            open={materialOpen}
            onToggle={onToggleMaterial}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={onStartEdit}
            onCommitEdit={onCommitEdit}
            onCancelEdit={onCancelEdit}
            onAdd={onAddMaterial}
            onRemove={onRemoveMaterial}
            vendorOptionsById={materialVendorOptionsById}
            locked={locked}
          />
          <OutsourcingSection
            outsourcing={outsourcing}
            open={outsourcingOpen}
            onToggle={onToggleOutsourcing}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={onStartEdit}
            onCommitEdit={onCommitEdit}
            onCancelEdit={onCancelEdit}
            onAdd={onAddOutsourcing}
            onRemove={onRemoveOutsourcing}
            vendorOptionsById={outsourcingVendorOptionsById}
            processOptions={outsourcingProcessOptions}
            locked={locked}
          />
        </div>
      ) : null}
    </div>
  );
}
